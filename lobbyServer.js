
module.exports = function (mongoExpressAuth, app,io, map){
    /* GAME PIECES NEEDED */
	
    // array of all the games
    var games = [];
	module.exports.games = games;
	
    // hash of socket ids to game number that they are in
    var usersGame = new Object();
	module.exports.usersGame = usersGame;
    
    // ** LOBBY	**
    var IDToPlayer = new Object();
    var lobbyPlayers = [];
     // tally of last game number to be given out
    var gameNumber = 0;
    // number of players waiting
    var newGamePlayerCount = 0;
    // current game being made
    var curGame = {players: [], connected: 0, sockets: new Object(), id: 0, started: false, map: map.slice(0)};
    var playersToStart = 2;
   
    var lobby = io.of('/lobby').on('connection', function (socket) {
        socket.on('joined',function(data){
            if(lobbyPlayers.indexOf(data.username) !== -1 && lobbyPlayers[lobbyPlayers.indexOf(data.username)].length === data.username.length){
                // Sends to everybody, only needs to send to the 2 ppl
                lobby.emit('twoInstances', data);
            }
            else {
                lobbyPlayers.push(data.username);
                IDToPlayer[socket.id] = data.username;
                lobby.emit('receivePlayers', {
                    players: lobbyPlayers
                });
            }
        });

        socket.on('sendChat', function(data){
            lobby.emit('receiveChat',{
                user : data.username,
                msg : removeHTML(data.msg),
            });
        });

        socket.on('findMatch', function(data){
            console.log("finding match");
            curGame.players[newGamePlayerCount] = data.username;
            curGame.sockets[data.username] = socket;
            newGamePlayerCount++;

            // if there are enough players waiting
            if (newGamePlayerCount === playersToStart) {
                console.log("creating match");
                gameNumber++;

                for (var i = 0; i < curGame.players.length; i++) {
                    // tell each player to join
                    curGame.sockets[curGame.players[i]].emit('joinGame');

                    // add hash from players username to game id
                    console.log("adding ", curGame.players[i], " to usersGame");
                    usersGame[curGame.players[i]] = gameNumber;
                }
                games[gameNumber] = curGame;

                // reset for next new game
                newGamePlayerCount === 0;
                curGame = {players: [], connected: 0, sockets: new Object(), id: gameNumber, started: false, map: map.slice(0)};
            }
        });
		
		socket.on('cancelFindMatch', function(data){
			newGamePlayerCount--;
			delete curGame.sockets[data.username];
			curGame.players.splice(curGame.players.indexOf(data.username), 1);
			
			console.log("Remainging queued players: ", curGame.players);
		});
        
        socket.on('disconnect', function(data){
            // If not already disconnected ie: two instances.
            if(lobbyPlayers.indexOf(IDToPlayer[socket.id]) !== -1){
                lobbyPlayers.splice(lobbyPlayers.indexOf(IDToPlayer[socket.id]),1);
                delete IDToPlayer[socket.id];
                lobby.emit('receivePlayers', {
                    players: lobbyPlayers
                });
             }
        });
    });
    
       app.post('/getPlayers',function(req,res){
        mongoExpressAuth.getAccount(req, function(err, result){
            if (err)
                res.send(err);
            else {
                res.send(lobbyPlayers);
            }
        });
    });

    //==================
    // Helpers
    //==================

    // Remove html tags (<*>)from chat
    function removeHTML(input){
       return input.replace( /<.*?>/,'');
    }
    
};
