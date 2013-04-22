var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// sockets
var socket = io.connect("http://192.168.1.115:8888/game");
socket.heartbeatTimeout = 20;

socket.on("connected", function (data) {
	g.myID = data.id;
	g.player = data.player;
	g.numPlayers = data.numPlayers;

	g.map = data.map;
	g.mapdata = data.mapdata;

	getDevicePlatform();

	init();
});

socket.on("start", function (data) {
	g.isStarted = true;
});

socket.on("receivePosition", function (data) {
	var player = data.player;
	if (g.enemies[data.playerNum] === undefined) {
		console.log("cannot find player " + data.playerNum);
	}
	else {
		g.enemies[data.playerNum].x = player.x/player.gridx * c.GRID_WIDTH;
		g.enemies[data.playerNum].y = player.y/player.gridy * c.GRID_HEIGHT;
		g.enemies[data.playerNum].hp = player.hp;
	}
});

socket.on("placeBomb", function (data) {
	console.log("Placing bomb");
	dropBomb(data.x*c.GRID_WIDTH, data.y*c.GRID_HEIGHT);
});

socket.on("removePowerup", function (data) {
	g.powerups.forEach( function (powerup) {
		if (powerup.x/c.POWERUP_WIDTH === data.x && powerup.y/c.POWERUP_HEIGHT === data.y && powerup.power === data.power)
			g.powerups.splice(g.powerups.indexOf(powerup), 1);
	});
});

socket.on("placePowerup", function (data) {
	var power = new Powerup(data.x*c.GRID_WIDTH, data.y*c.GRID_HEIGHT, data.power);
    g.powerups.push(power);
});

socket.on("respawn", function (data) {
	g.myPlayer = new Player(c.SPAWN_X, c.SPAWN_Y);
});

socket.on("playerDied", function (data) {
	g.enemies[data.playerNum] = new Player(data.x/g.mapdata.gridx * c.GRID_WIDTH, data.y/g.mapdata.gridy * c.GRID_HEIGHT);
});

socket.on("playerLeft", function (data) {
	delete g.enemies[data.id];
});

socket.on("fireBullet", function (data) {
  fireBullet(data.playerX*c.GRID_WIDTH, data.playerY*c.GRID_HEIGHT, data.angle);
});

socket.on("playerHit", function (data) {
  g.bullets.splice(data.bullet_index, 1);
  if (g.bullets.length === 0) {
    clearInterval(g.bulletHandler);
  }
});

socket.on("damagePlayer", function (data) {
  g.enemies[data.playerNum].hp -= data.damage;
});

// Globals
var g = {
	devicePlatform: "",
	drawHandler: null,
  bulletHandler: null,
	myPlayer: null,
	// socket id
	myID: 0,
	// clients player number
	player: 1,
	// number of players
	numPlayers: 0,
	bombs: null,
	rocks: null,
	powerups: null,
  bullets: null,
	enemies: null,
	backgroundImg: null,
	platformImg: null,
	map: null,
	mapdata: null,
	isStarted: false,
	bombCooldown: false,
}

// Constants
var c = {
	MAP_WIDTH: 0,
	MAP_HEIGHT: 0,

	BALL_RADIUS: 0,

	ROCK_WIDTH: 0,
	ROCK_HEIGHT: 0,

	BOMB_RADIUS: 0,
	BOMB_TIME: 5,
	BOMB_EXPLOSION_RADIUS: 0,

	POWERUP_WIDTH: 0,
	POWERUP_HEIGHT: 0,

	BULLET_SIZE: 0,
	BULLET_MOVE: 3,

	BASE_HP: 100,

	PLATFORM_IMG_WIDTH: 512,
	PLATFORM_IMG_HEIGHT: 512,

	GRID_WIDTH: 0,
	GRID_HEIGHT: 0,

	SPAWN_X: 0,
	SPAWN_Y: 0,

	BOMB_COOLDOWN_TIME: 5000,
}

