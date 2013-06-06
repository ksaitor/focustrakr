var express = require('express')
      , app = module.exports = express.createServer()
      , fs = require("fs")
      , MemcacheStore = require('connect-memcached')(express)
      , Db = require("./db_api")
      , Users = require('./users')
      , pngMap = require("./pngMapCreate")
      , Sites = require("./sites")
      , Maps = require("./maps");
// , memcacheStore = new MemcacheStore({ hosts: "127.0.0.1:11211"});

app.get('/', function(req, res){
   res.render('index', {locals: {
      title: 'UserFocus',
      user:  req.session.user
   }});
});


app.get('/resources/:path/:file', requiresLogin, function(req, res){
   var path = req.params.path
         , file = req.params.file
         , filepath = __dirname + '/resources/' + path + '/' + file;

   // TODO add caching

   res.sendfile(filepath, function(err){
      if (err)
         console.log(err);
   });
});

app.get('/sites/:site?', requiresLogin, function(req, res){
   res.render('user/sites', {locals: {
      title: 'UserFocus',
      user:  req.session.user,
   }});
});
app.post('/sites', requiresLogin, function(req, res){
   switch (req.body.action) {
      case 'addSite':
         Sites.addSite(req.session.user, req.body.url, req.body.name, req.body.tagID, req.body.code, null, function(response){
            res.send(response);
         })
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

app.post('/filters', requiresLogin, function(req, res){
   switch (req.body.action) {
      case 'addFilter':
         break;
      case 'getFilters':
         break;
      case 'editFilter':
         break;
      case 'deleteFilter':
         break;
   }
});


app.get('/sites/filters', requiresLogin, function(req, res){
   res.render('user/filters', {locals: {
      title: 'UserFocus',
      user:  req.session.user,
   }});
});
app.get('/sites/filters/view', requiresLogin, function(req, res){
   res.render('user/view', {locals: {
      title: 'UserFocus',
      user:  req.session.user,
   }});
});


app.get('/login', function(req, res){
   res.render('user/login', {locals: {
      title: 'UserFocus',
      user:  req.session.user,
      redir: req.query.redir,
   }});
});

app.post('/login', function(req, res){
   switch (req.body.action) {
      case "signin":
         Users.authenticate(req.body.login, req.body.password, function(user){
            if (user) {
               console.log(user._id);
               req.session.user = user;
               res.redirect(req.body.redir || '/sites');
            } else {
               req.flash('warn', 'incorrect login/pass');
               res.render('user/login', {locals: {
                  title: 'UserFocus',
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
})


app.post('/s', CORS, function(req, res){
   console.log(req.body);
   // Maps.saveVisit(req.body);
   res.send('ok');
});
app.options('/s', CORS, function(req, res){
   res.send('ok');
});

// function route(pathname, handle, response, postData) {
// console.log("About to route a request for " + pathname);
// if (typeof handle[pathname] === 'function') {
// return handle[pathname](response, postData);
// } else {
// console.log("No request handler found for " + pathname);
// response.writeHead(404, { "Content-Type": "text/plain" });
// response.write("404 Not found");
// response.end();
// }
// }
// 
// exports.route = route;