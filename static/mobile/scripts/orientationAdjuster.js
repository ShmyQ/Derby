var isLandscapeMode = window.innerWidth > window.innerHeight;
var lastMode = isLandscapeMode;

$(document).ready(function() {
    adjustForOrientation();
    setInterval(adjustForOrientation,3000);
});

function adjustForOrientation(){
    isLandscapeMode = window.innerWidth > window.innerHeight;
    if(isLandscapeMode !== lastMode) {
        addChatToLandscape();
        adjustButtonsAndBoxes();
    }
    lastMode = isLandscapeMode;
}

function addChatToLandscape() {
        if (isLandscapeMode === true) {
          $("#chat").html("<div id='chatBox' class ='box'>"
            + "<p class='topBar'> Chat </p>"
            + "<div id='chatArea'></div>"
            + "<input id='chatInput' type='text' autocapitalize='off' autocorrect='off' autocomplete='off' x-webkit-speech />"
            + "<button id='sendChat'> Submit </button>"
            + "<div id= 'playerList'><p class = 'topBar bottomPadding'> PLAYERS </p></div>"
            + "</div>");
            
         $("#sendChat").on('tap', function(e) {
            e.preventDefault();
            sendChatToServer($("#chatInput").val());
            $("#chatInput").val("");
        });
           
        }
        
        else {
            $("#chat").html("");
        }
}


function adjustButtonsAndBoxes(){
    if (isLandscapeMode === true) {
         $("#playNow").html("");   
         $("#landscapeMessage").html("Use the portrait orientation on your device to access the 'Play Now' menu.");     
    }
        
    else {
       $("#playNow").html("<div id='playNowBox' class ='box'>"
          +  "<p class = 'topBar'> Play Now! </p>"
          +  "<button id='findMatch'> Find Match </button>"
          +  "<button id='createGame'> Create Game </button>"
          +  "<button id='joinGame'> Join Game </button>"
          +  "</div>");
       $("#landscapeMessage").html("Use the landscape orientation on your device to access the lobby chat."); 
       
    }
     
}