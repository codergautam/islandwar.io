import { EventEmitter } from "eventemitter3";

export default class MySocket extends EventEmitter {
  id: string;
  socket: WebSocket;
  constructor(socket) {
    super();
    this.socket = socket;

    this.socket.onmessage = (e) => {
      console.log('onmessage');
      var rec = JSON.parse(e.data);
      if(rec.t == "id") this.id = rec.d;
      console.log(rec);
      this.emit(rec.t, rec.d);
    };
  }
  send(...args) {
  //  console.log('emit');
    if(args.length == 2) {
      this.socket.send(JSON.stringify({
        t: args[0],
        d: args[1]
      }));
    } else {
      console.trace("TOO MUCH DATA");
    }
  }
  disconnect() {
    this.socket.close();
  }
}