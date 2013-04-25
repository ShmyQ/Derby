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
require('./appRoutes.js')(mongoExpressAuth, app);

app.use(express.static(__dirname + '/static/'));

//===========================
//  Maps
//===========================

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

// ========================
// === Socket.io server ===
// ========================
var io = require("socket.io").listen(8888,{ log: false });

var Lobby = require('./lobbyServer.js'),
myLobby = new Lobby(mongoExpressAuth,app,io,map1);

// ** GAME ** (MOVED TO LOBBY SERVER)

// array of all the games
var games = Lobby.games;

// hash of socket ids to game number that they are in
var usersGame = Lobby.usersGame;

// each players current playing data, key is the socket id
var playerData = new Object();

var powerupDropChance = 0.4;
var roundSeconds = 60;

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
		socket.emit("connected", {id: socket.id, reconnecting: true, x: playerData[data.username].x, y: playerData[data.username].y, player: player.toString(), numPlayers: thisGame.players.length, map: thisGame.map, mapdata: map1data});
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
			  setTimeout( function() { 
				// get player stats to send back
				/*var stats = new Object();
				for (var i = 0; i < thisGame.players.length; i++) {
					var username = thisGame.players[i];
					stats[username] = {kills: playerData[username].kills, deaths: playerData[username].deaths};
				}*/
			  
				game.emit("endGame", {});
			  }, roundSeconds*1000);
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

	var map = games[usersGame[data.username]].map;

	if (map[data.y - .5][data.x - .5] === "R") {
		console.log("Removing rock");
		if (Math.random() < powerupDropChance) {
			newPowerup(data.x, data.y, data.username, data.x, data.y);
		}
		else {
			map[data.y - .5][data.x - .5] = "O";
			game.emit("placePowerup", {x: data.x, y: data.y, power: "none"});
		}
	}
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

	console.log("Killer ", data.killer);

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


function newPowerup (xPos, yPos, username, x, y) {
	var map = games[usersGame[username]].map;

    var rand = Math.random() * 3;
    if (rand < 1) {
		map[y - 0.5][x - 0.5] = "B";
        game.emit("placePowerup", {x: xPos, y: yPos, power: "bullet"});
        console.log("BULLET");
    }
    else if (rand < 2) {
		map[y - 0.5][x - 0.5] = "I";
        game.emit("placePowerup", {x: xPos, y: yPos, power: "invincible"});
        console.log("INVINCIBLE");
    }
    else {
        map[y - 0.5][x - 0.5] = "H";
        game.emit("placePowerup", {x: xPos, y: yPos, power: "health"});
        console.log("HEALTH");
    }
}
