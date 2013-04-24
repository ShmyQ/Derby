
var lobby = io.connect('http://128.237.134.187:8888/lobby');

lobby.on('joinGame', function (data) {
	console.log("joining game");
    window.location = '/game';
});

$(document).ready(function() {
    //==================
    //  Button Events
    //==================

    $("#logoutButton").on('tap', function(e) {
        e.preventDefault();
        logoutPlayer();
    });


     $("#menu").on('tap', function(e) {
        e.preventDefault();
        $("#menu").toggleClass("clicked");
        $("#menuBox").toggleClass("slide");
    });

    $("#profile").on('tap', function(e) {
        e.preventDefault();
        $("#profile").toggleClass("clicked");
        $("#profileBox").toggleClass("slide");
    });

    $("#friends").on('tap', function(e) {
        e.preventDefault();
        $("#friends").toggleClass("clicked");
        $("#friendsBox").toggleClass("slide");
    });

    $("#learn").on('tap', function(e) {
        e.preventDefault();
        $("#learn").toggleClass("clicked");
        $("#learnBox").toggleClass("slide");
    });

     $("#findMatch").on('tap', function(e) {
        e.preventDefault();
          lobby.emit('findMatch', {username: sessionStorage["username"]});
	});
/*
     $("#sendChat").on('tap', function(e) {
         e.preventDefault();
        sendChatToServer($("#chatInput").val());
        $("#chatInput").val("");

    });*/
});

function createAcceptPlayer(i,otherUser){
    $("#addPlayer" + i).on('tap', function(e) {
        e.preventDefault();
        acceptFriendRequest(otherUser);
    });
}
