const express = require("express");
var http = require("http");
require("dotenv").config();

const app = express();
var process = require("process");
const ws = require("./helpers/ws");


app.use(express.json());

var server = http.createServer(app);
var expressWs = require('express-ws')(app, server);

ws.set(expressWs);



const Player = require("./classes/Player");
const Room = require("./classes/Room");

const roomlist = require("./helpers/roomlist");
const scan = require("./helpers/scan");

app.use("/", express.static(__dirname + "/dist"));
app.use("/", express.static(__dirname+"/public"));
const axios = require("axios");
const { randomUUID } = require("crypto");

const recaptcha = true;
// require("dotenv").config()


// app.get("/assets/videos/intro.mp4", (req, res, next) => {
//   setTimeout(() => {
//     next();
//   }, 1000);
// })

app.use("/assets", express.static(__dirname+"/assets"));

roomlist.setRoom(new Room())

app.get("/teams", (req, res) => {
  // console.log("GET /teams");
  // setTimeout(() => {
  var room = roomlist.getAllRooms()[0];
  var redPlayers = 0;
  var bluePlayers = 0;
  [...room.players.values()].forEach(player => {
    if(player.team == "red") redPlayers++;
    else if(player.team == "blue") bluePlayers++;
  });
  res.send({
    red: {playerCount: redPlayers},
    blue: {playerCount: bluePlayers}
  });
// }, 1000)

})
function validate(data) {
  // check if json
  if(typeof data != "object") return false;
  if(!data.hasOwnProperty("t")) return false;
  if(!data.hasOwnProperty("d")) return false;
  return true;
}
app.ws("/ws", (ws, req) => { 

  ws.id = randomUUID();
  ws.room = null;

  ws.send(JSON.stringify({
    t: "id",
    d: ws.id
    }));

  ws.on("message", (data) => {
    // console.log("received: " + data);
     data = JSON.parse(data);

   if(!validate(data)) return;

    var type = data.t;
    var data = data.d;

    if(type == "go") {
      console.log("wowoowowowwoowowow")
      if(ws.room != null) return;
     var { name, team, mouseMove, thetoken} = data;
     if(!name || typeof name != "string") return;
     name = name.trim();
     if(scan(name).contains) {
       name = "*".repeat(name.length);
     }
     if(!thetoken) return ws.close();
 
     const joinThemIn = () => {
           if(name.length == 0) return ws.disconnect();
 
     if(!team || typeof team != "string") team = "red";
     if(team != "red" && team != "blue") team = "red";
 
     name = name.substring(0,16);
     var player = new Player(name, ws.id, ws, mouseMove);
     player.team = team;
     roomlist.getAllRooms()[0].addPlayer(player);
     ws.room = roomlist.getAllRooms()[0].id;
       console.log(ws.id +" joined!")
     }
 
     if(thetoken == process.env.bot) return joinThemIn();
     else {
         var send = {
     secret: process.env.captchaserver,
     response: thetoken,
   };
           axios
       .post(
         "https://www.google.com/recaptcha/api/siteverify?" +
     new URLSearchParams(send)
       )
       .then(async (f) => {
         f = f.data;
         if (!f.success) {
           console.log("Captcha failed " +  f["error-codes"].toString());
           if(!recaptcha) joinThemIn();
           return;
         }
         if (f.score < 0.3) {
           console.log("Captcha score too low");
           return;
         }
         joinThemIn();
       });
     }
    } else if(type == "controller") {
      var room = roomlist.getRoomByPlayerId(ws.id);
      if(!room) return;
      room.playerControllerUpdate(ws.id, data);
    } else if(type == "mouse") {
      var {mouseAngle, distance, needsFlip} = data;
      var room = roomlist.getRoomByPlayerId(ws.id);
      if(!room) return;
      room.playerMouseUpdate(ws.id, mouseAngle, distance, needsFlip);
    } else if(type == "down") {
      var room = roomlist.getRoomByPlayerId(ws.id);
      if(!room) return;
      room.playerDown(ws.id, data);
      console.log(ws.id + " down: " + data.down);
    }
  });

  ws.on("close", () => {
    var room = roomlist.getRoomByPlayerId(ws.id);
    if(room) {
      room.removePlayer(ws.id);
    }
    console.log(ws.id +" disconnected / closed");
  });
})



//tick rooms
var tps = 0;
var actps = 0;
var secondStart = Date.now();
setInterval(() => {
  roomlist.tickAll();
  tps++;
  if(Date.now() - secondStart > 1000) {
    // console.log("tps: " + tps);
    actps = tps;
    // console.log("TPS", actps)
    tps = 0;
    secondStart = Date.now();
  }
}, 1000/30);

server.listen(process.env.PORT || 3000, () => {
  console.log("server started");
});
