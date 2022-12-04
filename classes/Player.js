const e = require("express");
const idgen = require("../helpers/idgen");
const roomlist = require("../helpers/roomlist");

const Bullet = require("./Bullet");

const levels = require("../helpers/levels")


class Player {
  constructor(name, id=idgen(), socket=undefined, mouseMove=true, team="none") {
    this.name = name;
    this.id = id;
    this.roomId = null;
    this.socket = socket;
    this.pos = {
      x: 0,
      y: 0,
    };
    this.speed = 1;
    this.untilNextLevel = levels[0];
    this.speedMultiplier = 1;
    this.down = false;
    this.spawnTime = Date.now();
    this.peppers = 0;
    this.shotDragons = 0;
    this.lastHit = Date.now();
    this.whoLastHit = null;
    this.healAmount = 0.005;
    this.needsFlip = false;
    this.lastShoot = 0;
    this.mouseMove = mouseMove;

    this.force = 0.5;

    this.bulletLevel = 1;
    this.speedLevel = 1;
    this.sizeLevel = 1;
    this.healthLevel = 1;
    this.canFly = false;

    this.level = 1;


    this.queuedForDeath = false;

    this.health = 100;
    this.maxHealth = 100;
    this.damage = 7;

    this.bodySize = 100 + (this.sizeLevel == 1 ? 0 : this.sizeLevel == 2 ? 20 : 40);


    this.team = team

    this.hit = false;
    this.lookAngle = 0;
    this.bulletIds = new Set();
    this.lastFullSendTo = new Set();

    this.controller = {
      left: false,
      right: false,
      up: false,
      down: false,
    };
  }
  get socketHelper() {
    return {
      emit: (event, data) => {
        var send = {
          t: event,
          d: data,
        };
        send = JSON.stringify(send);
        this.socket.send(send);
      },
      to: (roomId) => {
      return {
         emit: (event, data) => {
        var send = {
          t: event,
          d: data,
        };

        send = JSON.stringify(send);
        roomlist.getRoom(roomId).players.forEach((p) => {
          if(p.id != this.id) {
            p.socket.send(send);
          }
        })
      }
        }
      }
    }
  }
  joinRoom(room) {
    this.roomId = room.id;
    var mainIsland = room.islands[0];
    var randomPos = mainIsland.getRandomPoint(0.4);
    this.pos = randomPos;

    if(this.team == "none") {
    // find team with least players
    var totalPlayers = room.players.size;
    var redCount = Array.from(room.players.values()).filter((p) => p.team == "red").length;
    if(redCount > totalPlayers / 2) {
      this.team = "blue";
    } else if(redCount < totalPlayers / 2) {
      this.team = "red";
    } else {
      this.team = Math.random() > 0.5 ? "red" : "blue";
    }
    console.log("total players: " + totalPlayers, "red players: " + redCount, "chosen team: " + this.team);

  }

    this.socketHelper.emit("joinRoom", room.id);
  }
  updateController(controller) {
    //check if controller valid
    if(!controller || controller.left === undefined || controller.right === undefined || controller.up === undefined || controller.down === undefined) {
      return;
    }
    //check if any extra properties are set
    if(Object.keys(controller).length > 4) {
      return;
    }

    this.controller = controller;
  }
  updateMouse(mouseAngle, distance = 0.5, needsFlip = false) {
    this.lookAngle = mouseAngle;
    // console.log(needsFlip);
    this.needsFlip = needsFlip;
    this.force = Math.max(0, Math.min(distance, 1));
  }
  getFirstSendObject() {
    return {
      name: this.name,
      id: this.id,
      speed: this.speed,
      team: this.team,

      pos: this.pos,
      lookAngle: this.lookAngle,
      untilNextLevel: this.untilNextLevel,
      level: this.level,
      bodySize: this.bodySize,
      maxHealth: this.maxHealth,
      health: this.health,
      canFly: this.canFly,

      joinTime: this.spawnTime,

    }
  }
  getSendObject() {
    return {
      id: this.id,
      pos: this.pos,
      lookAngle: this.lookAngle,
      health: this.health,
      peppers: this.peppers,
      hit: this.hit,
      level: this.level,
      untilNextLevel: this.untilNextLevel,
      bodySize: this.bodySize,
      maxHealth: this.maxHealth,
      canFly: this.canFly,
    };
  }
  getCorners(extraDiff = 1) {
  //  // get each corner of the player's body
  //  // make sure it's rotated correctly

  //   var corners = [];
  //   var angle = this.lookAngle+0.785398;
  //   var x = this.pos.x;
  //   var y = this.pos.y;
  //   var length = this.bodySize * extraDiff;

  //   var cos = Math.cos(angle);
  //   var sin = Math.sin(angle);

  //   corners.push({
  //     x: x + cos * length,
  //     y: y + sin * length,
  //   });
  //   corners.push({
  //     x: x - cos * length,
  //     y: y - sin * length,
  //   });
  //   corners.push({
  //     x: x + sin * length,
  //     y: y - cos * length,
  //   });
  //   corners.push({
  //     x: x - sin * length,
  //     y: y + cos * length,
  //   });
  //   // console.log(corners);
  //   return corners;

  throw new Error("No longer used");

  }
  getCenterPoint() {
    // var corners = this.getCorners();
    // //find center point
    // var x = 0;
    // var y = 0;
    // for(var i = 0; i < corners.length; i++) {
    //   x += corners[i].x;
    //   y += corners[i].y;
    // }
    // x /= corners.length;
    // y /= corners.length;
    // return {
    //   x,
    //   y,
    // }

    throw new Error("No longer used");
  }

