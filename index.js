const express = require('express')
const app = express();
const fs = require("fs");
var LOCAL = null;
var HOME = null;
var http = null;
var config = null;
var begin=false;
const configFile = 'config/config.json';

try {
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile))
  }
} catch(err) {
  console.error(err)
}

if ('LOCAL' in process.env) { 
  LOCAL = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  }
  http = require('https').createServer(LOCAL, app);
} else http = require('http').createServer(LOCAL, app);

const io = require('socket.io')(http);

app.use('/', express.static('public'))
app.use('/records', express.static('db'))

app.get('/api/login',function(req,res) {
  if (config && 'key' in config) {
    if (config.key === req.query.key) res.json({ status: "success" })
    else res.json({ status: "authentication failure" })
  } else {
    try {
      if (req.query.key !== null && req.query.key.length > 3) {
        config = { key: req.query.key};
        fs.writeFileSync(configFile, JSON.stringify(config))
        res.json({ status: "success" })
      } else res.json({ status: "authentication failure" })
    } catch (err) {
      console.error(err)
    }
  }
});

io.on('connection', (socket) => {
  console.log(socket.handshake.query.from + ' connected');
  if (socket.handshake.query.from === "home") HOME = socket.id
  if (HOME) socket.to(HOME).emit('action', {
    type: socket.handshake.query.type,
    position: socket.handshake.query.from,
    record: socket.handshake.query.record,
    name: "connect"
  });
  socket.on('disconnect', () => {
    console.log(socket.handshake.query.from + ' disconnected');
    if (HOME) socket.to(HOME).emit('action', {
      type: socket.handshake.query.type,
      position: socket.handshake.query.from,
      record: socket.handshake.query.record,
      name: "disconnect"
    });
  });


  socket.on('data', (msg) => {
    if (msg.rec !== 'unknown') {
      
      try {
          if(begin==false){
          fs.writeFileSync('db/' + msg.t.replace(' ', '-') + '-' + msg.rec + '.txt', JSON.stringify(msg) + '\n', { flag: 'w' });
          begin=true;
          }else{fs.writeFileSync('db/' + msg.t.replace(' ', '-') + '-' + msg.rec + '.txt', JSON.stringify(msg) + '\n', { flag: 'a+' })}
      } catch (err) {
        console.error(err)
      }
    }
    if (HOME) socket.to(HOME).emit('data', msg);
  });


  socket.on('punch',(msg)=>{
    if(msg==true){
    console.log('coup', msg);
    }
  });



  socket.on('action', (msg) => {
    console.log(JSON.stringify(msg))
    if (HOME) socket.to(HOME).emit('action', msg);
  });
});



http.listen(process.env.PORT || 3000, () => {
});


/*const allFileContents = fs.readFileSync('./db/ref.json', 'utf-8');
allFileContents.split(/\r?\n/).forEach(line =>  {
  console.log(`Line from file: ${line}`);
});*/


  