// ========================
// ==== Express server ====
// ========================
/* START UP
 C:\mongodb\bin\mongod.exe --dbpath c:\Users\Adam\term-project\mongo
 node app.js
*/
var express = require("express");
var app = express();

var mongoExpressAuth = require('mongo-express-auth');

//===========================
//  init
//===========================

mongoExpressAuth.init({
    mongo: { 
        dbName: 'myApp',
        collectionName: 'accounts'
    }
}, function(){
    console.log('mongo ready!');
    app.listen(8889);
});

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'teamgamerssecretmsg' }));

//===========================
//  routes
//===========================

require('./loginRoutes.js')(mongoExpressAuth, app);
require('./mobileDesktopRouter.js')(mongoExpressAuth,app);


app.get('/', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err)
            res.sendfile('static/login.html');
        else
            res.sendfile('static/index.html');
    });
});

app.get('/db', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err)
            res.send(err);
        else {
            mongoExpressAuth.getAccount(req, function(err, result){
                if (err)
                    res.send(err);
                else 
                    res.send(result); // NOTE: direct access to the database is a bad idea in a real app
            });
        }
    });
});

app.get('/game', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        //if (err)
        //   res.sendfile('static/login.html');
        //else
            res.sendfile('static/game.html');
    });
});

app.use(express.static(__dirname + '/static/'));




// ========================
// === Socket.io server ===
// ========================

var io = require("socket.io").listen(8888,{ log: false });

var playerPositions = new Object();

io.sockets.on("connection", function (socket) {
  socket.emit("connected", {id: socket.id, x: 200, y: 200, players: playerPositions});
  playerPositions[socket.id] = {x: 200, y: 200};

  socket.on("sendPosition", function (data) {
	playerPositions[data.id] = {x: data.x, y: data.y};
	socket.broadcast.emit("receivePosition", data);
  });
  
  socket.on("bombDropped", function (data) {
    socket.broadcast.emit("placeBomb", data);
  });
  
  socket.on("disconnect", function () {
	delete playerPositions[socket.id];
	socket.broadcast.emit("playerLeft", {id: socket.id});
  });
});
