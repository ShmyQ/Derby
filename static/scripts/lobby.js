
// Connects to lobby 'room' in server
var lobby = io.connect('http://128.237.246.237:8007/lobby');

// Global attributes of the clients instance of lobby
var g = {
    originalLogin: null, // Username the client logged into the lobby with
    log: "",             // A string representing the chat in HTML
    players: [],         // An array of the players connected to the lobby
    kicked: false,       // A boolean representing if the player has already been kicked (to avoid issuing multiple disconnection alerts)
};

setInterval(logoutOnDisconnect,20000); // Checks every 20 seconds if the user has disconnected

$(document).ready(function(){
    //==================
    //  App Related
    //==================
    
    g.originalLogin = sessionStorage["username"];
    
    // Tell the lobby you have succesfully joined
    lobby.emit('joined', {
            username: sessionStorage["username"],
    });
    
    // Populate the list of players in the lobby and the array of lobby players
    getPlayersRequest();
   

    // Write username in top bar of side menu bars
    $("#menuBar").html(sessionStorage["username"]);
    $("#profileBar").html(sessionStorage["username"] +  "'s Profile");

    //==================
    //  Key Events
    //==================
    // Send frend request on enter key up
    $("#friendRequestInput").keyup(function(event){
        event.preventDefault();
        // Ignore blank request
        if($("#friendRequestInput").val() === "")
            return;
		if(event.which === 13){
			event.preventDefault();
            alert("Friend request sent to '" +  $("#friendRequestInput").val() + "'");
            postFriendRequest();
		}
     });
     
    // Send chat on enter key up
     $("#chatInput").keyup(function(event){
        event.preventDefault();
        // Ignore blank input
        if($("#chatInput").val() === "")
            return;
            
		if(event.which === 13){
            event.preventDefault();
			sendChatToServer($("#chatInput").val());
            $("#chatInput").val("");
		}
     });

    //==================
    //  Button Events
    //==================

    // See /mobile/scripts/lobbyButtons.js or /desktop/scripts/lobbyButtons.js for specific button implementations. 
   
  
});


//==================
//  Lobby Chat Server
//==================

// Recieve players list and update playerList as well as friendsBox
lobby.on('receivePlayers', function (data) {
    playersListHTML(data.players);
    getFriendsInfo();
});

// Game response from server
lobby.on('joinGame', function (data) {
    window.location = '/game';
});

// Recieve chat input
lobby.on('receiveChat',function(data){
    addChatToLog(data.user,data.msg);
});

// Two instances of the same username in the lobby
lobby.on('twoInstances',function(data){
    if(g.kicked === false) {
        if(data.username === sessionStorage["username"]) {
            g.kicked === true;
            logoutPlayer();
            alert("This account is logged in twice! Logging out...");
        }
    }
});

// Connection closed normally
lobby.on("close", function() {
    lobby.emit('disconnect',{
        username: g.originalLogin,
   });
   logoutPlayer();
});

// Connection closed unexpectedly
lobby.on("end", function() {
    lobby.emit('disconnect',{
        username: g.originalLogin,
    });
    logoutPlayer();
});

// 
lobby.on("error", function(data) {
    location.reload();
    alert("An unknown error occured while communicating with the server. The page is now being reloaded.");
   
});

//==================
// Helpers
//==================

// Logs out when username is illegal
function logoutOnDisconnect(){
    if(g.kicked === false){
        sessionStorage["username"] = readCookie("username");
        if(sessionStorage["username"] === undefined || sessionStorage["username"] === "" || sessionStorage["username"] !== g.originalLogin || $("#playersList").html === "" ){
            g.kicked === true;
            logoutPlayer();
            alert("You have disconnected from the server!");
        }
    }
}

// Reads a cookie from document.cookie
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

// Deletes username and password from document.cookie
function del_cookie() {
   document.cookie = 'username=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
   document.cookie = 'password=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
} 

