var Mongo = require('mongodb')
      , db = new Mongo.Db('userfocus_dev', new Mongo.Server('127.0.0.1', 27017, {}), {})
      , ObjectID = require('mongodb').ObjectID;

db.open(function(err, pClient){
   console.log(new Date + " connected to MongoDB from DB-module")
   //callback, when call to db.open returns
});

exports.db = db;
