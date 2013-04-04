// ========================
// ==== Express server ====
// ========================

var express = require("express");
var app = express();
app.use(express.bodyParser());

app.get("/static/:staticFilename", function (request, response) {
  response.sendfile("static/" + request.params.staticFilename);
});


app.listen(8889);

// ========================
// === Socket.io server ===
// ========================

var io = require("socket.io").listen(8888,{ log: false });

io.sockets.on("connection", function (socket) {
  socket.on("coords", function (data) {
    //socket.emit("status", {success: "true"});
    io.sockets.emit("drawcoords", {x: data.x + 20, y: data.y + 20});
  });
 

  socket.on("sendPosition", function (data) {
   socket.broadcast.emit("receivePosition", {player:socket.id, position:data});
  });
  
});
