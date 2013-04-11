$(document).ready(function() {
    addChat();
    window.addEventListener("deviceorientation", function(event) {
        addChat();
      }, true);
});

function addChat() {
    var isLandscapeMode = window.innerWidth > window.innerHeight;

        if (isLandscapeMode) {
          $("#chat").html("<div id='chatBox' class ='box'>"
            + "<p id = 'chatBar'> Chat </p>"
            + "<div id='chatArea'></div>"
            + "<input id='chatInput' type='text' autocapitalize='off' autocorrect='off' autocomplete='off' x-webkit-speech />"
            + "<button id='sendChat'> Submit </button>"
            + "</div>")
        }
        
        else 
            $("#chat").html();
}