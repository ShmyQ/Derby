canvas.addEventListener('touchstart', onTouch, false);
window.addEventListener('devicemotion', deviceMotion);


function onTouch(e) {
  if (g.isStarted) {
    var angle = findAngle(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
  	if(g.myPlayer.powerups.bullets > 0) {
      g.myPlayer.powerups.bullets--;
      fireBullet(g.myPlayer.x, g.myPlayer.y, angle);
      socket.emit("bulletFired", {id: g.myID, playerX: g.myPlayer.x, playerY: g.myPlayer.y, angle: angle});
    }
    else {
      dropMyBomb(g.myPlayer.x, g.myPlayer.y);
  	}
  }
}

function deviceMotion(e) {
	if (g.isStarted) {
	  var xvel = -e.accelerationIncludingGravity.x / 2;
	  var yvel = e.accelerationIncludingGravity.y / 2;

	  if (g.devicePlatform === "iOS") {
  		xvel *= -1;
  		yvel *= -1;
	  }
	  g.temp = xvel;

	  moveBall(xvel, yvel);
	}
}