// Sprites
var rockSprite = new Image();
rockSprite.src = "images/rocks.png";
var bulletSprite = new Image();
bulletSprite.src = "images/cannon_ball.png";
var ammoSprite = new Image();
ammoSprite.src = "images/ammo.png";
var s = {
  rocks: [{
    x: 5, y: 21, width: 104, height: 94
  }, {
    x: 132, y: 12, width: 97, height: 107
  }, {
    x: 385, y: 14, width: 100, height: 104
  }, {
    x: 9, y: 135, width: 102, height: 99
  }],
  bullet: [{
    x: 0, y: 0, width: 24, height: 24
  }],
  ammo: [{
    x: 2, y: 2, width: 13, height: 12
  }]
}

function init() {
	// Initiate Globals
	g.bombs = [];
	g.powerups = [];
	g.bullets = [];

	// Fix Screen
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;

	var blockHeight = window.innerHeight/12;
	var blockWidth = window.innerWidth/8;
	c.MAP_WIDTH = blockWidth*16;
	c.MAP_HEIGHT = blockHeight*16;
	c.BALL_RADIUS = Math.min(blockWidth, blockHeight)/3;
	c.BOMB_RADIUS = Math.min(blockWidth, blockHeight)/3;
	c.BOMB_EXPLOSION_RADIUS = Math.min(blockWidth, blockHeight)*2;
	c.ROCK_WIDTH = blockWidth;
	c.ROCK_HEIGHT = blockHeight;
	c.POWERUP_WIDTH = blockWidth;
	c.POWERUP_HEIGHT = blockHeight;
	c.BULLET_SIZE = Math.min(blockWidth, blockHeight)/3;
	c.GRID_WIDTH = blockWidth;
	c.GRID_HEIGHT = blockHeight;

	// Images
	g.backgroundImg = new Image();
	g.backgroundImg.src = "spaceBackground.jpg"
	g.platformImg = new Image();
	g.platformImg.src = "spacePlatform.jpg";

	// Create map and start drawing
	createMap();
	g.drawHandler = setInterval(draw, 25);
}

function getDevicePlatform() {
	if (navigator.userAgent.indexOf("Android") !== -1)
		g.devicePlatform = "Android";
	else if (navigator.platform.indexOf("Linux") !== -1)
		g.devicePlatform = "Linux";
	else if (!!(navigator.userAgent.match(/iPhone/i) ||
           navigator.userAgent.match(/iPod/i) ||
           navigator.userAgent.match(/iPad/i)))
		g.devicePlatform = "iOS";
	else if (navigator.platform.indexOf("Win") !== -1)
		g.devicePlatform = "Windows";
	else
		g.devicePlatform = "Unknown";
}

