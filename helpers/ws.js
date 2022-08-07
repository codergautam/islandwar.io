var ws;
module.exports = {
  ws: undefined,
  set: (ws1) => {
    ws = ws1;
  },
  get: () => {
    return ws.getWss();
  },
  get helper() {
    return {
      to: (roomId) => {
        return {
          emit: (event, data) => {
            var clients = [...ws.getWss().clients];
            var send = {
              t: event,
              d: data,
            }
           if(event!="peppers" && event!="playerUpdate") console.log(event);
            send = JSON.stringify(send);
            
            clients.forEach((client) => {
              if (client.room == roomId) {
                client.send(send);
              }
            });
          }
        }
      }
    }
  }
};