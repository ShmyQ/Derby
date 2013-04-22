$(document).ready(function() {
    var socketScript = document.createElement("script");
    socketScript.type = "text/javascript";

    $.getJSON( "http://smart-ip.net/geoip-json?callback=?",
        function(data){
            socketScript.src = "http://" +  data.host + ":8888/socket.io/socket.io.js";
        }
    );

    $("body").append(socketScript);  
    
    var lobbyScript = document.createElement("script");
    lobbyScript.type = "text/javascript";
    lobbyScript.src = "scripts/lobby.js";
     $("body").append(lobbyScript);  
     
    var lobbyButtonScript = document.createElement("script");
    lobbyButtonScript.type = "text/javascript";
    lobbyButtonScript.src = "mobile/scripts/lobbyButtons.js";
     $("body").append(lobbyScript);  
});