function draw() {
	ctx.clearRect(0,0,canvas.width, canvas.height);

	// background
	ctx.drawImage(g.backgroundImg, g.myPlayer.x/10, g.myPlayer.y/10, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

	// draw land as a grid
	ctx.fillStyle = "green";
	if (g.myPlayer.x < canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.fillRect(canvas.width/2 - g.myPlayer.x, canvas.height/2 - g.myPlayer.y, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y);
	 		drawGrid(canvas.width/2 - g.myPlayer.x, canvas.height/2 - g.myPlayer.y, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y);
	 	}
	 	else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
	 		ctx.fillRect(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
	 		drawGrid(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
	 	}
	 	else {
	 		ctx.fillRect(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height);
	 		drawGrid(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height);
	 	}
	 }
	 else if (g.myPlayer.x > c.MAP_WIDTH - canvas.width/2) {
	 	if (g.myPlayer.y < canvas.height/2) {
	 		ctx.fillRect(0, canvas.height/2 - g.myPlayer.y, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y);
	 		drawGrid(0, canvas.height/2 - g.myPlayer.y, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y);
	 	}
	 	else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
	 		ctx.fillRect(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
	 		drawGrid(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
	 	}
	 	else {
	 		ctx.fillRect(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height);
	 		drawGrid(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height);
	 	}
	 }
	 else {
	 	if (g.myPlayer.y < canvas.height/2) {
	 		ctx.fillRect(0, canvas.height/2 - g.myPlayer.y, canvas.width, canvas.height/2 + g.myPlayer.y);
	 		drawGrid(0, canvas.height/2 - g.myPlayer.y, canvas.width, canvas.height/2 + g.myPlayer.y);
	 	}
	 	else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
	 		ctx.fillRect(0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
	 		drawGrid(0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
	 	}
	 	else {
	 		ctx.fillRect(0, 0, canvas.width, canvas.height);
	 		drawGrid(0, 0, canvas.width, canvas.height);
	 	}
	 }

	// draw land from img
	/*
	if (g.myPlayer.x < canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.drawImage(g.platformImg, 0, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y,
						canvas.width/2 - g.myPlayer.x, canvas.height/2 - g.myPlayer.y, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.drawImage(g.platformImg, 0, c.MAP_HEIGHT - (canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y)), canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y),
						canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.drawImage(g.platformImg, 0, g.myPlayer.y - canvas.height/2, canvas.width/2 + g.myPlayer.x, canvas.height,
						canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height);
		}
	}
	else if (g.myPlayer.x > c.MAP_WIDTH - canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.drawImage(g.platformImg, c.MAP_WIDTH - (canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x)), 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y,
						0, canvas.height/2 - g.myPlayer.y, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.drawImage(g.platformImg, c.MAP_WIDTH - (canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x)), c.MAP_HEIGHT - (canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y)), canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y),
						0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.drawImage(g.platformImg, c.MAP_WIDTH - (canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x)), g.myPlayer.y - canvas.height/2, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height,
						0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height);
		}
	}
	else {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.drawImage(g.platformImg, g.myPlayer.x - canvas.width/2, 0, canvas.width, canvas.height/2 + g.myPlayer.y,
						0, canvas.height/2 - g.myPlayer.y, canvas.width, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.drawImage(g.platformImg, g.myPlayer.x - canvas.width/2, c.MAP_HEIGHT - (canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y)), canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y),
						0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.drawImage(g.platformImg, g.myPlayer.x - canvas.width/2, g.myPlayer.y - canvas.height/2, canvas.width, canvas.height,
						0, 0, canvas.width, canvas.height);
		}
	}
	*/

	// draw bombs
	g.bombs.forEach( function(bomb) {
		if (bomb.x + c.BOMB_RADIUS >= g.myPlayer.x - canvas.width/2 && bomb.x - c.BOMB_RADIUS < g.myPlayer.x + canvas.width/2
			&& bomb.y + c.BOMB_RADIUS >= g.myPlayer.y - canvas.height/2 && bomb.y - c.BOMB_RADIUS < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - bomb.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - bomb.y);

			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(xpos, ypos, c.BOMB_RADIUS, 0, 2*Math.PI, true);
			ctx.fill();

			ctx.save();
			ctx.translate(xpos, ypos);
			ctx.rotate(Math.PI/2);
			ctx.translate(-xpos, -ypos);
			ctx.fillStyle = "white";
			ctx.font = c.BOMB_RADIUS + "px Arial";
			ctx.textAlign = "center";
			ctx.fillText(bomb.time + "", xpos, ypos);
			ctx.restore();
		}
	});

	// draw powerups
	g.powerups.forEach( function(powerup) {
		if (powerup.x + c.POWERUP_WIDTH/2 >= g.myPlayer.x - canvas.width/2 && powerup.x - c.POWERUP_WIDTH/2 < g.myPlayer.x + canvas.width/2
			&& powerup.y + c.POWERUP_HEIGHT/2 >= g.myPlayer.y - canvas.height/2 && powerup.y - c.POWERUP_HEIGHT/2 < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - powerup.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - powerup.y);

			// ctx.fillStyle = "yellow";
			// ctx.fillRect(xpos - c.POWERUP_SIZE/2, ypos - c.POWERUP_SIZE/2, c.POWERUP_SIZE, c.POWERUP_SIZE);
			ctx.drawImage(ammoSprite,
			s.ammo[0].x, s.ammo[0].y,
			s.ammo[0].width, s.ammo[0].height,
			xpos - c.POWERUP_WIDTH/2, ypos - c.POWERUP_HEIGHT/2, c.POWERUP_WIDTH, c.POWERUP_HEIGHT);
		}
	});

	// draw rocks
	g.rocks.forEach( function (rock) {
		if (rock.x + c.ROCK_WIDTH/2 >= g.myPlayer.x - canvas.width/2 && rock.x - c.ROCK_WIDTH/2 < g.myPlayer.x + canvas.width/2
			&& rock.y + c.ROCK_HEIGHT/2 >= g.myPlayer.y - canvas.height/2 && rock.y - c.ROCK_HEIGHT/2 < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - rock.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - rock.y);

			ctx.drawImage(rockSprite,
			s.rocks[rock.num].x, s.rocks[rock.num].y,
			s.rocks[rock.num].width, s.rocks[rock.num].height,
			xpos - c.ROCK_WIDTH/2, ypos - c.ROCK_HEIGHT/2, c.ROCK_WIDTH, c.ROCK_HEIGHT);
			// ctx.fillRect(xpos - rock.size/2, ypos - rock.size/2, rock.size, rock.size);
		}
	});

  // draw bullets
  g.bullets.forEach( function(bullet) {
    if (bullet.x >= g.myPlayer.x - canvas.width/2 && bullet.x < g.myPlayer.x + canvas.width/2
      && bullet.y >= g.myPlayer.y - canvas.height/2 && bullet.y < g.myPlayer.y + canvas.height/2) {
      var xpos = canvas.width/2 - (g.myPlayer.x - bullet.x);
      var ypos = canvas.height/2 - (g.myPlayer.y - bullet.y);

      // ctx.fillStyle = "black";
      // ctx.beginPath();
      // ctx.arc(xpos, ypos, c.BULLET_SIZE, 0, 2*Math.PI, true);
      // ctx.fill();
      ctx.drawImage(bulletSprite,
        s.bullet[0].x, s.bullet[0].y,
        s.bullet[0].width, s.bullet[0].height,
        xpos - c.BULLET_SIZE/2, ypos - c.BULLET_SIZE/2, c.BULLET_SIZE, c.BULLET_SIZE);
    }
  });

	// draw enemies
	for (var enemyID in g.enemies) {
		var enemy = g.enemies[enemyID];
		if (enemy.x + c.BALL_RADIUS >= g.myPlayer.x - canvas.width/2 && enemy.x - c.BALL_RADIUS < g.myPlayer.x + canvas.width/2
			&& enemy.y + c.BALL_RADIUS >= g.myPlayer.y - canvas.height/2 && enemy.y - c.BALL_RADIUS < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - enemy.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - enemy.y);

			ctx.fillStyle = "black";
			ctx.beginPath();
			ctx.arc(xpos, ypos, c.BALL_RADIUS, 0, 2*Math.PI, true);
			ctx.fill();

			// hp
			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(xpos, ypos, c.BALL_RADIUS * (1 - ((c.BASE_HP - enemy.hp) / c.BASE_HP)), 0, 2*Math.PI, true);
			ctx.fill();
		}
	}

	// draw player
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(canvas.width/2, canvas.height/2, c.BALL_RADIUS, 0, 2*Math.PI, true);
	ctx.fill();

	// hp
	ctx.fillStyle = "blue";
	ctx.beginPath();
	ctx.arc(canvas.width/2, canvas.height/2, c.BALL_RADIUS * (1 - ((c.BASE_HP - g.myPlayer.hp) / c.BASE_HP)), 0, 2*Math.PI, true);
	ctx.fill();

	// waiting text
	if (!g.isStarted) {
		ctx.save();
		ctx.translate(canvas.width/2, canvas.height/2);
		ctx.rotate(Math.PI/2);
		ctx.translate(-canvas.width/2, -canvas.height/2);
		ctx.fillStyle = "white";
		ctx.font = "30px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Waiting for other players...", canvas.width/2, canvas.height/2);
		ctx.restore();
	}
}

