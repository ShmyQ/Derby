// ========================
// ==== Express server ====
// ========================
/* START UP
 C:\mongodb\bin\mongod.exe --dbpath c:\Users\Adam\term-project\mongo
 node app.js
*/
var express = require("express");
var app = express();

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
app.use(express.session({ secret: 'teamgamerssecretmsg' }));

app.listen(8889);

//===========================
//  Routes
//===========================

require('./loginRoutes.js')(mongoExpressAuth, app);
require('./mobileDesktopRouter.js')(mongoExpressAuth,app);




app.get('/', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err)
            res.sendfile('static/login.html');
        else {
            res.sendfile('static/index.html');
            
            ///// updateAccountTest: Counts how many times a person requests the index //////
            mongoExpressAuth.getAccount(req, function(err, result){
                if(err)
                    console.log(err);
                else {
                    var currentCount = result.indexCount;
                    if(currentCount === undefined)
                        currentCount = 0;
                    var update = {"indexCount" : currentCount + 1};
                    mongoExpressAuth.updateAccount(req,update,function(err,result){if(err)console.log(err);});
                }
            });  
            //////////////////REMOVE EVENTUALLY //////////////////////////////////////////////
        }
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
                    res.send(result); // NOTE: for test only, remove later
            });
        }
    });
});


app.use(express.static(__dirname + '/static/'));

//The 404 Route (ALWAYS Keep this as the last route) - redirects to index or login
app.use(function(req, res){
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
