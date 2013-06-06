var Mongo = require('mongodb')
// , db = new Mongo.Db('userfocus_dev', new Mongo.Server('127.0.0.1', 27017, {}), {})
      , db = require('./db_actions').db
      , clc = require('cli-color')                   // CLI coloring   https://github.com/medikoo/cli-color
      , crypto = require('crypto')
      , ObjectID = require('mongodb').ObjectID
      , Memcached = require('memcached')
      , memcached = new Memcached('127.0.0.1:11211');

// db.open(function(err, pClient) {
// //callback, when call to db.open returns
// });


/* =========================================================================== */
exports.authenticate = function(login, password, callback){
   var filter = {email: login, pwd: password};
   db.collection('users', function(err, collection){
      collection.findOne(filter, function(err, user){
         if (user) {
            // updating last active date
            collection.update({_id: user._id}, {'$set': {lastActive: new Date} });
            callback(user);
         } else {
            callback(null);
         }
      });
   });
}

exports.register = function(login, password, callback){
   var user = {
      email:        login, // login & email information
      pwd:          password,
      name:         {first: "", last: ""},
      dateCreated:  new Date, // current date of object creation
      lastActive:   new Date, // this field is updated upon each login
      sites:        [], // array of _ids of sites that are linked to user profile
      deletedSites: [], // if user chooses to delete a web site from his profile, the site, obviously, does not get deleted from the system. However it gets delinked from user profile
      accBalance:   {              // some basic payment informations. Has to be expanded with separated several collections
         currBalance:       0,
         lastPayDate:       0,
         lastPaymentAmount: 0
      },
      lang:         "US English"         // interface language preference
   };

   db.collection('users', function(err, collection){
      collection.insert(user, function(){
         console.log("added a new user");
      });
   })
}

exports.editUser = function(user){
   db.collection('users', function(err, collection){
      collection.insert(user, function(){
         //callback
         console.log("edited a user");
      });
   })
}

exports.deleteUser = function(user){
   // TODO add to user's name '-deleted' and maybe erase password from the profile

}


function hash(msg, key){
   return crypto.createHmac('sha256', key).update(msg).digest('hex');
}