// ========================
// ==== Express server ====
// ========================
/* START UP
 C:\mongodb\bin\mongod.exe --dbpath c:\Users\Adam\term-project\mongo
 node app.js
*/
var express = require("express");
var app = express();

var mongoExpressAuth = require('mongo-express-auth');

//===========================
//  init
//===========================

mongoExpressAuth.init({
    mongo: { 
        dbName: 'myApp',
        collectionName: 'accounts'
    }
}, function(){
    console.log('mongo ready!');
    app.listen(8889);
});

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'teamgamerssecretmsg' }));

//===========================
//  routes
//===========================

require('./loginRoutes.js')(mongoExpressAuth, app);
require('./mobileDesktopRouter.js')(mongoExpressAuth,app);


app.get('/', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err)
            res.sendfile('static/login.html');
        else
            res.sendfile('static/index.html');
    });
});

app.get('/db', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err)
            res.send(err);
        else {
            mongoExpressAuth.getAccount(req, function(err, result){
                if (err)
                    res.send(err);
                else 
                    res.send(result); // NOTE: direct access to the database is a bad idea in a real app
            });
        }
    });
});

app.get('/game', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        //if (err)
        //   res.sendfile('static/login.html');
        //else
            res.sendfile('static/game.html');
    });
});

app.get('/game2', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        //if (err)
        //   res.sendfile('static/login.html');
        //else
            res.sendfile('static/game2.html');
    });
});

app.get('/game3', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        //if (err)
        //   res.sendfile('static/login.html');
        //else
            res.sendfile('static/game3.html');
    });
});

app.use(express.static(__dirname + '/static/'));




// ========================
// === Socket.io server ===
// ========================

var io = require("socket.io").listen(8888,{ log: false });

var playerData = new Object();

io.sockets.on("connection", function (socket) {
  socket.emit("connected", {id: socket.id, x: 100, y: 100, players: playerData});
  socket.broadcast.emit("playerConnected", {id: socket.id, x: 100, y: 100});
  playerData[socket.id] = {x: 100, y: 100, hp: 100, powerups: []};

  socket.on("sendPosition", function (data) {
	playerData[data.id] = data.player;
	socket.broadcast.emit("receivePosition", data);
  });
  
  socket.on("bombDropped", function (data) {
    socket.broadcast.emit("placeBomb", data);
  });
  
  socket.on("sendDeath", function (data) {
	socket.emit("respawn", {x: 100, y: 100});
	playerData[data.id] = {x: 100, y: 100, hp: 100, powerups: []};
	socket.broadcast.emit("playerDied", {id: data.id, x:100, y:100});
  });
  
  socket.on("disconnect", function () {
	delete playerData[socket.id];
	socket.broadcast.emit("playerLeft", {id: socket.id});
  });
});