function drawGrid(x, y, width, height) {
	var sizex = c.GRID_WIDTH;
	var sizey = c.GRID_HEIGHT;

	// round size to last grid size multiple
	if (width % sizex != 0)
		width += sizex - (width % sizex);
	if (height % sizey != 0)
		height += sizey - (height % sizey);

	// adjust for maximums
	if (g.myPlayer.x >= c.MAP_WIDTH - canvas.width/2)
		width -= sizex;
	if (g.myPlayer.y >= c.MAP_HEIGHT - canvas.height/2)
		height -= sizey;

	// reduce starting point of grid to make animation flow
	var reducex = 0;
	var reducey = 0;
	if (g.myPlayer.x >= canvas.width/2)
		reducex = g.myPlayer.x % sizex;
	if (g.myPlayer.y >= canvas.height/2)
		reducey = g.myPlayer.y % sizey;

	ctx.lineWidth = 2;
	for (var i = 0; i <= width; i+=sizex) {
		for (var j = 0; j <= height; j+=sizey) {
			ctx.strokeRect(x + i - reducex, y + j - reducey, sizex, sizey);
		}
	}
}

function createMap() {
	g.enemies = new Object();
	g.rocks = [];
	for (var i = 0; i < g.mapdata.blockx; i++) {
		for (var j = 0; j < g.mapdata.blocky; j++) {
			// Rock
			if (g.map[j][i] === "R") {
				g.rocks.push(new Rock(i*c.ROCK_WIDTH + c.ROCK_WIDTH/2, j*c.ROCK_HEIGHT + c.ROCK_HEIGHT/2, Math.floor(Math.random() * 4)));
			}
			// Spawn Point
			else if (g.map[j][i] === g.player) {
				c.SPAWN_X = i*c.GRID_WIDTH + c.GRID_WIDTH/2;
				c.SPAWN_Y = j*c.GRID_HEIGHT + c.GRID_HEIGHT/2;

				g.myPlayer = new Player(c.SPAWN_X, c.SPAWN_Y);
			}
			// Open
			else if (g.map[j][i] === "O") {
				continue;
			}
			// Enemies spawn points -- initialize enemies
			else {
				if (parseInt(g.map[j][i]) <= g.numPlayers)
					g.enemies[g.map[j][i]] = new Player(i*c.GRID_WIDTH + c.GRID_WIDTH/2, j*c.GRID_HEIGHT + c.GRID_HEIGHT/2);
			}
		}
	}
}

