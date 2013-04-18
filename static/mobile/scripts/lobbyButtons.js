$(document).ready(function() {
    //==================
    //  Button Events
    //==================

    $("#logoutButton").on('tap', function(e) {
        e.preventDefault(); 
        post('/logout', undefined, handleLogoutResult);
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
    
     $("#findMatchButton").on('tap', function(e) {
        e.preventDefault();
         window.location = '/game';
    });
/*
     $("#sendChat").on('tap', function(e) {
         e.preventDefault();
        sendChatToServer($("#chatInput").val());
        $("#chatInput").val("");
        
    });*/
});