  tick(tickDiff) {
    //move
    if(this.queuedForDeath) return;

    var levelMult = this.speedLevel == 1 ? 1.5 : this.speedLevel == 2 ? 2 : 3;
    if(!this.mouseMove) {
    // get angle from controller
    var angle = 0;

    if(this.controller.down && this.controller.right) {
      angle += 0.785398;
    }
    else if(this.controller.down && this.controller.left) {
      angle += 2.35619;
    }
    else if(this.controller.up && this.controller.right) {
      angle += 5.49779;
    }
    else if(this.controller.up && this.controller.left) {
      angle += 3.92699;
    }
    else if(this.controller.down) {
      angle += 1.570796;
    }
    else if(this.controller.up) {
      angle += 4.712389;
    }
    else if(this.controller.right) {
      angle += 0;
    }
    else if(this.controller.left) {
      angle += 3.141593;
    }

    var isMoving = this.controller.left || this.controller.right || this.controller.up || this.controller.down;
    if(isMoving) {
    var speed = this.speed * this.speedMultiplier * levelMult;

    this.pos.x += Math.cos(angle) * speed * tickDiff * 0.18;
    this.pos.y += Math.sin(angle) * speed * tickDiff * 0.18;
    }
  } else

    if(this.mouseMove) {
    var speed = this.speed * this.speedMultiplier * levelMult;

    this.pos.x += Math.cos(this.lookAngle) * speed * tickDiff * 0.18 * this.force;
    this.pos.y += Math.sin(this.lookAngle) * speed * tickDiff * 0.18 * this.force;
    }

    const clamp = (min, max, value) => Math.max(min, Math.min(max, value));
    this.pos.x = clamp(-2000, 2000, this.pos.x);
    this.pos.y = clamp(-2000, 2000, this.pos.y);

    // this.maxHealth = 100 + (this.healthLevel == 1 ? 0 : this.healthLevel == 2 ? 40 : 100);

    if(this.untilNextLevel && this.peppers > this.untilNextLevel) {
      if(levels.length <= this.level) {
        this.canFly = true;
               if(this.health > 50) this.health = 50;
        this.maxHealth = 50
      } else {

      this.level++;
      this.untilNextLevel = levels[this.level-1];
      var choice = this.level % 4;
      if(choice == 0) {
        this.speedLevel++;
        // console.log("speed level up");
        this.socketHelper.emit("levelUp", "speed", this.speedLevel);
      } else if(choice == 1) {
        this.sizeLevel++;
        // console.log("size");
        this.socketHelper.emit("levelUp", "size", this.sizeLevel);
      } else if(choice == 2) {
        this.bulletLevel++;
        // console.log("bullet");
        this.socketHelper.emit("levelUp", "bullet", this.bulletLevel);
      } else if(choice == 3) {
        this.healthLevel++;
        // console.log("health");
        this.socketHelper.emit("levelUp", "health", this.healthLevel);
                this.health =  this.maxHealth = 100 + (this.healthLevel == 1 ? 0 : this.healthLevel == 2 ? 40 : 70);

      }
    }
      // this.speedMultiplier = 1;
    }

    if(this.health < this.maxHealth) {
      if(Date.now() - this.lastHit > 5000) {
        //33 because 1000 / 30 (tick speed)
        this.health += this.maxHealth * this.healAmount * (tickDiff / 33);
      }
    }

    this.bodySize = 100 + (this.sizeLevel == 1 ? 0 : this.sizeLevel == 2 ? 50 : 100);
    // console.log(this.bodySize);/

    // this.socket.emit("corners", [this.pos])
    //shoot
    //cloning the object is necessary because the object is changed in the tick function
    var pos =JSON.parse(JSON.stringify(this.pos));

    var newAngle = this.lookAngle;
   pos.x += (Math.cos(newAngle + Math.PI / 4) * this.speed * (75));
    pos.y += (Math.sin(newAngle + Math.PI / 4) * this.speed * (75));
    // pos.x -= Math.cos(Math.PI) * this.speed * (150);
    // pos.y -= Math.sin(Math.PI) * this.speed * (150);
    // this.socket.emit("test", pos);

    var cooldown = this.bulletLevel == 1 ? 1000/10 : this.bulletLevel == 2 ? 1000/5 : 1000/3;
    if(!this.down || Date.now() - this.lastShoot < cooldown) return;
    var room = roomlist.getRoom(this.roomId);
    this.lastShoot = Date.now();
    this.down = false;
    room.bullets.push(new Bullet(this, 0));

    if(this.bulletLevel >= 2) {
    room.bullets.push(new Bullet(this, 10));
    room.bullets.push(new Bullet(this, -10));
    }
    // console.log(this.bulletLevel);

    if(this.bulletLevel >= 3) {
    room.bullets.push(new Bullet(this, 20));
    room.bullets.push(new Bullet(this, -20));
    // console.log("shoot");
    }


  }
}
module.exports = Player;