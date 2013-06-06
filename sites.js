var Mongo = require('mongodb')
// , db = new Mongo.Db('userfocus_dev', new Mongo.Server('127.0.0.1', 27017, {}), {})
      , db = require('./db_actions').db
      , clc = require('cli-color')             // CLI coloring   https://github.com/medikoo/cli-color
      , crypto = require('crypto')
      , URL = require('url')
      , ObjectID = require('mongodb').ObjectID
      , Memcached = require('memcached')
      , memcached = new Memcached('127.0.0.1:11211')
      , Screenshot = require('./screenshots');

// db.open(function(err, pClient) {
// //callback, when call to db.open returns
// });


/* =========================================================================== */
exports.newCode = function(){
   return new ObjectID();
}

exports.addSite = function(user, url, name, tagID, code, obj_id, callback){
   var code = code || obj_id || ''
         , url = (URL.parse(url).host || URL.parse(url).href).replace('/', '');

   Screenshot.getThumbnail(url, null, function(thumbFileName){
      var site = {
               _id:            obj_id || code || new ObjectID(),
               uid:            user._id.toString(),
               name:           name,
               code:           code, // unique site identifier
               url:            url,
               ip:             "", // should resolve IPs automatically
               thumbName:      thumbFileName, // screenshot thumb of site's index
               paths:          [], // list of site's pathnames (subpages URIs)
               filters:        [], // list of filter _ids
               deletedFilters: []
            }
            , response = {
               name:      name,
               url:       url,
               code:      code,
               thumbnail: thumbFileName
            }

      db.collection('sites', function(err, collection){
         collection.insert(site, function(){
            console.log("added a new site");
         });
      })

      // adding site id to user's profile
      db.collection('users', function(err, collection){
         collection.update(
               {_id: ObjectID(user._id)},
               {$push: {sites: code.toString()}},
               function(err){
                  if (err) console.warn(err.message)
                  else console.log('added site to user\'s account');
               }
         );
      })

      callback(response);  // should be JSON to be processed on the client side
   });
}

exports.getSites = function(user, callback){
   // finding what sites are on user's profile
   db.collection('users', function(err, collection){
      collection.findOne({_id: ObjectID(user._id)}, function(err, obj){

         // finding user's sites in the sites db
         db.collection('sites', function(err, collection){
            collection.find({_id: {$in: obj.sites}}, function(err, cursor){
               cursor.toArray(function(err, items){
                  // securing data that we about to send to the client side
                  for (var i in items) {
                     delete items[i].uid,
                           delete items[i]._id;
                     delete items[i].ip;
                     delete items[i].filters;
                     delete items[i].pages;
                     delete items[i].deletedFilters;
                     delete items[i].paths;
                  }
                  callback(items);
               })
            });
         });
      });
   })
}

exports.getSite = function(site_id, callback){
   // finding user's site for filters page
   db.collection('sites', function(err, collection){
      collection.findOne({_id: site_id}, function(err, site){
         // securing data that we about to send to the client side
         delete site._id;
         delete site.ip;
         delete site.deletedFilters;
         delete site.uid;
         callback(site);
      });
   });
}

exports.editSite = function(user, site_id){

}


exports.deleteSite = function(user, site_id){
   // TODO add deleted site to .deletedSites
   db.collection('users', function(err, collection){
      collection.update(
            {_id: user._id},
            {'$pull': {sites: site_id} },
            function(){
               // success
               console.log('site is removed from user\'s account');
            }
      );
   })
}

exports.deleteSiteComplete = function(site_id){

}