function dropBomb(x, y) {
	var bomb = new Bomb(x, y);
	g.bombs.push(bomb);
}

function dropMyBomb(x, y) {
	if (!g.bombCooldown) {
		g.bombCooldown = true;
		setTimeout( function() {
			console.log("resetting cooldown");
			g.bombCooldown = false;
		}, c.BOMB_COOLDOWN_TIME);

		dropBomb(x, y);

		socket.emit("bombDropped", {id: g.myID, x: g.myPlayer.x/c.GRID_WIDTH, y: g.myPlayer.y/c.GRID_HEIGHT});
	}
}

function explodeBomb(bomb) {
	var explodedRocks = [];

	// find exploded nearby rocks
	g.rocks.forEach( function(rock) {
		var dist = Math.sqrt((rock.x - bomb.x)*(rock.x - bomb.x) + (rock.y - bomb.y)*(rock.y - bomb.y));

		if (dist < c.BOMB_EXPLOSION_RADIUS) {
			explodedRocks.push(rock);
		}
	});

	// remove exploded rocks
	removeRocks(explodedRocks);

	// hurt player
	var dist = Math.sqrt((g.myPlayer.x - bomb.x)*(g.myPlayer.x - bomb.x) + (g.myPlayer.y - bomb.y)*(g.myPlayer.y - bomb.y));
	if (dist < c.BOMB_EXPLOSION_RADIUS) {
		g.myPlayer.hp -= 50;

		checkForDeath();
	}

	// remove bomb
	g.bombs.splice(g.bombs.indexOf(bomb), 1);
}

