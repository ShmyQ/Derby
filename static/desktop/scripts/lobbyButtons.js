$(document).ready(function() {
    //==================
    //  Button Events
    //==================
    
    $("#logoutButton").click(function() {  
       post('/logout', undefined, handleLogoutResult);
    });
    
     $("#menu").click(function() {  
        $("#menu").toggleClass("clicked");  
        $("#menuBox").toggleClass("slide"); 
    });
    
    $("#profile").click(function() {  
        $("#profile").toggleClass("clicked");  
        $("#profileBox").toggleClass("slide"); 
    });
    
    $("#friends").click(function() {  
        $("#friends").toggleClass("clicked");  
        $("#friendsBox").toggleClass("slide"); 
    });
    
    $("#learn").click(function() {  
        $("#learn").toggleClass("clicked");  
        $("#learnBox").toggleClass("slide"); 
    });
    
     $("#findMatchButton").click(function() {  
          window.location = '/game';
    });
    
     $("#sendChat").click(function() {  
         sendChat(chatInput.value);
    });
});

