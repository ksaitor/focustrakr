var express = require('express')
      , app = module.exports = express.createServer()
// , fs = require("fs")
      , MemcacheStore = require('connect-memcached')(express)
      , Visit = require("./save-visit");

// Configuration
app.configure(function(){
   app.set('views', __dirname + '/views');
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(app.router);
   app.use(express.directory(__dirname));
});
app.configure('development', function(){
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
   app.use(express.errorHandler());
});

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
}


// Routes
app.get('/', function(req, res){
   res.send('Hello. I\'m FocusTrakr! /');
});

app.options('/s', CORS, function(req, res){
   res.send('ok');
});
app.post('/s', CORS, function(req, res){
   // console.log(new Date + ' request');
   res.send('ok');
   Visit.saveVisit(req.body);
});
app.get('/s', CORS, function(req, res){
   res.send('Hello. I\'m FocusTrakr!');
});


// Only listen on $ node app.js
if (!module.parent) {
   app.listen(8888);
   console.log();
   console.log("Tracker server listening on port %d", app.address().port);
}