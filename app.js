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

function mobileDesktopPrefixer(req){
    var reqPrefix = 'static/desktop/';
    if(req.useragent.isMobile)
        reqPrefix = 'static/mobile/';
        
    return reqPrefix;
}

// Index
app.get('/', function checkLogin(req,res,next){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err) {
            res.sendfile(mobileDesktopPrefixer(req) + "/login.html");
        }
        else
           res.sendfile(mobileDesktopPrefixer(req) + "/index.html");
    });
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
   mongoExpressAuth.checkLogin(req, res, function(err){
        if (err) {
            res.sendfile(mobileDesktopPrefixer(req) + "/login.html");
        }
        else
           res.sendfile(mobileDesktopPrefixer(req) + "/game.html");
    });
});

app.get('/favicon.ico', function(req,res){
    res.sendfile('favicon.ico');
});

app.use(express.static(__dirname + '/static/'));

// ========================
// === Socket.io server ===
// ========================
var io = require("socket.io").listen(8888,{ log: false });

// ** GAME **

// each players current playing data, key is the socket id
var playerData = new Object();

// array of all the games
var games = [];

// hash of socket ids to game number that they are in
var usersGame = new Object();

var powerupDropChance = 0.4;

var game = io.of('/game').on("connection", function (socket) {
  console.log("Player ", socket.id, " connected");

  var thisGame = games[usersGame[socket.id]];
  
  // send connected message to set up client side
  socket.emit("connected", {id: socket.id, player: thisGame.players.indexOf(socket).toString(), numPlayers: thisGame.players.length, map: map1, mapdata: map1data});

  // save new player
  playerData[socket.id] = {x: map1positions[playerCount].x, y: map1positions[playerCount].y, hp: 100, powerups: []};

  thisGame.connected++;
  // if all players connect, start game
  if (thisGame.connected === thisGame.players.length) {
	game.emit("start", {});
	setTimeout( function() { game.emit("endGame", {}); }, 60000);
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
	if (Math.random() < powerupDropChance) {
		game.emit("placePowerup", {x: data.x, y: data.y, power: "bullet"});
	}
	else
		game.emit("placePowerup", {x: data.x, y: data.y, power: "none"});
  });

  socket.on("bulletFired", function (data) {
    socket.broadcast.emit("fireBullet", data);
  });

  socket.on("hitPlayer", function (data) {
    socket.broadcast.emit("playerHit", data);
  });

  socket.on("damagedPlayer", function (data) {
    socket.broadcast.emit("damagePlayer", data);
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

var map1data = {width: 800, height: 800, gridx: 50, gridy: 50, blockx: 16, blocky: 16, maxPlayers: 4};
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

// tally of last game number to be given out
var gameNumber = 0;
// number of players waiting 
var newGamePlayerCount = 0;
// current game being made
var curGame = {players: [], connected: 0, id: 0};
var playersToStart = 2;

var lobby = io.of('/lobby').on('connection', function (socket) {
    socket.on('joined',function(data){
        if(lobbyPlayers.indexOf(data.username) !== -1 && lobbyPlayers[lobbyPlayers.indexOf(data.username)].length === data.username.length){
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
            msg : removeHTML(data.msg),
        });
    });

    socket.on('findMatch', function(data){
		curGame.players[newGamePlayerCount] = socket;
		newGamePlayerCount++;
		
		// if there are enough players waiting
		if (newGamePlayerCount === playersToStart) {
			gameNumber++;
		
			for (var i = 0; i < curGame.players.length; i++) {
				// tell each player to join
				curGame.players[i].emit('joinGame');
				
				// add hash from player id to game id
				usersGame[curGame.players[i].id] = gameNumber;
			}
			
			games[gameNumber] = curGame;
			
			// reset for next new game
			newGamePlayerCount === 0;
			curGame = {players: [], connected: 0, id: gameNumber};
		}
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

// ** LOBBY	HELPERS **

// Remove html tags (<*>)from chat
function removeHTML(input){
   return input.replace( /<.*?>/,'');
}