function updateFriendsPanel(friends,requests){

    friends = toArray(friends).sort();
    if(friends.length !== 0) {

        // Add friends from list
        var friendsHTML = "";

        for(var i = 0; i < friends.length; i++){
       
            var statusPic = "<img src = 'images/offline.png' alt = 'Offline' />"
            if(g.players.indexOf(friends[i]) !== -1){
                statusPic = "<img src = 'images/online.png' alt = 'Online' />"
            }
            friendsHTML = friendsHTML +"<div class='friendListing'>"
            + "<div class = 'leftAlign'><button id = 'removePlayer" + i + "' class='tinyButton removeFriend'></button></div>"
            +  friends[i] + "<div class='rightAlign'>" + statusPic + "</div></div><br />";

        }

         friendsHTML = friendsHTML + "<br />";
         $("#friendsList").html(friendsHTML);

         for(var i in friends){
            createRemovePlayer(i,friends[i]);
        }
    }
    else {
       $("#friendsList").html("None");
    }

    requests = toArray(requests).sort();
    if(requests.length !== 0) {
        var requestsHTML = "";

        for(var i in requests){
           requestsHTML = requestsHTML +"<div class='friendListing'><div class = 'leftCenterAlign'>" + requests[i] + "</div>"
           + "<div class='rightAlign'><button id = 'addPlayer" + i + "' class='acceptFriend tinyButton'> </button>"
           + "<button id = 'rejectPlayer" + i + "' class='removeFriend tinyButton'> </button></div></div><br />";

        }

        $("#friendRequestsList").html(requestsHTML);

        for(var i in requests){
            createAcceptPlayer(i,requests[i]);
            createRejectPlayer(i,requests[i]);
        }
    }
    else {
       $("#friendRequestsList").html("None");
    }

}


function getFriendsInfo(){
    post('/friends',undefined, handleGetFriendsInfo);
}

function handleGetFriendsInfo(err, result){
    if (err)
        throw err;
    else {
        var parsedResult = $.parseJSON(result);
        updateFriendsPanel(parsedResult.friendsList,parsedResult.requestList);
    }
}

//==================
// Helpers (for buttons)
//==================
function playersListHTML(players){
    players.sort();
    var finalHTML = "<p class='topBar' > PLAYERS </p>"
    
    g.players = [];

    for(var i = 0; i < players.length; i++){
        g.players[g.players.length] = players[i];
        finalHTML = finalHTML + "<p>" + players[i] + "</p>";
    }
    
    $("#playerList").html(finalHTML);
}

function addChatToLog(user,msg){
    // Add to log
    g.log = g.log + "<p class='chatMsg'><div class = 'chatName'>" + user + "</div> : " +  msg  + "</p>";
    // Replace log on screen
    $("#chatArea").html(g.log);
    // Scroll to bottom of lobbyArea div
    $('#chatArea').animate({"scrollTop": $('#chatArea')[0].scrollHeight}, "fast");
}

function sendChatToServer(msg){
    lobby.emit('sendChat',{
        username: g.originalLogin,
        msg: msg
    });
}

 function post(url, data, done){
    var request = new XMLHttpRequest();
    var async = true;
    request.open('post', url, async);
    request.onload = function(){
        if (done !== undefined){
            try {
                var res = request.responseText
                done(null, res);
             }
             catch(err){
                done(err,null);
             }
        }
    }
    request.onerror = function(err){
        done(err, null);
    }
    if (data !== undefined){
        var body = new FormData();
        for (var key in data){
            body.append(key, data[key]);
        }
        request.send(body);
    }
    else {
        request.send();
    }
}

function logoutPlayer(){
    post('/logout', undefined, handleLogoutResult);
}

 function handleLogoutResult(err, result){
    sessionStorage["username"] = undefined;
    del_cookie();
    window.location = '/';
}

function postFriendRequest(){
    post('/friendRequest', {otherUser : $("#friendRequestInput").val() });
    $("#friendRequestInput").val("");
}

function acceptFriendRequest(otherUser){
     post(
        '/addFriend',
        {
            otherUser: otherUser
        },
        handleAcceptFriend
    );
}

function handleAcceptFriend(err,result){
    if(err)
        console.log(err);
    else {
       parseResultAndUpdate(result);
    }
}

function rejectFriendRequest(otherUser){
     post(
        '/rejectFriend',
        {
            otherUser: otherUser
        },
        handleRejectFriend
    );
}

function handleRejectFriend(err,result){
    if(err)
        console.log(err);
    else {
       parseResultAndUpdate(result);
    }

}

function removeFriendRequest(otherUser){
     post(
        '/removeFriend',
        {
            otherUser: otherUser
        },
        handleRemoveFriend
    );
}

function handleRemoveFriend(err,result){
    if(err)
        console.log(err);
    else {
        parseResultAndUpdate(result);
    }

}

function getPlayersRequest(){
     post(
        '/getPlayers', 
        {   
           username: sessionStorage["username"],
        },
        handleGetPlayers
    );
}

function handleGetPlayers(err,result){
    if(err)
        console.log(err);
    else {
        var parsedResult = $.parseJSON(result);
        
        var playerList = toArray(parsedResult);
        
        g.players = playerList;  
    }

}

function toArray(input){
    if(input === undefined)
        return [];
    if( typeof input === 'string' ) {
        return [ input ];
    }

    return input;
}

function parseResultAndUpdate(result){
     var parsedResult = $.parseJSON(result);

    var friendsList = toArray(parsedResult.friendsList);
    var requestList = toArray(parsedResult.requestList);

    updateFriendsPanel(friendsList,requestList);

}

