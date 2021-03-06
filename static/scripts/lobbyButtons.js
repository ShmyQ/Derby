$(document).ready(function(){
    $("#chatInput").keyup(function(event){
		if(event.which === 13){
			sendChatButton.onclick();
            chatInput.value = "";
		}
     });
});

// lobby
var lobby = io.connect('http://192.168.1.102:8888/lobby');
var log = "";

window.onbeforeunload = function() {
   lobby.emit('disconnect');
};

lobby.on('connect', function(){
    lobby.emit('joined', {
        username: window.sessionStorage.username,
    });
});

lobby.on('receivePlayers', function (data) {
    playersListHTML(data.players);
});

lobby.on('joinGame', function (data) {
    console.log("HERE");
    window.location = '/game';
    console.log("HERE2");
});

lobby.on('receiveChat',function(data){
    addChatToLog(data.user,data.msg);
});

// lobby HELPERS
function playersListHTML(players){
    var finalHTML = "<p id = 'playerListBar'> PLAYERS </p>";

    for(var i = 0; i < players.length; i++){
        if(players[i])
            finalHTML = finalHTML + "<p>" + players[i] + "</p>";
    }
    $("#playerList").html(finalHTML);
}

function addChatToLog(user,msg){
    // Add to log
    log = log + "<p class='chatMsg'><div class = 'chatName'>" + user + "</div> : " + msg + "</p>";
    // Replace log on screen
    $("#chatArea").html(log);
    // Scroll to bottom of lobbyArea div
    $('#chatArea').animate({"scrollTop": $('#chatArea')[0].scrollHeight}, "fast");
}

function sendChat(msg){
    lobby.emit('sendChat',{
        username: window.sessionStorage.username,
        msg: msg
    });
}


//==================
//  DOM
//==================

var sendChatButton = document.getElementById('sendChat');
var findMatchButton = document.getElementById('findMatch');

var chatInput = document.getElementById('chatInput');

sendChatButton.onclick = function(){
   sendChat(chatInput.value);
}

findMatchButton.onclick = function(){
	lobby.emit('findMatch', {username: sessionStorage["username"]});
}



