var socket = io.connect('http://128.237.136.83:8888/');

var chat = io.connect('http://128.237.136.83:8888/chat');
var lobbyPlayers;

chat.on('connect', function () {
    chat.emit('joinLobby', { name : socket.id} );
    chat.on('receivePlayers', function (players) {
        console.log('I received', players);
        lobbyPlayers = players;
        console.log("lobbyPlayers " + lobbyPlayers);
    });
});
