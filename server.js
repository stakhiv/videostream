var WebSocketServer = require('ws').Server,
  http = require('http'),
  express = require('express'),
  app = express();

app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
server.listen(8080);

var wss = new WebSocketServer({server: server});


var CLIENTS_COUNT = 0;
var CLIENTS = {};
var PLAYER;

wss.on("connection", function(socket) {
  CLIENTS[++CLIENTS_COUNT] = socket;
  socket.id = CLIENTS_COUNT;

  socket.on("close", function() {
    delete CLIENTS[this.id];
  });

  socket.on("message", function(message) {
    PLAYER = socket;
    for(var i in CLIENTS) {
      if (CLIENTS[i] !== PLAYER) {
        wsSendBinary(CLIENTS[i], message);
      }
    }
  });
});

function wsSendBinary(socket, data) {
  var uint8Packet = new Uint8Array(data.length);
  for(var i = 0, len = data.length; i < len; i++) {
    uint8Packet[i] = data.readUInt8(i);
  }
  socket.send(uint8Packet, {binary: true});
}
