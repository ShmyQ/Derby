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
    
     $("#findMatchButton").click(function(e) { 
        e.preventDefault();
          window.location = '/game';
    });
    
     $("#sendChat").click(function(e) { 
        e.preventDefault();
         sendChatToServer($("#chatInput").val());
    });
   
});

