var Mongo = require('mongodb'),
   // , db = new Mongo.Db('userfocus_dev', new Mongo.Server('127.0.0.1', 27017, {auto_reconnect: true}), {})
   db = require('./db_actions').db,
   clc = require('cli-color'), // CLI coloring   https://github.com/medikoo/cli-color
   ObjectID = require('mongodb').ObjectID,
   Memcached = require('memcached'),
   memcached = new Memcached('127.0.0.1:11211')

var expiretime = 600; // Memcache expiration time in seconds
var banlist = [];
banlist.push("www.muligambia.com");
banlist.push("sg.aubg.bg");

// db.open(function(err, pClient) {
// console.log(new Date + " connected to MongoDB")
// //callback, when call to db.open returns
// });


exports.saveVisit = function(visit) {
   if (!visit.pathname) {
      console.log(new Date + ' ' + visit.pathname + ' pathname:' + visit.pathname);
   }

   // TODO fsync data from MongoDB to the HDD once in a while! - it will free the memory and insure data persistence
   if (!(visit.host in oc(banlist))) {
      // console.log();
      console.log(new Date + ': ' + clc.underline(visit.host + visit.pathname));
      // console.log(clc.red(visit.uKey+' '+visit.movesN));
      // console.log('visit.inittime='+visit.inittime);
      // console.log('visit. endtime='+visit.endtime);
      if (!(visit.browser == 'undefined')) {
         // console.log('browser= '+visit.browser);
      }
      // console.log(clc.cyan('version='+visit.ftver));
      // console.log('visit. submittime='+visit.submittime);

      visit.inittime = new Date(Date.parse(visit.inittime));
      visit.endtime = new Date(Date.parse(visit.endtime));
      visit.submittime = new Date;

      // visit should be the same as pageData from the client
      memcached.get(visit.uKey, function(err, result_id) {
         if (err) console.error("memcached error: ", err);

         if (result_id) {
            db.collection('visits', function(err, collection) {
               if (err) console.log(clc.red(err.message));
               collection.update({
                  _id: ObjectID(result_id)
               }, visit, /*upsert*/ true, function(err, result) { // upsert - that is, if the record(s) do not exist, insert one. Upsert only inserts a single document.
                  if (err) console.log(clc.red(err.message));
               });
            });

            // adding path to the site's document
            db.collection('sites', function(err, collection) {
               if (err) console.log(clc.red(err.message));
               collection.update({
                  _id: visit.code
               }, {
                  $addToSet: {
                     paths: visit.pathname
                  }
               }, function(err) {
                  if (err) console.log(err.message)
               });
            })

            // updating expiration time in Memcached        TODO Does not seem to work!!!!!
            memcached.add(visit.uKey, result_id, expiretime, function(err, result) {
               if (err) console.error("memcached error: ", err);
               // console.log('updating visit.uKey='+visit.uKey+' result_id='+result_id);
            })

         } else {
            visit._id = new ObjectID(); // generating new _id for MongoDB visit document

            memcached.set(visit.uKey, visit._id, expiretime, function(err, result) {
               if (err) console.error("memcached error: ", err);
            });

            db.collection('visits', function(err, collection) {
               if (err) console.log(clc.red(err.message));
               collection.save(visit, function(err, result) {
                  if (err) console.log(clc.red(err.message));
               });
            });
         }
         // memcached.end(); // as we are 100% certain we are not going to use the connection again, we are going to end it
      });

   } else {
      // console.log('site is banned');
   }
}

function mergeObj(obj1, obj2) {
   var obj3 = {};
   for (var attrname in obj1) {
      obj3[attrname] = obj1[attrname];
   }
   for (var attrname in obj2) {
      obj3[attrname] = obj2[attrname];
   }
   return obj3;
}

function oc(a) {
   //tests is value is in array
   var o = {};
   for (var i = 0; i < a.length; i++) {
      o[a[i]] = '';
   }
   return o;
}