function removeRocks(rocks) {
  rocks.forEach( function(rock) {
    var rockX = rock.x;
    var rockY = rock.y;
    g.rocks.splice(g.rocks.indexOf(rock), 1);

	socket.emit("rockDestroyed", {id: g.myID, x: rock.x/c.GRID_WIDTH, y: rock.y/c.GRID_HEIGHT});
  });
}

function newPowerup () {
  // TODO: for adding random powerups
}

function checkForDeath() {
	if (g.myPlayer.hp <= 0) {
		g.isDead = true;

		socket.emit("sendDeath", {id: g.myID, player: g.player});
	}
}

function decrementTimer(bomb) {
	bomb.time--;

	if (bomb.time <= 0) {
		clearInterval(bomb.timerHandler);
		explodeBomb(bomb);
	}
}

function fireBullet(playerX, playerY, angle) {
  var moveX = c.BALL_RADIUS * 2 * Math.cos(angle * Math.PI / 180);
  var moveY = c.BALL_RADIUS * 2 * Math.sin(angle * Math.PI / 180);
  g.bullets.push(new Bullet(playerX + moveX, playerY - moveY, angle));
  if (g.bullets.length === 1) {
    g.bulletHandler = setInterval(moveBullets, 30);
  }
}

function moveBullets() {
  // TODO: move bullets relative to grid size (deltaX = cos * c.GRID_WIDTH, deltaY = "")
  g.bullets.forEach(function (bullet, index) {
    checkBulletCollision(index);
    var deltaX = c.BULLET_MOVE * Math.cos(bullet.direction * Math.PI / 180);
    var deltaY = c.BULLET_MOVE * Math.sin(bullet.direction * Math.PI / 180);
    bullet.x += deltaX;
    bullet.y -= deltaY;
  });
}

function moveBall(xvel, yvel) {
	if (!checkForCollision(xvel, yvel)) {
		g.myPlayer.x = g.myPlayer.x + xvel;
		g.myPlayer.y = g.myPlayer.y + yvel;
	}

	socket.emit("sendPosition", {id: g.myID, playerNum: g.player, player: g.myPlayer});
}

function checkForCollision(xvel, yvel) {
	// check for map boundary collision
	if (checkBoundaryCollision(xvel, yvel)) {
		return true;
	}
	if (checkRockCollision(xvel, yvel)) {
		return true;
	}
	checkPowerupCollision(xvel, yvel);
	return false;
}

