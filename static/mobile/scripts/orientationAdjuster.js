var isLandscapeMode = window.innerWidth > window.innerHeight;

$(document).ready(function() {
    adjustForOrientation();
    window.addEventListener("deviceorientation", function(event) {
        adjustForOrientation();
    }, true);
});

function adjustForOrientation(){
    isLandscapeMode = window.innerWidth > window.innerHeight;
    addChatToLandscape();
    adjustButtonsAndBoxes();
}

function addChatToLandscape() {
        if (isLandscapeMode === true) {
          $("#chat").html("<div id='chatBox' class ='box'>"
            + "<p id = 'chatBar'> Chat </p>"
            + "<div id='chatArea'></div>"
            + "<input id='chatInput' type='text' autocapitalize='off' autocorrect='off' autocomplete='off' x-webkit-speech />"
            + "<button id='sendChat'> Submit </button>"
            + "</div>");
            
           
        }
        
        else {
            $("#chat").html("");
        }
}

function adjustButtonsAndBoxes(){
    if (isLandscapeMode === true) {
         $("#playNowBox").css({"right": "-100px"});   
         $("#landscapeMessage").html("");
         
    }
        
    else {
       $("#playNowBox").css({"right": "20px"}); 
       $("#landscapeMessage").html("Use the landscape orientation on your device to access the lobby chat."); 
       
    }
     
}