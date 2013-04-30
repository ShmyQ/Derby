

$(document).ready(function() {

    //==================
    //  Key Events
    //==================
   $("#usernameInput").focus();
   
    // Pressing enter on passwordInput attempts login
    $("#passwordInput").keyup(function(event){
        event.preventDefault();
		if(event.which === 13){
			loginButton.onclick();  
		}
     });    
    
    // Pressing enter on usernameInput moves focus to passwordInput
    $("#usernameInput").keyup(function(event){
        event.preventDefault();
        if (event.which === 13) {
            $("#passwordInput").focus();
        }
       
	});
    
  
});


// Adapted from https://github.com/es92/mongo-express-auth
/*=============================================
     self loading login manager
=============================================*/

window.addEventListener('load', function(){
    (function(){

        var g = {
            onLoginSuccess: function(){
                 sessionStorage["username"] = usernameInput.value;
                 window.location = '/';
            },
            onRegisterSuccess: function(){
                var username = usernameInput.value;
                var password = passwordInput.value;

                login(username, password);
            },
            onRegisterFail: function(msg){
                $("#message").html("<div class = 'red'>ERROR: " + msg + "</div>");
            },
            onLoginFail: function(msg){
                 $("#message").html("<div class = 'red'>ERROR: " + msg + "</div>");
            }
        }

        //==================
        //  API
        //==================

        window.LoginManager = {
            setLoginSuccess: function(callback){
                g.onLoginSuccess = callback;
            },
            setRegisterSuccess: function(callback){
                g.onRegisterSuccess = callback;
            },
            setRegisterFail: function(callback){
                g.onRegisterFail = callback;
            },
            setLoginFail: function(callback){
                g.onLoginFail = callback;
            }
        }

        //==================
        //  DOM
        //==================

        var loginButton = document.getElementById('loginButton');
        var registerButton = document.getElementById('registerButton');

        var usernameInput = document.getElementById('usernameInput');
        var passwordInput = document.getElementById('passwordInput');

        loginButton.onclick = function(){
            var username = usernameInput.value;
            var password = passwordInput.value;
            
            login(username, password);
        }
        registerButton.onclick = function(){
            var username = usernameInput.value;
            var password = passwordInput.value;

            register(username, password);
        }

        //==================
        //  server API
        //==================

        function login(username, password, done){
            post(
                '/login', 
                {   
                    username: username, 
                    password: password 
                }, 
                handleLoginResult
            );
        }

        function register(username, password, done){
            post(
                '/register', 
                {   
                    username: username, 
                    password: password 
                }, 
                handleRegisterResult
            );
        }

        function handleRegisterResult(err, result){
            if (err)
                throw err;
            if (result === 'ok'){
                g.onRegisterSuccess();
            }
            else
                g.onRegisterFail(result);
        }

        function handleLoginResult(err, result){
            if (err)
                throw err;
            if (result === 'ok')
                g.onLoginSuccess();
            else
                g.onLoginFail(result);
        }

        function post(url, data, done){
            var request = new XMLHttpRequest();
            var async = true;
            request.open('post', url, async);
            request.onload = function(){
                if (done !== undefined){
                    var res = request.responseText
                    done(null, res);
                }
            }
            request.onerror = function(err){
                done(err, null);
            }
            if (data !== undefined){
                var body = new FormData();
                for (var key in data){
                    body.append(key, data[key]);
                }
                request.send(body);
            }
            else {
                request.send();
            }
        }
    })();

});