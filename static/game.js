/*
	Willy - can roll around on phone now
			going to put in boundaries and bombs next
*/

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");


// Globals
var g = {
	drawHandler: null,
	myPlayer: null,
	bombs: null,
}

// Constants
var c = {
	MAP_WIDTH: 800,
	MAP_HEIGHT: 800,
	
	BALL_RADIUS: 30,
	
	ROCK_RADIUS: 30,
	
	BOMB_RADIUS: 50,
	BOMB_TIME: 5,
}

window.addEventListener('devicemotion', function(event) {
      var xvel = -event.accelerationIncludingGravity.x / 2;
	  var yvel = event.accelerationIncludingGravity.y / 2;
	  
	  moveBall(xvel, yvel);
});



init();

function init() {
	g.myPlayer = new Player(200, 200);
	g.bombs = [];
	
	canvas.addEventListener('touchstart', onTouch, false);
	document.onkeydown = onKeyDown;
	
	g.drawHandler = setInterval(draw, 15);
}

function draw() {
	ctx.clearRect(0,0,canvas.width, canvas.height);
	
	// draw land
	ctx.fillStyle = "green";
	if (g.myPlayer.x < canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.fillRect(canvas.width/2 - g.myPlayer.x, canvas.height/2 - g.myPlayer.y, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.fillRect(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.fillRect(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height);
		}
	}
	else if (g.myPlayer.x > c.MAP_WIDTH - canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.fillRect(0, canvas.height/2 - g.myPlayer.y, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.fillRect(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.fillRect(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height);
		}
	}
	else {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.fillRect(0, canvas.height/2 - g.myPlayer.y, canvas.width, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.fillRect(0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	}
	
	// draw player
	ctx.fillStyle = "blue";
	ctx.beginPath();
	ctx.arc(canvas.width/2, canvas.height/2, c.BALL_RADIUS, 0, 2*Math.PI, true);
	ctx.fill();
	
	// draw bombs
	g.bombs.forEach( function(bomb) {
		if (bomb.x >= g.myPlayer.x - canvas.width/2 && bomb.x < g.myPlayer.x + canvas.width/2
			&& bomb.y >= g.myPlayer.y - canvas.height/2 && bomb.y < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - bomb.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - bomb.y);
			
			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(xpos, ypos, c.BOMB_RADIUS, 0, 2*Math.PI, true);
			ctx.fill();
			
			ctx.fillStyle = "white";
			ctx.font = "60px Arial";
			ctx.textAlign = "center";
			ctx.fillText(bomb.time + "", xpos, ypos);
		}
	});
}

function dropBomb(x, y) {
	var bomb = new Bomb(x, y);
	g.bombs.push(bomb);
}

function explodeBomb(bomb) {
	g.bombs.splice(g.bombs.indexOf(bomb), 1);
}

function decrementTimer(bomb) {
	console.log(bomb.time);
	bomb.time--;
	
	if (bomb.time <= 0) {
		clearInterval(bomb.timerHandler);
		explodeBomb(bomb);
	}
}

function moveBall(xvel, yvel) {
	if (checkForCollision(xvel, yvel)) {
		return;
	}
	
	g.myPlayer.x = g.myPlayer.x + xvel;
	g.myPlayer.y = g.myPlayer.y + yvel;
}

function checkForCollision(xvel, yvel) {
	// check for map boundary collision
	if (checkBoundaryCollision(xvel, yvel)) {
		return true;
	}
	
	return false;
}

function checkBoundaryCollision(xvel, yvel) {
	if (g.myPlayer.x - c.BALL_RADIUS + xvel < 0) {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0)
			g.myPlayer.y = c.BALL_RADIUS;
		else if (g.myPlayer.y + c.BALL_RADIUS + xvel > c.MAP_HEIGHT)
			g.myPlayer.y = c.MAP_HEIGHT - c.BALL_RADIUS;
		else
			// change y position by the fraction of the distance traveled
			// g.myPlayer.y = g.myPlayer.y + yvel * ((xvel - g.myPlayer.x) / xvel);
			g.myPlayer.y = g.myPlayer.y + yvel;
			
		g.myPlayer.x = c.BALL_RADIUS;
		return true;
	}
	else if (g.myPlayer.x + c.BALL_RADIUS + xvel > c.MAP_WIDTH) {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0)
			g.myPlayer.y = c.BALL_RADIUS;
		else if (g.myPlayer.y + c.BALL_RADIUS + xvel > c.MAP_HEIGHT)
			g.myPlayer.y = c.MAP_HEIGHT - c.BALL_RADIUS;
		else
			// change y position by the fraction of the distance traveled
			//g.myPlayer.y = g.mhPlayer.y + yvel * ((xvel - (c.MAP_WIDTH - g.myPlayer.x)) / xvel);
			g.myPlayer.y = g.mhPlayer.y + yvel;
		
		g.myPlayer.x = c.MAP_WIDTH - c.BALL_RADIUS;
		return true;
	}
	else {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0) {
			//g.myPlayer.x = g.myPlayer.x + xvel * ((yvel - g.myPlayer.y) / yvel);
			g.myPlayer.x = g.myPlayer.x + xvel;
			g.myPlayer.y = c.BALL_RADIUS;
			return true;
		}
		else if (g.myPlayer.y + c.BALL_RADIUS + xvel > c.MAP_HEIGHT) {
			//g.myPlayer.x = g.myPlayer.x + xvel * ((yvel - (c.MAP_HEIGHT - g.myPlayer.y)) / yvel);
			g.myPlayer.x = g.myPlayer.x + xvel;
			g.myPlayer.y = c.MAP_HEIGHT - c.BALL_RADIUS;
			return true;
		}
	}
	return false;
}

function checkRockCollision(xvel, yvel) {
	
}

function Player(x, y) {
	this.x = x;
	this.y = y;
}

function Rock(x, y) {
	this.x = x;
	this.y = y;
	this.radius = c.ROCK_RADIUS;
}

function Bomb(x, y) {
	var bomb = this;
	this.x = x;
	this.y = y;
	this.time = c.BOMB_TIME;
	this.timerHandler = setInterval( function() { decrementTimer(bomb); }, 1000 );
}

function onTouch(e) {
	dropBomb(g.myPlayer.x, g.myPlayer.y);
}

function onKeyDown(e) {
	// space - drop bomb
	if (e.keyCode === 32) {
		dropBomb(g.myPlayer.x, g.myPlayer.y);
	}
	// move left
	else if (e.keyCode === 65) {
		if (checkForCollision(-5, 0))
			return;
	
		g.myPlayer.x -= 5;
	}
	// move right
	else if (e.keyCode === 68) {
		if (checkForCollision(5, 0))
			return;
	
		g.myPlayer.x += 5;
	}
	// move up
	else if (e.keyCode === 87) {
		if (checkForCollision(0, -5))
			return;
	
		g.myPlayer.y -= 5;
	}
	// move down
	else if (e.keyCode === 83) {
		if (checkForCollision(0, 5))
			return;
	
		g.myPlayer.y += 5;
	}
}
