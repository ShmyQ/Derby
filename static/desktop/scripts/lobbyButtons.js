var lobby = io.connect('http://192.168.1.102:8888/lobby');

lobby.on('joinGame', function (data) {
	console.log("joining game");
    window.location = '/game';
});

$(document).ready(function() {
    //==================
    //  Button Events
    //==================
     $("#logoutButton").click(function(e) {
        e.preventDefault();
        logoutPlayer();
    });

     $("#menu").click(function(e) {
        e.preventDefault();
        $("#menu").toggleClass("clicked");
        $("#menuBox").toggleClass("slide");
    });

    $("#profile").click(function(e) {
        e.preventDefault();
        $("#profile").toggleClass("clicked");
        $("#profileBox").toggleClass("slide");
    });

    $("#friends").click(function(e) {
        e.preventDefault();
        $("#friends").toggleClass("clicked");
        $("#friendsBox").toggleClass("slide");
    });

    $("#learn").click(function(e) {
        e.preventDefault();
        $("#learn").toggleClass("clicked");
        $("#learnBox").toggleClass("slide");
    });

     $("#findMatch").click(function(e) {
        e.preventDefault();
          lobby.emit('findMatch', {username: sessionStorage["username"]});
    });

     $("#sendChat").click(function(e) {
        e.preventDefault();
         sendChatToServer($("#chatInput").val());
    });

    $("#sendFriendRequest").click(function(e) {
        e.preventDefault();
         alert("Friend request sent to " +  $("#friendRequestInput").val());
         postFriendRequest();
        
    });

});


function createAcceptPlayer(i,otherUser){
    $("#addPlayer" + i).click( function(e) {
        e.preventDefault();
        acceptFriendRequest(otherUser);
    });
}

function createRejectPlayer(i,otherUser){
    $("#rejectPlayer" + i).click(function(e) {
        e.preventDefault();
        rejectFriendRequest(otherUser);
    });
}

function createRemovePlayer(i,otherUser){
    $("#removePlayer" + i).click(function(e) {
        e.preventDefault();
        removeFriendRequest(otherUser);
        alert("You are no longer friends with " + otherUser);
    });
}


