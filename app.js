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
require('./mobileDesktopRouter.js')(mongoExpressAuth,app);

app.get('/',function(req,res){
    response.sendfile('static/login.html');
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
                    res.send(result); // NOTE: for test only, remove later
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

/* The remaining routes are to keep the app a bit safer. They are not needed. */

// Do not serve raw html files
app.get('*.html',function noServe(req,res,next){
    res.redirect('/');
});

// Do not serve raw js files
app.get('*.js',function noServe(req,res,next){
    res.redirect('/');
});

// Do not serve raw css files
app.get('*.js',function noServe(req,res,next){
    res.redirect('/');
});


//The 404 Route (ALWAYS Keep this as the last route)
app.use(function(req,res){
    res.redirect('/');
});

// ========================
// === Socket.io server ===
// ========================

var io = require("socket.io").listen(8888,{ log: false });

io.sockets.on("connection", function (socket) {
  socket.on("coords", function (data) {
    io.sockets.emit("drawcoords", {x: data.x + 20, y: data.y + 20});
  });
 

  socket.on("sendPosition", function (data) {
   socket.broadcast.emit("receivePosition", {player:socket.id, position:data});
  });
  
});

function strEndsWith(str, suffix) {
    return str.match(suffix + "$") == suffix;
}
