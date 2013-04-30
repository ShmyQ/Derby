  var lobby = io.connect('http://128.237.87.127:8007/lobby');
  
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


    $("#play").on('tap',findMatchClick);

	 function findMatchClick(e) {
		console.log("Finding match");
        e.preventDefault();
        lobby.emit('findMatch', {username: sessionStorage["username"]});
		$("#play").remove();
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

     $("#sendChat").on('tap', function(e) {
         e.preventDefault();
        if($("#chatInput").val() !== "") {
            sendChatToServer($("#chatInput").val());
            $("#chatInput").val("");
        }
        

    });
    
    $("#scrollUpFriends").on('tap', function(e) {
         e.preventDefault();
         $('#friendsList').scrollTo( '-=20px' );
    });
    
    $("#scrollUpRequests").on('tap', function(e) {
         e.preventDefault();
         $('#requestList').scrollTo( '-=20px' );

    });
    
    $("#scrollDownFriends").on('tap', function(e) {     
        e.preventDefault();
        $('#friendsList').scrollTo( '+=20px' );
    });
    
    $("#scrollDownRequests").on('tap', function(e) {
        e.preventDefault();
        $('#requestList').scrollTo( '+=20px' );
 
    });
    
    $("#stopHighlight").on('tap', function(e) {
        e.preventDefault();
    });
    
     $("#sendFriendRequest").on('tap', function(e) {
        e.preventDefault();
        if($("#friendRequestInput").val() !== "") {
             alert("Friend request sent to " +  $("#friendRequestInput").val());
             postFriendRequest();
        }
    });
    
    // To make all css on the page load.
    $("#sendChat").focus();
});

function createAcceptPlayer(i,otherUser){
    $("#addPlayer" + i).on('tap', function(e) {
        e.preventDefault();
        var r=confirm("Are you sure you want to accept " + otherUser + "'s friend request?");
        if (r===true){
            acceptFriendRequest(otherUser);
        }
    });
}

function createRejectPlayer(i,otherUser){
    $("#rejectPlayer" + i).on('tap', function(e) {
        e.preventDefault();
        var r=confirm("Are you sure you want to reject " + otherUser + "'s friend request?");
        if (r===true){
           rejectFriendRequest(otherUser);
        }
    });
}
function createRemovePlayer(i,otherUser){
    $("#removePlayer" + i).on('tap', function(e) {
        e.preventDefault();
        var r=confirm("Are you sure you want to remove " + otherUser + " from your friends?");
        if (r===true){
          removeFriendRequest(otherUser);
        }      
    });
}

lobby.on('joinGame', function (data) {
	console.log("joining game");
    window.location = '/game';
});