function checkBoundaryCollision(xvel, yvel) {
	var x, y;
	if (g.myPlayer.x - c.BALL_RADIUS + xvel < 0) {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0)
			y = c.BALL_RADIUS;
		else if (g.myPlayer.y + c.BALL_RADIUS + yvel > c.MAP_HEIGHT)
			y = c.MAP_HEIGHT - c.BALL_RADIUS;
		else
			// change y position by the fraction of the distance traveled
			// g.myPlayer.y = g.myPlayer.y + yvel * ((xvel - g.myPlayer.x) / xvel);
			y = g.myPlayer.y + yvel;

		x = c.BALL_RADIUS;

		if (!hitAnObject(x, y)) {
			g.myPlayer.x = x;
			g.myPlayer.y = y;
		}

		return true;
	}
	else if (g.myPlayer.x + c.BALL_RADIUS + xvel > c.MAP_WIDTH) {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0)
			y = c.BALL_RADIUS;
		else if (g.myPlayer.y + c.BALL_RADIUS + yvel > c.MAP_HEIGHT)
			y = c.MAP_HEIGHT - c.BALL_RADIUS;
		else
			// change y position by the fraction of the distance traveled
			//g.myPlayer.y = g.myPlayer.y + yvel * ((xvel - (c.MAP_WIDTH - g.myPlayer.x)) / xvel);
			y = g.myPlayer.y + yvel;

		x = c.MAP_WIDTH - c.BALL_RADIUS;

		if (!hitAnObject(x, y)) {
			g.myPlayer.x = x;
			g.myPlayer.y = y;
		}

		return true;
	}
	else {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0) {
			//g.myPlayer.x = g.myPlayer.x + xvel * ((yvel - g.myPlayer.y) / yvel);
			x = g.myPlayer.x + xvel;
			y = c.BALL_RADIUS;

			if (!hitAnObject(x, y)) {
				g.myPlayer.x = x;
				g.myPlayer.y = y;
			}

			return true;
		}
		else if (g.myPlayer.y + c.BALL_RADIUS + yvel > c.MAP_HEIGHT) {
			//g.myPlayer.x = g.myPlayer.x + xvel * ((yvel - (c.MAP_HEIGHT - g.myPlayer.y)) / yvel);
			x = g.myPlayer.x + xvel;
			y = c.MAP_HEIGHT - c.BALL_RADIUS;

			if (!hitAnObject(x, y)) {
				g.myPlayer.x = x;
				g.myPlayer.y = y;
			}

			return true;
		}
	}
	return false;
}

function checkRockCollision(xvel, yvel) {
	var hitrock = false;
	g.rocks.forEach( function(rock) {
		if (hitsRock(xvel, yvel, rock)) {
			// small amount to push ball from wall (fixes a bug)
			var e = 0.0001;

			if (!hitsRock(xvel, 0, rock)) {
				// if the whole xvel doesnt hit a new rock, add it
				if (!hitAnObject(xvel, 0))
					g.myPlayer.x += xvel;

				// move y to side of rock
				if (g.myPlayer.y + c.BALL_RADIUS <= rock.y - c.ROCK_HEIGHT/2)
					g.myPlayer.y = rock.y - c.ROCK_HEIGHT/2 - c.BALL_RADIUS - e;
				else
					g.myPlayer.y = rock.y + c.ROCK_HEIGHT/2 + c.BALL_RADIUS + e;
			}
			else if (!hitsRock(0, yvel, rock)) {
				// if the whole yvel doesnt hit a new rock, add it
				if (!hitAnObject(0, yvel))
					g.myPlayer.y += yvel;

				if (g.myPlayer.x + c.BALL_RADIUS <= rock.x - c.ROCK_WIDTH/2)
					g.myPlayer.x = rock.x - c.ROCK_WIDTH/2 - c.BALL_RADIUS - e;
				else
					g.myPlayer.x = rock.x + c.ROCK_WIDTH/2 + c.BALL_RADIUS + e;
			}
			// diagonal
			else {
				console.log(g.myPlayer.y - c.BALL_RADIUS + yvel, rock.y + c.ROCK_HEIGHT/2);
			}
			hitrock = true;
		}
	});

	return hitrock;
}

function hitsRock(xvel, yvel, rock) {
	if (g.myPlayer.x + c.BALL_RADIUS + xvel > rock.x - c.ROCK_WIDTH/2 && g.myPlayer.x - c.BALL_RADIUS + xvel < rock.x + c.ROCK_WIDTH/2
		&& g.myPlayer.y + c.BALL_RADIUS + yvel > rock.y - c.ROCK_HEIGHT/2 && g.myPlayer.y - c.BALL_RADIUS + yvel < rock.y + c.ROCK_HEIGHT/2) {
		return true;
	}
}

function hitAnObject(xvel, yvel) {
	var hit = false;
	g.rocks.forEach( function (rock) {
		if (hitsRock(xvel, yvel, rock))
			hit = true;
	});
	return hit;
}

