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
    res.sendfile('static/index.html');
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

/* The remaining routes are to keep the app a bit safer. They are not needed. 

// Do not serve incorrect html files
app.get('*.html',function noServe(req,res,next){
    res.redirect('/');
});

/*
//The 404 Route (ALWAYS Keep this as the last route)
app.use(function(req,res){
    res.redirect('/');
});*/


// ========================
// === Socket.io server ===
// ========================
var io = require("socket.io").listen(8888,{ log: false });

// ** GAME **

var playerData = new Object();
var playerCount = 0;
var players = 2;
var destroyedRocks = [];
var powerupDropChance = 0.4;

var game = io.of('/game').on("connection", function (socket) {
  if (++playerCount > players)
	return;
	
  console.log("Player ", playerCount, " connected");
  
  // send connected message to set up client side
  socket.emit("connected", {id: socket.id, player: playerCount.toString(), numPlayers: players, map: map1, mapdata: map1data});
  
  // save new player
  playerData[socket.id] = {x: map1positions[playerCount].x, y: map1positions[playerCount].y, hp: 100, powerups: []};

  // if all players connect, start game
  if (playerCount === players) {
	game.emit("start", {});
  }
  
  socket.on("sendPosition", function (data) {
	playerData[data.id] = data.player;
	socket.broadcast.emit("receivePosition", data);
  });

  socket.on("bombDropped", function (data) {
    socket.broadcast.emit("placeBomb", data);
  });
  
  socket.on("powerupTaken", function (data) {
    socket.broadcast.emit("removePowerup", data);
  });
  
  socket.on("rockDestroyed", function (data) {
	if (destroyedRocks.indexOf(data.rock.x + "," + data.rock.y) === -1) {
		destroyedRocks.push(data.rock.x + "," + data.rock.y);
		if (Math.random() < powerupDropChance) {
			game.emit("placePowerup", {x: data.rock.x, y: data.rock.y, power: "bullet"});
		}
	}
  });

  socket.on("bulletFired", function (data) {
    socket.broadcast.emit("fireBullet", data);
  });

  socket.on("sendDeath", function (data) {
	socket.emit("respawn", {});
	playerData[data.id] = {x: map1positions[parseInt(data.player)].x, y: map1positions[parseInt(data.player)].y, hp: 100, powerups: []};
	socket.broadcast.emit("playerDied", {id: data.id, playerNum: data.player, x: map1positions[parseInt(data.player)].x, y: map1positions[parseInt(data.player)].y});  
  });

  socket.on("disconnect", function () {
	delete playerData[socket.id];
	socket.broadcast.emit("playerLeft", {id: socket.id});
  });
});

var map1data = {width: 800, height: 800, block: 50, maxPlayers: 4};
var map1positions = [{},
					 {x: 175, y: 175},
					 {x: 625, y: 175},
					 {x: 175, y: 625},
					 {x: 625, y: 625}];
var map1 = [["O", "O", "R", "O", "O", "R", "O", "O", "O", "R", "O", "O", "O", "O", "R", "O"],
			["R", "O", "O", "R", "O", "O", "O", "R", "O", "O", "R", "O", "O", "R", "O", "O"],
			["O", "R", "O", "O", "O", "R", "O", "O", "O", "O", "O", "O", "O", "O", "O", "R"],
			["O", "O", "O", "1", "O", "O", "O", "O", "O", "R", "O", "O", "2", "O", "O", "O"],
			["O", "R", "O", "O", "O", "O", "O", "R", "O", "O", "O", "O", "O", "O", "O", "R"],
			["O", "O", "R", "O", "O", "R", "O", "O", "O", "O", "R", "O", "O", "R", "O", "O"],
			["R", "O", "O", "O", "O", "O", "R", "R", "R", "O", "O", "O", "O", "O", "R", "O"],
			["O", "R", "O", "R", "O", "O", "R", "R", "R", "O", "O", "O", "R", "O", "O", "O"],
			["O", "O", "O", "O", "O", "O", "R", "R", "R", "O", "R", "O", "O", "O", "O", "R"],
			["O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "R", "O", "O"],
			["O", "R", "O", "O", "R", "O", "O", "R", "O", "O", "O", "R", "O", "O", "R", "O"],
			["O", "O", "O", "O", "O", "O", "O", "O", "O", "R", "O", "O", "O", "O", "O", "O"],
			["R", "R", "O", "3", "O", "O", "R", "O", "O", "O", "O", "O", "4", "O", "O", "R"],
			["O", "O", "O", "O", "O", "O", "O", "O", "O", "R", "O", "O", "O", "O", "O", "O"],
			["O", "R", "O", "O", "O", "R", "O", "O", "O", "O", "R", "O", "O", "R", "O", "O"],
			["O", "O", "O", "R", "O", "O", "R", "O", "R", "O", "O", "O", "R", "O", "R", "O"]];


// ** LOBBY	**	

var IDToPlayer = new Object();
var lobbyPlayers = [];

var lobby = io.of('/lobby').on('connection', function (socket) {
    socket.on('joined',function(data){
        if(lobbyPlayers.indexOf(data.username) !== -1 && lobbyPlayers.indexOf(data.username) === data.username.length){
            // Sends to everybody, only needs to send to the 2 ppl
            lobby.emit('twoInstances', data);
        }
        else {
            lobbyPlayers.push(data.username);
            IDToPlayer[socket.id] = data.username;
            lobby.emit('receivePlayers', {
                players: lobbyPlayers
            });
        }
    });

    socket.on('sendChat', function(data){
        lobby.emit('receiveChat',{
            user : data.username,
            msg : data.msg
        });
    });

    socket.on('findMatch', function(data){
        socket.emit('joinGame');
    });
    

    socket.on('disconnect', function(data){
        // If not already disconnected ie: two instances.
        if(lobbyPlayers.indexOf(IDToPlayer[socket.id]) !== -1){
            lobbyPlayers.splice(lobbyPlayers.indexOf(IDToPlayer[socket.id]),1);
            delete IDToPlayer[socket.id];
            lobby.emit('receivePlayers', {
                players: lobbyPlayers
            });
         }
    });
});

