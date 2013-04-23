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
// var playerCount = 0;
// var players = 2;
// var destroyedRocks = [];
// var powerupDropChance = 0.4; was removed in conflict, commenting out in case mistake

// array of all the games
var games = [];

// hash of socket ids to game number that they are in
var usersGame = new Object();

var powerupDropChance = 0.4;

var game = io.of('/game').on("connection", function (socket) {
  console.log("Player ", socket.id, " connected");

  /*temp++;
  socket.emit("connected", {id: socket.id, player: (temp).toString(), numPlayers: 1, map: map1, mapdata: map1data});

  if (temp === 1) {
	console.log("starting game");
	game.emit("start", {});
	setTimeout( function() { game.emit("endGame", {}); }, 60000);
  }*/


  socket.emit("getUsername", {});

  socket.on("username", function(data) {
	  var thisGame = games[usersGame[data.username]];
	  thisGame.sockets[data.username] = socket;
	  
	  var player = thisGame.players.indexOf(data.username) + 1;
	  
	  if (thisGame.started) {
	    // send connected message to set up client side
		socket.emit("connected", {id: socket.id, reconnecting: true, x: playerData[data.username].x, y: playerData[data.username].y, player: player.toString(), numPlayers: thisGame.players.length, map: map1, mapdata: map1data});
	  }
	  else {
		  // send connected message to set up client side
		  socket.emit("connected", {id: socket.id, reconnecting: false, x: map1positions[player].x/map1data.gridx, y: map1positions[player].y/map1data.gridy, player: player.toString(), numPlayers: thisGame.players.length, map: map1, mapdata: map1data});

		  // save new player
		  playerData[data.username] = {kills: 0, deaths: 0, x: map1positions[player].x, y: map1positions[player].y};

		  thisGame.connected++;
		  // if all players connect, start game
		  if (thisGame.connected === thisGame.players.length) {
			  console.log("starting game");
			  game.emit("start", {});
			  thisGame.started = true;
			  setTimeout( function() { game.emit("endGame", {}); }, 60000);
		  }
	  }
  });

  socket.on("sendPosition", function (data) {
	playerData[data.username].x = data.player.x;
	playerData[data.username].y = data.player.y;
	socket.broadcast.emit("receivePosition", data);
  });

  socket.on("bombDropped", function (data) {
    socket.broadcast.emit("placeBomb", data);
  });

  socket.on("powerupTaken", function (data) {
    socket.broadcast.emit("removePowerup", data);
  });

  socket.on("rockDestroyed", function (data) {
	console.log("Rock ", data.x, " ", data.y, " destroyed");
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

	playerData[data.username].deaths++;
	// suicide
	if (data.killer === 0)
		playerData[data.username].kills--;
	// give killer a kill
	else
		playerData[games[usersGame[data.username]].players[parseInt(data.killer) - 1]].kills++;

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
var map1 = [["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"],
			["W", "R", "O", "R", "O", "O", "O", "R", "O", "O", "R", "O", "O", "R", "O", "W"],
			["W", "O", "O", "O", "O", "R", "O", "O", "O", "O", "O", "O", "O", "O", "O", "W"],
			["W", "O", "O", "1", "O", "O", "O", "O", "O", "R", "O", "O", "2", "O", "O", "W"],
			["W", "R", "O", "O", "O", "O", "O", "R", "O", "O", "O", "O", "O", "O", "O", "W"],
			["W", "O", "R", "O", "O", "P", "P", "O", "P", "P", "R", "O", "O", "R", "O", "W"],
			["W", "O", "O", "O", "O", "P", "R", "R", "R", "P", "O", "O", "O", "O", "R", "W"],
			["W", "R", "O", "R", "O", "O", "R", "R", "R", "O", "O", "O", "R", "O", "O", "W"],
			["W", "O", "O", "O", "O", "P", "R", "R", "R", "P", "R", "O", "O", "O", "O", "W"],
			["W", "O", "O", "O", "O", "P", "P", "O", "P", "P", "O", "O", "O", "R", "O", "W"],
			["W", "R", "O", "O", "R", "O", "O", "R", "O", "O", "O", "R", "O", "O", "R", "W"],
			["W", "O", "O", "O", "O", "O", "O", "O", "O", "R", "O", "O", "O", "O", "O", "W"],
			["W", "R", "O", "3", "O", "O", "R", "O", "O", "O", "O", "O", "4", "O", "O", "W"],
			["W", "O", "O", "O", "O", "O", "O", "O", "O", "R", "O", "O", "O", "O", "O", "W"],
			["W", "R", "R", "O", "O", "R", "O", "O", "O", "O", "R", "O", "O", "R", "O", "W"],
			["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"]];



function newPowerup (xPos, yPos) {
    // TODO: for adding random powerups
    var rand = Math.random() * 2;
    if (rand < 1) {
        game.emit("placePowerup", {x: xPos, y: yPos, power: "bullet"});
    }
    else if (rand >= 1) {
        game.emit("placePowerup", {x: xPos, y: yPos, power: "invincible"});
    }
}


// ** LOBBY	**

var IDToPlayer = new Object();
var lobbyPlayers = [];

// tally of last game number to be given out
var gameNumber = 0;
// number of players waiting
var newGamePlayerCount = 0;
// current game being made
var curGame = {players: [], connected: 0, sockets: new Object(), id: 0, started: false};
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
		console.log("finding match");
		curGame.players[newGamePlayerCount] = data.username;
		curGame.sockets[data.username] = socket;
		newGamePlayerCount++;

		// if there are enough players waiting
		if (newGamePlayerCount === playersToStart) {
			console.log("creating match");
			gameNumber++;

			for (var i = 0; i < curGame.players.length; i++) {
				// tell each player to join
				curGame.sockets[curGame.players[i]].emit('joinGame');

				// add hash from players username to game id
				console.log("adding ", curGame.players[i], " to usersGame");
				usersGame[curGame.players[i]] = gameNumber;
			}
			games[gameNumber] = curGame;

			// reset for next new game
			newGamePlayerCount === 0;
			curGame = {players: [], connected: 0, sockets: new Object(), id: gameNumber, started: false};
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
