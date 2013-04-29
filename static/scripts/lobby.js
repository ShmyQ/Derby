
var lobby = io.connect('http://128.237.87.127:8888/lobby');

var g = {
    originalLogin: null,
    log: "",
    players: [],
};


$(document).ready(function(){
    //==================
    //  App Related
    //==================

    g.originalLogin = sessionStorage["username"];

    lobby.emit('joined', {
            username: sessionStorage["username"],
    });
    
    window.onbeforeunload = function() {
       lobby.emit('disconnect',{
            username: sessionStorage["username"],
       });
    };
    
    getPlayersRequest();
    getFriendsInfo(document.cookie.username,document.cookie.password);
   

    // Write username in top bar of side menu bars
    $("#menuBar").html(sessionStorage["username"]);
    $("#profileBar").html(sessionStorage["username"] +  "'s Profile");

    //==================
    //  Key Events
    //==================
    $("#friendRequestInput").keyup(function(event){
        event.preventDefault();
        if($("#friendRequestInput").val() === "")
            return;
		if(event.which === 13){
			event.preventDefault();
            alert("Friend request sent to '" +  $("#friendRequestInput").val() + "'");
            postFriendRequest();
		}
     });

     $("#chatInput").keyup(function(event){
        event.preventDefault();
    /*    // Blank input
        if($("#chatInput").val() === "")
            return;*/
		if(event.which === 13){
            event.preventDefault();
			sendChatToServer($("#chatInput").val());
            $("#chatInput").val("");
		}
     });

    //==================
    //  Button Events
    //==================

    // See /mobile/scripts/lobbyButtons.js or /desktop/scripts/lobbyButtons.js
     logoutOnDisconnect(g.originalLogin);
     
    $("#chatBox").focus();
});


//==================
//  Lobby Chat Server
//==================

lobby.on('receivePlayers', function (data) {
    playersListHTML(data.players);
    logoutOnDisconnect(g.originalLogin);
});

lobby.on('joinGame', function (data) {
    window.location = '/game';
});

lobby.on('receiveChat',function(data){
    addChatToLog(data.user,data.msg);
    logoutOnDisconnect(g.originalLogin);
});

lobby.on('twoInstances',function(data){
    if(data.username === sessionStorage["username"]) {
        alert("This account is logged in twice! Loggout out...");
        logoutPlayer();
    }
});

//==================
// Helpers
//==================

// Logs out when username is illegal
function logoutOnDisconnect(originalLogin){
    sessionStorage["username"] = readCookie("username");
    if(sessionStorage["username"] === undefined || sessionStorage["username"] === "" || sessionStorage["username"] !== originalLogin){
        alert("You have disconnected from the server!");
        logoutPlayer();
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


function getFriendsInfo(username, password){
    post(
        '/friends',
        {
            username: username,
            password: password,
        },
        handleGetFriendsInfo
    );
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
        username: sessionStorage["username"],
        msg: msg
    });
}



 function post(url, data, done){
    var request = new XMLHttpRequest();
    var async = true;
    request.open('post', url, async);
    request.onload = function(){
        if (done !== undefined){
            var res = request.responseText
            done(null, res);
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
        var parsedResult = $.parseJSON(result);
        var otherUser = parsedResult.otherUser;
        var friendsList = toArray(parsedResult.friendsList);
        var requestList = toArray(parsedResult.requestList);
        if(friendsList.indexOf(otherUser) === -1){
            friendsList.push(otherUser);
        }
        requestList.splice(requestList.indexOf(otherUser),1);

        updateFriendsPanel(friendsList,requestList);


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
        var parsedResult = $.parseJSON(result);

        var otherUser = parsedResult.otherUser;
        var friendsList = toArray(parsedResult.friendsList);
        var requestList = toArray(parsedResult.requestList);

        requestList.splice(requestList.indexOf(otherUser),1);
        updateFriendsPanel(friendsList,requestList);


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
        var parsedResult = $.parseJSON(result);

        var otherUser = parsedResult.otherUser;
        var friendsList = toArray(parsedResult.friendsList);
        var requestList = toArray(parsedResult.requestList);

        friendsList.splice(friendsList.indexOf(otherUser),1);
        updateFriendsPanel(friendsList,requestList);


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

