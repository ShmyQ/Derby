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

app.listen(8008);

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

var map2data = {width: 500, height: 500, gridx: 50, gridy: 50, blockx: 10, blocky: 10, maxPlayers: 2};
var map2positions = [{},
					 {x: 125, y: 125},
					 {x: 375, y: 375}];
var map2 = [["O", "R", "R", "O", "O", "O", "R", "R", "R", "R"],
			["R", "O", "O", "R", "O", "O", "O", "R", "R", "R"],
			["R", "O", "1", "O", "O", "P", "W", "O", "R", "R"],
			["O", "R", "O", "O", "O", "O", "P", "W", "O", "R"],
			["O", "O", "O", "O", "R", "O", "O", "P", "O", "O"],
			["O", "O", "P", "O", "O", "R", "O", "O", "O", "O"],
			["R", "O", "W", "P", "O", "O", "O", "O", "R", "O"],
			["R", "R", "O", "W", "P", "O", "O", "2", "O", "R"],
			["R", "R", "R", "O", "O", "O", "R", "O", "O", "R"],
			["R", "R", "R", "R", "O", "O", "O", "R", "R", "O"]];


// ========================
// === Socket.io server ===
// ========================
var io = require("socket.io").listen(8007);

var Lobby = require('./lobbyServer.js'),
myLobby = new Lobby(mongoExpressAuth,app,io,cloneMap(map1));

// ** GAME ** (some components in lobby server)

// array of all the games
var games = Lobby.games;

// hash of socket ids to game number that they are in
var usersGame = Lobby.usersGame;

// each players current playing data, key is the socket id
var playerData = new Object();

var powerupDropChance = 0.4;
var roundSeconds = 120;

var game = io.of('/game').on("connection", function (socket) {
  console.log("Player ", socket.id, " connected");

  socket.emit("getUsername", {});

  socket.on("username", function(data) {
	console.log("connecting with username: ", data.username);
	  var thisGame = games[usersGame[data.username]];
	  thisGame.sockets[data.username] = socket;

	  var player = thisGame.players.indexOf(data.username) + 1;

	  var stats = new Object();
	  for (var i = 0; i < thisGame.players.length; i++) {
		  var username = thisGame.players[i];
		  stats[username] = {kills: 0, deaths: 0};
	  }

	  if (thisGame.started) {
	    // send connected message to set up client side
		socket.emit("connected", {id: socket.id, reconnecting: true, x: playerData[data.username].x, y: playerData[data.username].y, player: player.toString(), numPlayers: thisGame.players.length, map: thisGame.map, mapdata: map1data, stats: stats});
	  }
	  else {
		  // send connected message to set up client side
		  socket.emit("connected", {id: socket.id, reconnecting: false, x: map1positions[player].x/map1data.gridx, y: map1positions[player].y/map1data.gridy, player: player.toString(), numPlayers: thisGame.players.length, map: map1.slice(0), mapdata: map1data, stats: stats});

		  // save new player
		  playerData[data.username] = {kills: 0, deaths: 0, x: -1, y: -1};

		  thisGame.connected++;
		  // if all players connect, start game
		  if (thisGame.connected === thisGame.players.length) {
			  game.emit("start", {});
			  thisGame.started = true;
			  setTimeout( function() {
				// get player stats to send back
				var stats = new Object();
				for (var i = 0; i < thisGame.players.length; i++) {
					var username = thisGame.players[i];
					stats[username] = {kills: playerData[username].kills, deaths: playerData[username].deaths};
				}

				game.emit("endGame", stats);
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
	var map = games[usersGame[data.username]].map;

	if (map[data.y - .5][data.x - .5] === "R") {
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

	playerData[data.username].deaths++;
	// suicide
	if (data.killer === data.player)
		playerData[data.username].kills--;
	// give killer a kill
	else
		playerData[games[usersGame[data.username]].players[parseInt(data.killer) - 1]].kills++;

	var thisGame = games[usersGame[data.username]];
	var stats = new Object();
	for (var i = 0; i < thisGame.players.length; i++) {
		var username = thisGame.players[i];
		stats[username] = {kills: playerData[username].kills, deaths: playerData[username].deaths};
	}
	game.emit("playerDied", {id: data.id, playerNum: data.player, x: map1positions[parseInt(data.player)].x, y: map1positions[parseInt(data.player)].y, stats: stats});
  });

  socket.on("disconnect", function () {
  
  });
  
  socket.on("leaveGame", function(data) {
	socket.broadcast.emit("playerLeft", data);
  });
});


function newPowerup (xPos, yPos, username, x, y) {
	var map = games[usersGame[username]].map;

    var rand = Math.random() * 4;
    if (rand < 1) {
		map[y - 0.5][x - 0.5] = "B";
        game.emit("placePowerup", {x: xPos, y: yPos, power: "bullet"});
        // console.log("BULLET");
    }
    else if (rand >= 1 && rand < 2) {
		map[y - 0.5][x - 0.5] = "I";
        game.emit("placePowerup", {x: xPos, y: yPos, power: "invincible"});
        // console.log("INVINCIBLE");
    }
    else if (rand >= 2 && rand < 3) {
        map[y - 0.5][x - 0.5] = "H";
        game.emit("placePowerup", {x: xPos, y: yPos, power: "health"});
        // console.log("HEALTH");
    }
    else if (rand >= 3) {
        map[y - 0.5][x - 0.5] = "C";
        game.emit("placePowerup", {x: xPos, y: yPos, power: "invert"});
        // console.log("INVERT");
    }
}

function cloneMap(map) {
	var newmap = [];
	for(var i = 0; i < map.length; i++) {
		newmap.push(map[i].slice(0));
	}
	return newmap;
}
