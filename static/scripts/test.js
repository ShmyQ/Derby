var socket = io.connect("http://128.237.237.132:8888");

$(document).ready(function() {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");
  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  window.addEventListener('resize', resizeCanvas, false);

  ctx.beginPath();
  ctx.arc(10, 10, 20, 0, 2*Math.PI, true);
  ctx.fillStyle = "#3333FF";
  ctx.fill();
  ctx.stroke();

  canvas.addEventListener('mousemove', function (event) {
    socket.emit('coords', {x: event.pageX, y: event.pageY});
    return false;
  }, false);

  socket.on("status", function (data) {
    if(data.success) {
      ctx.beginPath();
      ctx.arc(data.x, touch.y, 20, 0, 2*Math.PI, true);
      ctx.fillStyle = "#3333FF";
      ctx.fill();
      ctx.stroke();
    }
  });
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
