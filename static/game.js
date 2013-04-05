/*
	Willy - working on drawing the game
*/

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");


// Globals
var g = {
	drawHandler: null,
	myPlayer: null,
}

// Constants
var c = {
	MAP_WIDTH: 1000,
	MAP_HEIGHT: 1000,
	
	BALL_RADIUS: 10,
}

init();

function init() {
	g.myPlayer = new Player(100, 100);
	
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
		else if (myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
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
		else if (myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
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
		else if (myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.fillRect(0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	}
	
	// draw player
	ctx.fillStyle = "red";
	ctx.beginPath();
	ctx.arc(canvas.width/2, canvas.height/2, c.BALL_RADIUS, 0, 2*Math.PI, true);
	ctx.fill();
}

function Player(x, y) {
	this.x = x;
	this.y = y;
}

function onKeyDown(e) {
	console.log("keypressed");
	// move left
	if (e.keyCode === 65) {
		if (g.myPlayer.x > 0)
			g.myPlayer.x--;
	}
	// move right
	else if (e.keyCode === 68) {
		if (g.myPlayer.x < c.MAP_WIDTH)
			g.myPlayer.x++;
	}
	// move up
	else if (e.keyCode === 87) {
		if (g.myPlayer.y > 0)
			g.myPlayer.y--;
	}
	// move down
	else if (e.keyCode === 83) {
		if (g.myPlayer.y < c.MAP_HEIGHT)
			g.myPlayer.y++;
	}
}
