// Taken from https://github.com/es92/CrossPlatformTodoApp

module.exports = function loginRoutes(mongoExpressAuth, app){
    app.post('/login', function(req, res){
        mongoExpressAuth.login(req, res, function(err){
            if (err) {
                res.send(err);
            }
            else {
                res.send('ok');
            }
        });
    });

    app.post('/logout', function(req, res){
        mongoExpressAuth.logout(req, res);
        res.send('ok');
    });

    app.post('/register', function(req, res){
        mongoExpressAuth.register(req, function(err){
            if (err) {
                res.send(err);
            }
            else {
                res.send('ok');
            }
        });
    });
};