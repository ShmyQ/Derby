
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

    $("#findMatch").click(findMatchClick);
	 
	 function findMatchClick(e) {
		console.log("Finding match");
        e.preventDefault();
        lobby.emit('findMatch', {username: sessionStorage["username"]});
		  
		$("#findMatch").remove();
		$("#createGame").remove();
		$("#joinGame").remove();
		$("#logoutButton").remove();
		  
		var cancelButton = $("<button>");
		cancelButton.html("Cancel");
		cancelButton.attr("id", "cancelButton");
	
		cancelButton.click(function(e) {
			e.preventDefault();
			lobby.emit('cancelFindMatch', {username: sessionStorage["username"]});
			
			$("#cancelButton").remove();
			
			var findMatch = $("<button>");
			findMatch.html("Find Match");
			findMatch.attr("id", "findMatch");
			findMatch.click(findMatchClick);
			var createGame = $("<button>");
			createGame.html("Create Game");
			createGame.attr("id", "createGame");
			var joinGame = $("<button>");
			joinGame.html("Join Game");
			joinGame.attr("id", "joinGame");
			var logout = $("<button>");
			logout.html("Logout");
			logout.attr("id", "logoutButton");
			
			var menuBox = $("#menuBox");
			menuBox.append(findMatch);
			menuBox.append(createGame);
			menuBox.append(joinGame);
			menuBox.append(logout);
		});
		
		$("#menuBox").append(cancelButton);
    }
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
