const intersect = require("intersects");
const io = require("../helpers/io");  
const idgen = require("../helpers/idgen");
module.exports = class Island {
  constructor(shape, size, position, canBeCaptured = true) {
    this.shape = shape;
    this.size = size;
    this.pos = position;
    this.canBeCaptured = canBeCaptured;
    this.capturedBy = "none";
    this.captureState = 0;
    // state 0 = not capturing
    // state 1 = capturing
    // state 2 = captured
    this.capturingBy = 0.1;
    this.lastPepperGrew = Date.now();
    this.id = idgen();
    this.capturedPercentage = 0;
  }
  pepperGrew(room) {
    this.lastPepperGrew = Date.now();
    
    // check if captured
    if(this.capturedBy == "none") return;
    
    room.players.forEach(player => {
      if(player.team == this.capturedBy) {
        player.peppers += 1;
      }
    });

  }
  getSendObject() {
    return {
      shape: this.shape,
      size: this.size,
      pos: this.pos,
      capturedBy: this.capturedBy,
      id: this.id,
      capturedPercentage: this.capturedPercentage,
      capturingBy: this.capturingBy
    }
  }
  tick(diff, room) {
    if(!this.canBeCaptured) return;
    var players = Array.from(room.players.values()).filter(player => this.isIn(player.pos));
    if(this.lastPepperGrew + 1000 < Date.now()) this.pepperGrew(room);
    if(players.length < 1 && this.captureState == 1) {
      this.capturedPercentage -= (diff / 50) * 0.5;
      if(this.capturedPercentage <= 0) {
        this.capturedPercentage = 0;
        this.captureState = 0;
      }
      io.getio().to(room.id).emit("islandCapturing", this.id, this.capturingBy, this.capturedPercentage);

    }
    if(players.length < 1 && this.captureState == 2) {
      if(this.capturedPercentage >= 100 && this.capturingBy == this.capturedBy) return;
      this.capturedPercentage += (diff / 50) * 0.5;
      if(this.capturedPercentage >= 100) {
        this.capturedBy = this.capturingBy;
        io.getio().to(room.id).emit("islandCaptured", this.id, this.capturedBy);
      } else io.getio().to(room.id).emit("islandCapturing", this.id, this.capturingBy, this.capturedPercentage);

      // console.log(this.capturedPercentage);
      
    }
    if(players.length < 1) return;
    //make sure all players are in the same team
    var team = players[0].team;
    for(var i = 1; i < players.length; i++) {
      if(players[i].team != team) return;
    }
    if(this.capturedBy == team) return;
    // console.log(this.captureState);
    if(this.captureState == 0) {
      this.captureState = 1;
      this.capturedPercentage = 0;
      this.capturingBy = players[0].team;
      // console.log(this.capturingBy+ " is capturing island");
    } else if(this.captureState == 1 && this.capturingBy == team) {
      this.capturedPercentage += (diff / 50) * players.length;

      if(this.capturedPercentage >= 100) {
        this.capturedBy = team;
        this.captureState = 2;
        io.getio().to(room.id).emit("islandCaptured", this.id, this.capturedBy);
      } else {
        io.getio().to(room.id).emit("islandCapturing", this.id, this.capturingBy, this.capturedPercentage);
      }
    
    } else if(this.captureState == 1) {
      this.capturedPercentage -= (diff / 50) * players.length;
      if(this.capturedPercentage <= 0) {
        this.capturedPercentage = 0;
        this.captureState = 0;
      }
      io.getio().to(room.id).emit("islandCapturing", this.id, this.capturingBy, this.capturedPercentage);

    } else if(this.captureState == 2) {
    // console.log("island captured");
      if(team != this.capturingBy) this.capturedPercentage -= (diff / 50) * players.length;
      else this.capturedPercentage += (diff / 50) * players.length;
      this.capturedBy = "none";
      if(this.capturedPercentage <= 0) {
        this.capturedPercentage = 0;
        this.captureState = 0;
      }
      if(this.capturedPercentage >= 100) {
        this.capturedBy = team;
        this.captureState = 2;
      }
      io.getio().to(room.id).emit("islandCaptured", this.id, this.capturedBy);
      io.getio().to(room.id).emit("islandCapturing", this.id, this.capturingBy, this.capturedPercentage);
    }

  }
  getDomination() {
    var domination = {
      red: 0,
      blue: 0,
      none: 0
    }
    // if(this.captureState == 0) domination.none+=100;
    if(this.captureState == 1 || this.capturingBy != this.capturedBy) {
      if(this.capturingBy == "red") domination.red+=this.capturedPercentage;
      else if(this.capturingBy == "blue") domination.blue+=this.capturedPercentage;

      domination.none+=100-this.capturedPercentage;
    } else if(this.captureState == 2) {
      if(this.capturedBy == "red") domination.red+=100;
      else domination.blue+=100;
    }
    return domination;
  }
 isIn(pos) {
      return intersect.pointCircle(pos.x, pos.y, this.pos.x, this.pos.y, this.size/2); 
  }
}