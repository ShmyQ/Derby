// ========================
// ==== Express server ====
// ========================
/* START UP
 C:\mongodb\bin\mongod.exe --dbpath c:\Users\Adam\term-project\mongo
 node app.js
*/

var express = require("express");
var app = express();
var useragent = require('express-useragent');

// Controls interaction with mongo
var mongoExpressAuth = require('mongo-express-auth');

var mongoExpressAuthConfig = {
    mongo: { 
        dbName: 'DerbyTT',
        collectionName: 'accounts'
    }
}

//===========================
//  init
//===========================

mongoExpressAuth.init(mongoExpressAuthConfig, function(){
    console.log('mongoExpressAuth initialized...');
});


app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(useragent.express());
app.use(express.session({ secret: 'teamgamerssecretmsg' }));

app.listen(8889);

//===========================
//  Routes
//===========================

require('./loginRoutes.js')(mongoExpressAuth, app);
require('./mobileDesktopRouter.js')(mongoExpressAuth,app);

app.get('/',function(req,res){
    response.sendfile('static/login.html');
});
    
app.get('/db', function(req, res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else 
                res.send(result); // NOTE: for test only, remove later
        });   
    });


app.get('/game', function(req, res){
    res.sendfile('static/game.html');
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

/* The remaining routes are to keep the app a bit safer. They are not needed. */

// Do not serve incorrect html files
app.get('*.html',function noServe(req,res,next){
    res.redirect('/');
});

//The 404 Route (ALWAYS Keep this as the last route)
app.use(function(req,res){
    res.redirect('/');
});

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

var lobbyPlayers = [];

var chat = io.of('/chat').on('connection', function (socket) {
    lobbyPlayers.push(socket.id);
    socket.emit('receivePlayers', {
        players: lobbyPlayers
    });
    chat.emit('joinLobby', {
        playerName: socket.id
    });
  });