function checkPowerupCollision(xvel, yvel) {
  g.powerups.forEach( function(powerup) {
    if (g.myPlayer.x + c.BALL_RADIUS + xvel >= powerup.x - c.POWERUP_WIDTH/2 && g.myPlayer.x - c.BALL_RADIUS + xvel < powerup.x + c.POWERUP_WIDTH/2
      && g.myPlayer.y + c.BALL_RADIUS + yvel >= powerup.y - c.POWERUP_HEIGHT/2 && g.myPlayer.y - c.BALL_RADIUS + yvel < powerup.y + c.POWERUP_HEIGHT/2) {
      addPowerup(powerup);
    }
  });
}

function checkBulletCollision(bullet_index) {
  bullet = g.bullets[bullet_index];
  if (bullet.x < 0 || bullet.y < 0 || bullet.x > c.GRID_WIDTH || bullet.y > c.GRID_HEIGHT) {
    //console.log("bullet.x = " + bullet.x + "\nbullet.y = " + bullet.y);
    g.bullets.splice(bullet_index, 1);
    if (g.bullets.length === 0) {
      clearInterval(g.bulletHandler);
    }
  }
  // TODO: Must be a more efficient way to do this
  g.rocks.forEach( function(rock) {
    var dist = Math.sqrt((rock.x - bullet.x)*(rock.x - bullet.x) + (rock.y - bullet.y)*(rock.y - bullet.y));
    if (dist < c.BULLET_SIZE * 3) {
      // Remove exploded rock
      var rocks = [rock];
      removeRocks(rocks);
      g.bullets.splice(bullet_index, 1);
      if (g.bullets.length === 0) {
        clearInterval(g.bulletHandler);
      }
      return;
    }
  });
  if (g.myPlayer.x + c.BALL_RADIUS >= bullet.x - c.BULLET_SIZE/2 && g.myPlayer.x - c.BALL_RADIUS < bullet.x + c.BULLET_SIZE/2
    && g.myPlayer.y + c.BALL_RADIUS >= bullet.y - c.BULLET_SIZE/2 && g.myPlayer.y - c.BALL_RADIUS < bullet.y + c.BULLET_SIZE/2) {
    g.bullets.splice(bullet_index, 1);
    if (g.bullets.length === 0) {
      clearInterval(g.bulletHandler);
    }
    socket.emit("hitPlayer", {bullet: bullet_index});
    // Damage player
    g.myPlayer.hp -= 30;
    socket.emit("damagedPlayer", {id: g.myID, playerNum: g.player, damage: 30})
    checkForDeath();
  }
}

function addPowerup(powerup) {
  g.myPlayer.powerups.bullets += 5;
  g.powerups.splice(g.powerups.indexOf(powerup), 1);

  // TODO: add emit event here (twice?)
  socket.emit("powerupTaken", {id: g.myID, x: powerup.x/c.POWERUP_WIDTH, y: powerup.y/c.POWERUP_HEIGHT, power: powerup.power});
}

function Player(x, y) {
	this.x = x;
	this.y = y;
    this.powerups = {bullets: 0};
	this.hp = c.BASE_HP;
	this.gridx = c.GRID_WIDTH;
	this.gridy = c.GRID_HEIGHT;
}

function Rock(x, y, num) { // Should we use prototypes for all obstacles? >>yes<<
	this.x = x;
	this.y = y;
    this.num = num;
}

function Powerup(x, y, power) {
	this.x = x;
	this.y = y;
	this.power = power;
}

function Bomb(x, y) {
	var bomb = this;
	this.x = x;
	this.y = y;
	this.time = c.BOMB_TIME;
	this.timerHandler = setInterval( function() { decrementTimer(bomb); }, 1000 );
}

function Bullet(x, y, direction) {
  this.x = x;
  this.y = y;
  this.direction = direction;
}

function findAngle(x, y) {
  // Finding angle of direction
  var deltaX = x - (canvas.width / 2);
  var deltaY = y - (canvas.height / 2);
  var theta = Math.atan2(-deltaY, deltaX);
  if (theta < 0) {
    theta += 2 * Math.PI;
  }
  theta = theta * (180 / Math.PI);
  return theta;
}
