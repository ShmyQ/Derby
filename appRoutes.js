module.exports = function appRoutes(mongoExpressAuth, app){
    var friendRequests = new Object();
    var acceptedRequests = new Object();
    
    // Index
    app.get('/', function checkLogin(req,res,next){
        mongoExpressAuth.checkLogin(req, res, function(err){
            if (err) {
                res.sendfile(mobileDesktopPrefixer(req) + "/login.html");
            }
            else {  
                mongoExpressAuth.getAccount(req, function(err, result){
                    if (err)
                        res.send(err);
                    else { 
                        if(result.friendsInfo === undefined){
                                result.friendsInfo = new Object();
                                result.friendsInfo.friendsList = [];
                                result.friendsInfo.requestList = [];
                            var createFriendsInfo = { 'friendsInfo' : result.friendsInfo };
                            mongoExpressAuth.updateAccount(req,createFriendsInfo,standardErrChecker);
                        }
                        // Get friend requests
                        if(friendRequests[req.cookies.username] !== undefined){ 
                            for(var i in friendRequests[req.cookies.username]){ 
                                 var toUpdate = toArray(result.friendsInfo.requestList);
                                 toUpdate[toUpdate.length] = friendRequests[req.cookies.username][i];
                                 var update =    {'friendsInfo.requestList': toUpdate} ;
                                 mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                            }
                             delete friendRequests[req.cookies.username];
                        }
                        
                        // Get accepted friend requests
                        if(acceptedRequests[req.cookies.username] !== undefined){ 
                            for(var i in acceptedRequests[req.cookies.username]){ 
                                 var toUpdate = toArray(result.friendsInfo.friendsList);
                                 toUpdate.push(acceptedRequests[req.cookies.username][i]);
                                 var update =    {'friendsInfo.friendsList': toUpdate} ;
                                 mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                            }
                             delete acceptedRequests[req.cookies.username];
                        }
                    }
                });
                
                    
               res.sendfile(mobileDesktopPrefixer(req) + "/index.html");
            }
        });
    });

    app.get('/db', function(req, res){
            mongoExpressAuth.getAccount(req, function(err, result){
                if (err)
                    res.send(err);
                else
                    res.send(result); // NOTE: for test only, remove later
            });
        });


    app.get('/game', function(req, res){
       mongoExpressAuth.checkLogin(req, res, function(err){
            if (err) {
                res.sendfile(mobileDesktopPrefixer(req) + "/login.html");
            }
            else
               res.sendfile(mobileDesktopPrefixer(req) + "/game.html");
        });
    });

    app.post('/friends',function(req,res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
              if(result.friendsInfo === undefined){
                result.friendsInfo = new Object();
                result.friendsInfo.friendsList = [];
                result.friendsInfo.requestList = [];
             }
             
              res.send(result.friendsInfo);
            }
        });
    });

    app.post('/addFriend',function(req,res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
                // Add to users friendslist
                var toUpdate = result.friendsInfo.friendsList;
                if(toUpdate === undefined)
                    toUpdate = [];
                toUpdate.push(req.body.otherUser);
                var update = {'friendsInfo.friendsList' : toUpdate};
                mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                
                // Remove from users requestlist
                var removeFrom = toArray(result.friendsInfo.requestList);
                removeFrom.splice(removeFrom.indexOf(req.body.otherUser),1);
                var update = {'friendsInfo.requestList' : removeFrom};
                mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                
                // Add to other users acceptedRequests
                if(acceptedRequests[req.body.otherUser] === undefined)
                    acceptedRequests[req.body.otherUser] = [];
                acceptedRequests[req.body.otherUser].push(req.cookies.username);
                
            }
        });
    });

    app.post('/friendRequest',function(req,res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
                if(friendRequests[req.body["friendName"]] === undefined)
                    friendRequests[req.body["friendName"]] = [];
                    
                friendRequests[req.body["friendName"]][friendRequests[req.body["friendName"]].length] = req.cookies.username;
            }
        });
    });

    app.get('/favicon.ico', function(req,res){
        res.sendfile('favicon.ico');
    });
    
};

//==================
// Helpers
//==================

function standardErrChecker (err,result){
    if(err)
        console.log(err);
}

function mobileDesktopPrefixer(req){
    var reqPrefix = 'static/desktop/';
    if(req.useragent.isMobile)
        reqPrefix = 'static/mobile/';
        
    return reqPrefix;
}


function toArray(input){
    if(input === undefined)
        return [];
    if( typeof input === 'string' ) {
        return [ input ];
    }
    
    return input;
}
