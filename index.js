const express = require('express')
const app = express();
const fs = require("fs");
var LOCAL = null;
var HOME = null;

if ('LOCAL' in process.env) LOCAL = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
}
const http = require('https').createServer(LOCAL, app);
const io = require('socket.io')(http);

app.use('/', express.static('public'))

io.on('connection', (socket) => {
  console.log(socket.handshake.query.from + ' connected');
  if (socket.handshake.query.from === "home") HOME = socket.id
  if (HOME) socket.to(HOME).emit('action', {
    type: socket.handshake.query.type,
    position: socket.handshake.query.from,
    name: "connect"
  });
  socket.on('disconnect', () => {
    console.log(socket.handshake.query.from + ' disconnected');
    if (HOME) socket.to(HOME).emit('action', {
      type: socket.handshake.query.type,
      position: socket.handshake.query.from,
      name: "disconnect"
    });
  });
  socket.on('data', (msg) => {
    if (HOME) socket.to(HOME).emit('data', msg);
  });
  socket.on('action', (msg) => {
    console.log(msg.position + " " + msg.name)
    if (HOME) socket.to(HOME).emit('action', msg);
  });
});

http.listen(process.env.PORT || 3000, () => {
});
