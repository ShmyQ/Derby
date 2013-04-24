var g = {
    originalLogin: null,
    log: "",
};

$(document).ready(function(){
    //==================
    //  App Related
    //==================

    g.originalLogin = sessionStorage["username"];

    // Write username in top bar of side menu bars
    $("#menuBar").html(sessionStorage["username"]);
    $("#profileBar").html(sessionStorage["username"] +  "'s Profile");
    $("#friendsBar").html(sessionStorage["username"] +  "'s Friends");
    $("#friendsRequestBar").html(sessionStorage["username"] +  "'s Friend Requests");
    getFriendsInfo(document.cookie.username,document.cookie.password);

    //==================
    //  Key Events
    //==================
    $("#chatInput").keyup(function(event){
        event.preventDefault();
    /*    // Blank input
        if($("#chatInput").val() === "")
            return;*/
		if(event.which === 13){
			sendChatToServer($("#chatInput").val());
            $("#chatInput").val("");
		}
     });

    //==================
    //  Button Events
    //==================

    // See /mobile/scripts/lobbyButtons.js or /desktop/scripts/lobbyButtons.js


});


//==================
//  Lobby Chat Server
//==================
var lobby = io.connect('http://192.168.1.102:8888/lobby');

lobby.emit('joined', {
        username: sessionStorage["username"],
});

window.onbeforeunload = function() {
   lobby.emit('disconnect',{
        username: sessionStorage["username"],
   });
};

lobby.on('receivePlayers', function (data) {
    playersListHTML(data.players);
    logoutOnDisconnect(g.originalLogin);
});

lobby.on('joinGame', function (data) {
    window.location = '/game';
});

lobby.on('receiveChat',function(data){
    addChatToLog(data.user,data.msg);
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
        alert("You have been logged out!");
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
    if(friends !== undefined){
        if( typeof friends === 'string' ) {
            friends = [ friends ];
        }
        if(friends.length !== 0) {

            // Add friends from list
            var friendsHTML = "";
            for(var i = 0; i < friends.length; i++){
               friendsHTML = friendsHTML +"<div id='friendListing'>"+  friends[i] + "</div><br />";
            }
             friendsHTML = friendsHTML + "<br />";
             $("#friendsList").html(friendsHTML);
        }
        else {
           $("#friendsList").html("");
        }
    }

    if(requests !== undefined){
        if( typeof requests === 'string' ) {
            requests = [ requests ];
        }
        if(requests.length !== 0) {

            var requestsHTML = "";
            for(var i in requests){
               requestsHTML = requestsHTML +"<div id='friendListing'>" + requests[i] + " <button id = 'addPlayer" + i + "' class='smallButton'>Accept </button></div><br />";
            }
             $("#friendRequestsList").html(requestsHTML);

            for(var i in requests){
                createAcceptPlayer(i,requests[i]);
            }
        }
        else {
           $("#friendRequestsList").html("");
        }
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
    var finalHTML = "<p class='topBar' > PLAYERS </p>";

    for(var i = 0; i < players.length; i++){
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
        var friendsList = parsedResult.friendsList;
        if(friendsList === undefined)
            friendsList = [];
        var requestList = parsedResult.requestList;
        if(requestList === undefined)
            requestList = [];
        if(friendsList.indexOf(otherUser) === -1){
            friendsList.push(otherUser);
        }
        requestList.splice(requestList.indexOf(otherUser),1);

        updateFriendsPanel(friendsList,requestList);


    }

}

