// Adapted from https://github.com/es92/CrossPlatformTodoApp

module.exports = function mobileDesktopRouter(mongoExpressAuth, app){
    
    // Check login 
    app.all('/', function checkLogin(req,res,next){
        mongoExpressAuth.checkLogin(req, res, function(err){
            if (err) {
                res.sendfile(mobileDesktopPrefixer(req) + "/login.html");
            }
            else
               next();
        });
    });
    
   // route to /mobile or /desktop if necessary
    app.all('*', function directoryRouter(req, res, next){
        if (!strStartsWith(req.url, '/desktop') && !strStartsWith(req.url, '/mobile')){
            if (req.useragent.isMobile){
                wwwExists('static/mobile' + req.url, function(exists){
                    if (exists)
                        req.url = '/mobile' + req.url;
                    next();
                });
            }
            else {
                console.log("HERE");
                wwwExists('static/desktop' + req.url, function(exists){
                    if (exists)
                        req.url = '/desktop' + req.url;
                    console.log(req.url);
                    next();
                });
                wwwExists('static/desktop' + req.url + ".html", function(exists){
                    if (exists)
                        req.url = '/desktop' + req.url;
                    console.log(req.url);
                    next();
                });
            }
           
        }
        else {
            next();
        }
    });
};
 
 //==================
//      helpers
//==================

var fs = require('fs');
function wwwExists(url, done){
    return fs.exists(url, done);
}

function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}   


