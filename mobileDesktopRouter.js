// Taken from https://github.com/es92/CrossPlatformTodoApp

module.exports = function mobileDesktopRouter(mongoExpressAuth, app){
    app.all('/', function mobileDesktopRouter(req, res, next){
        if (!strStartsWith(req.url, '/desktop') && !strStartsWith(req.url, '/mobile')){
            if (req && req.useragent && req.useragent.isMobile){
                wwwExists('static/mobile' + req.url, function(exists){
                    if (exists)
                        req.url = '/mobile' + req.url;
                    next();
                });
            }
            else {
                wwwExists('static/desktop' + req.url, function(exists){
                    if (exists)
                        req.url = '/desktop' + req.url;
                    next();
                });
            }
        }
        else {
            next();
        }
    });

    app.get('/desktop/', function(req, res, next){
        mongoExpressAuth.checkLogin(req, res, function(err){
            if (err)
                res.sendfile('static/login.html');
            else
                next();
        });
    });

 };
 
 //==================
//      helpers
//==================

var fs = require('fs');
function wwwExists(url, done){
    if (strEndsWith(url, '/'))
        url += 'index.html';
    fs.exists(url, done);
}

function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

function strEndsWith(str, suffix) {
    return str.match(suffix + "$") == suffix;
}