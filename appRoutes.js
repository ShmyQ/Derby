module.exports = function appRoutes(mongoExpressAuth, app){
    var friendRequests = new Object();
    var acceptedRequests = new Object();
    var friendRemovals = new Object();
    
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
                                 var toCheck = toArray(result.friendsInfo.friendsList);
                                 if(toUpdate.indexOf(friendRequests[req.cookies.username][i]) === -1 && toCheck.indexOf(friendRequests[req.cookies.username][i]) === -1) {
                                     toUpdate[toUpdate.length] = friendRequests[req.cookies.username][i];
                                     var update =    {'friendsInfo.requestList': toUpdate} ;
                                     mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                                 }
                            }
                             delete friendRequests[req.cookies.username];
                        }
                        
                        // Get accepted friend requests
                        if(acceptedRequests[req.cookies.username] !== undefined){ 
                            for(var i in acceptedRequests[req.cookies.username]){ 
                                 var toUpdate = toArray(result.friendsInfo.friendsList);
                                 if(toUpdate.indexOf(acceptedRequests[req.cookies.username][i]) === -1) {
                                     toUpdate.push(acceptedRequests[req.cookies.username][i]);
                                     var update =    {'friendsInfo.friendsList': toUpdate} ;
                                     mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                                 }
                            }
                             delete acceptedRequests[req.cookies.username];
                        }
                        
                        // Get friend removals
                        if(friendRemovals[req.cookies.username] !== undefined){ 
                            for(var i in friendRemovals[req.cookies.username]){ 
                                 var toUpdate = toArray(result.friendsInfo.friendsList);
                                 if(toUpdate.indexOf(friendRemovals[req.cookies.username][i]) !== -1) {
                                     toUpdate.splice(friendRemovals[req.cookies.username][i],1);
                                     var update =    {'friendsInfo.friendsList': toUpdate} ;
                                     mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                                 }
                            }
                             delete friendRemovals[req.cookies.username];
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
                var toUpdate = toArray(result.friendsInfo.friendsList);

                if(toUpdate.indexOf(req.body.otherUser) === -1) {
                    toUpdate.push(req.body.otherUser);
                    var update = {'friendsInfo.friendsList' : toUpdate};
                    mongoExpressAuth.updateAccount(req,update,standardErrChecker);
                    
                    // Add to other users acceptedRequests
                    acceptedRequests[req.body.otherUser] = toArray(acceptedRequests[req.body.otherUser]);
                    acceptedRequests[req.body.otherUser].push(req.cookies.username);
                }
                
                // Remove from users requestlist
                var removeFrom = toArray(result.friendsInfo.requestList);
                removeFrom.splice(removeFrom.indexOf(req.body.otherUser),1);
                var update = {'friendsInfo.requestList' : removeFrom};
                mongoExpressAuth.updateAccount(req,update,standardErrChecker);
            }
        });
       
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
                result.friendsInfo.otherUser = req.body.otherUser;
                res.send(result.friendsInfo);
            }
        });
    });
    
    app.post('/rejectFriend',function(req,res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else { 
                // Remove from users requestlist
                var removeFrom = toArray(result.friendsInfo.requestList);
                removeFrom.splice(removeFrom.indexOf(req.body.otherUser),1);
                var update = {'friendsInfo.requestList' : removeFrom};
                mongoExpressAuth.updateAccount(req,update,standardErrChecker);
            }
        });
       
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
                result.friendsInfo.otherUser = req.body.otherUser;
                res.send(result.friendsInfo);
            }
        });
    });
    
    app.post('/removeFriend',function(req,res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else { 
                // Remove from users friendlist
                var removeFrom = toArray(result.friendsInfo.friendsList);
                removeFrom.splice(removeFrom.indexOf(req.body.otherUser),1);
                var update = {'friendsInfo.friendsList' : removeFrom};
                mongoExpressAuth.updateAccount(req,update,standardErrChecker);
            }
        });
       
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
                friendRemovals[req.body.otherUser] = toArray(friendRemovals[req.body.otherUser]);
                friendRemovals[req.body.otherUser].push(req.cookies.username);
                result.friendsInfo.otherUser = req.body.otherUser;
                res.send(result.friendsInfo);
            }
        });
    });

    app.post('/friendRequest',function(req,res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
                if(req.body.otherUser === req.cookies.username)
                    return;
                    
                friendRequests[req.body.otherUser] = toArray(friendRequests[req.body.otherUser]);
   
                if(friendRequests[req.body.otherUser].indexOf(req.cookies.username) === -1) {
                    friendRequests[req.body.otherUser].push(req.cookies.username);
                }
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


// Returns a blank array if undefined or makes into a single element array
function toArray(input){
    if(input === undefined)
        return [];
    if( typeof input === 'string' ) {
        return [ input ];
    }
    
    return input;
}
