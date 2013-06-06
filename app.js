/*
 * Developed by Raman Shalupau
 * raman.shalupau@gmail.com
 * https://www.linkedin.com/in/ramanshalupau
 *
 * Some more info at http://ksaitor.com/focustrakr/
 *
 * */

// local variables
var express = require('express')
      , app = module.exports = express.createServer()
      , fs = require("fs")
      , RedisStore = require('connect-redis')(express)
      , Visit = require("./save-visit")
      , Users = require('./users')
      , Sites = require("./sites")
      , Filters = require("./filters")
      , Maps = require("./maps");


// Configuration
app.configure(function(){
   app.set('views', __dirname + '/views');
   app.set('view engine', 'jade');
   app.use(express.bodyParser());
   app.use(express.cookieParser());
   app.use(express.session({
      secret: "mysecretcat",
      store:  new RedisStore
   }));
   app.use(express.methodOverride());
   app.use(app.router);
   app.use(express.directory(__dirname));
   app.use(express.static(__dirname + '/public'));

});
app.configure('development', function(){
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
   app.use(express.errorHandler());
});

app.dynamicHelpers({
   session: function(req, res){
      return req.session;
   },
   flash:   function(req, res){
      return req.flash();
   }
});

function requiresLogin(req, res, next){
   if (req.session.user) {
      next();
   } else {
      req.session.error = 'Access denied!';
      res.redirect('/login?redir=' + req.url);
   }
}
var CORS = function(req, res, next){
   res.header('Content-Type', 'text/plain');
   res.header('Access-Control-Allow-Origin', '*');                 // IE8 does not allow domains to be specified, just the *
   res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');    // IE8 doesn't preflight OPTIONS.
   res.header('X-Content-Type-Options', 'true');                   // Note: IE8 doesn't respect this header, might as well set it to false
   res.header('Access-Control-Allow-Credentials', 'nosniff');      // Google Analytics has it
   res.header('Connection', 'keep-alive');
   res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
   res.removeHeader('X-Powered-By');
   // res.removeHeader('Set-Cookie');
   next();
};


// Routes

app.get('/', function(req, res){
   res.render('index', {locals: {
      title: 'FocusTrakr',
      user:  req.session.user
   }});
});

app.get('/resources/:path/:file', requiresLogin, function(req, res){
   var path = req.params.path
         , file = req.params.file
         , filepath = __dirname + '/resources/' + path + '/' + file;

   // TODO add caching

   res.sendfile(filepath, function(err){
      if (err) console.log(err);
   });
});

app.get('/sites', requiresLogin, function(req, res){
   res.render('user/sites', {locals: {
      title: 'FocusTrakr',
      user:  req.session.user
   }});
});
app.post('/sites', requiresLogin, function(req, res){
   switch (req.body.action) {
      case 'addSite':
         Sites.addSite(req.session.user, req.body.url, req.body.name, req.body.tagID, req.body.code, null, function(response){
            res.send(response);
         });
         break;
      case 'newCode':
         res.send(Sites.newCode().toString());
         break;
      case 'editSite':
         res.render(req.session.user, siteID);
         break;
      case 'deleteSite':
         Sites.deleteSite(req.session.user, siteID);
         res.send();
         break;
      case 'getSites':
         Sites.getSites(req.session.user, function(response){
            res.send(response);
         });
         break;
   }
});


app.get('/sites/:site', requiresLogin, function(req, res){
   res.render('user/filters', {locals: {
      title: 'FocusTrakr',
      user:  req.session.user
   }});
});
app.post('/sites/:site', requiresLogin, function(req, res){
   switch (req.body.action) {
      case 'getSite':
         Sites.getSite(req.params.site, function(response){
            res.send(response);
         });
         break;
      case 'addFilter':
         Filters.addFilter(req.params.site, req.body, function(newfilter){
            res.send(newfilter);
         });
         break;
      case 'getFilters':
         Filters.getFilters(req.params.site, function(filters){
            res.send(filters);
         });
         break;
      case 'editFilter':
         Filters.editFilter(req.params.site, req.body, function(response){
            res.send(response);
         });
         break;
      case 'deleteFilter':
         Filters.deleteFilter(req.body.id, req.params.site, function(response){
            res.send(response);
         });
         break;
      case 'updateShots':
         Filters.updateShots(req.body.id, req.body.url, function(response){
            res.send(response);
         });
         break;
      case 'updateShot':
         Filters.updateShot(req.body.id, req.body.url, function(response){
            res.send(response);
         });
         break;
      case 'updateThumb':
         Filters.updateThumb(req.body.id, req.body.url, function(response){
            res.send(response);
         });
         break;
   }
});

app.get('/sites/:site/:filter', requiresLogin, function(req, res){
   res.render('user/view', {locals: {
      title: 'FocusTrakr',
      user:  req.session.user
   }});
});
app.post('/sites/:site/:filter', requiresLogin, function(req, res){
   switch (req.body.action) {
      case 'getFilter':
         Filters.getFilter(req.params.filter, function(response){
            res.send(response);
         });
         break;
      case 'getFilterStats':
         Filters.getFilter(req.params.filter, function(response){
            res.send(response);
         });
         break;
   }
});
app.get('/sites/:site/:filter/map', requiresLogin, function(req, res){
   Filters.getFilter(req.params.filter, function(filter){
      Maps.generate(filter, function(png){
         res.header("Content-Type", "image/png");
         res.end(png, 'binary');
      });
   });
});


app.get('/login', function(req, res){
   res.render('user/login', {locals: {
      title: 'FocusTrakr',
      user:  req.session.user,
      redir: req.query.redir
   }});
});
app.post('/login', function(req, res){
   switch (req.body.action) {
      case "signin":
         Users.authenticate(req.body.login, req.body.password, function(user){
            if (user) {
               req.session.user = user;
               res.redirect(req.body.redir || '/sites');

            } else {
               req.flash('warn', 'incorrect login/pass');
               res.render('user/login', {locals: {
                  title: 'FocusTrakr',
                  redir: req.query.redir
               }});
            }
         });
         break;
      case "register":
         Users.register(req.body.login, req.body.password);
         res.redirect('/sites');
         break;
   }
});
app.get('/logout', function(req, res){
   delete req.session.user;
   res.redirect('/');
});


app.post('/s', CORS, function(req, res){
   // Visit.saveVisit(req.body);
   res.send('ok');
});
app.options('/s', CORS, function(req, res){
   res.send('ok');
});


// Only listen on $ node app.js
if (!module.parent) {
   app.listen(80);
   console.log();
   console.log("Express server listening on port %d", app.address().port);
}