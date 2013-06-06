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
// console.log(new Date + " connected to MongoDB");
// //callback, when call to db.open returns
// });


/* =========================================================================== */
exports.newCode = function(){
   return new ObjectID();
}


exports.addFilter = function(SiteID, FILTER, callback){
   var pageurl = FILTER.site.url + FILTER.pathname
         , filterID = new ObjectID();

   Screenshot.getThumbnail(pageurl, null, function(thumbFileName){
      var filter = {
               _id:                  filterID, // passing already existent _id for a new filter
               siteID:               SiteID, // _id of a filter it is related to
               name:                 FILTER.name, // name of the filter
               description:          FILTER.desciption, // description
               dateAdded:            new Date,
               dateDeleted:          null, // in case filter has been deleted from site
               relevantVisitsNumber: 0, // should be updated after quering
               thumbName:            thumbFileName, // name of the thumbnail file
               oldThumbs:            [], // list of old thumbnails
               shotName:             "", // full height screenshot of the page        // TODO should be an array [], to capture a changes in UI over time
               oldShots:             [], // list of old screenshots
               query:                {                         // the query, that is right away going to be passed to the DB driver object. Luckully it is also also in JSON format
                  code:     SiteID,
                  // location: {pathname: FILTER.pathname},
                  pathname: FILTER.pathname
               }
            }
            , response = {
               name:      FILTER.name,
               id:        filterID,
               thumbnail: thumbFileName
            }

      // send filter to client
      callback(response);


      // putting filter into DB
      db.collection('filters', function(err, collection){
         collection.insert(filter, function(){
            console.log("added a new filter")
         });
      })

      // putting filter into site's filters 
      db.collection('sites', function(err, collection){
         collection.update(
               {_id: SiteID},
               {$push: {filters: filterID}},
               function(err){
                  if (err)
                     console.warn(err.message)
                  else
                     console.log('added filter to a site  ');
               }
         )
      })
   })

   // updating object with a screenshot file name
   Screenshot.getShot(pageurl, null, function(shotFileName){
      db.collection('filters', function(err, collection){
         collection.update(
               {_id: filterID},
               {$set: {shotName: shotFileName}},
               function(err, result){
                  if (err) console.warn(err.message);
               });
      })
   })
}


exports.getFilter = function(filter_id, callback){
   db.collection('filters', function(err, collection){
      collection.findOne({_id: ObjectID(filter_id)}, function(err, filter){
         // TODO security cleaning
         // delete filter._id // DO NOT DELETE filter._id !!! It is critical for caching
         callback(filter);
      })
   })
}


exports.getFilters = function(site_id, callback){
   db.collection('sites', function(err, collection){
      collection.findOne({_id: site_id}, function(err, obj){

         // finding site's filters in the sites db
         db.collection('filters', function(err, collection){
            collection.find({_id: {$in: obj.filters}}, function(err, cursor){
               cursor.toArray(function(err, items){
                  // securing data that we about to send to the client side
                  for (var i in items) {
                     items[i].id = items[i]._id;
                     delete items[i]._id;
                     items[i].pathname = items[i].query.pathname;
                     delete items[i].query;
                     delete items[i].siteID;
                     delete items[i].shotName;
                  }
                  callback(items);
               })
            });
         });
      });
   })
}


exports.editFilter = function(site_id, FILTER, callback){
   console.log(FILTER);
   db.collection('filters', function(err, collection){
      collection.update(
            {_id: ObjectID(FILTER.id)},
            {  $set: {name: FILTER.name,
               description: FILTER.description}
            },
            function(err){
               if (err) {
                  console.warn(err.message);
                  callback('error');
               } else {
                  callback('filter_edited');
               }
            }
      )
   })
}


exports.deleteFilter = function(filter_id, site_id, callback){
   // deleting filter from site and putting to deletedFilters
   db.collection('sites', function(err, collection){
      collection.update(
            {_id: site_id},
            {  $pull:     {filters: ObjectID(filter_id)},
               $addToSet: {deletedFilters: ObjectID(filter_id)}
            },
            function(err){
               if (err) {
                  console.warn(err.message);
                  callback('error');
               } else {
                  callback("filter_deleted");
               }
            }
      )
   })

   // setting dateDeleted in filter
   db.collection('filters', function(err, collection){
      collection.update(
            {_id: ObjectID(filter_id)},
            {$set: {dateDeleted: new Date} },
            function(err){
               if (err)
                  console.warn(err.message)
            }
      )
   })
}

exports.updateShots = function(filter_id, pageurl, callback){
   updateThumb(filter_id, pageurl, function(){
   });
   updateShot(filter_id, pageurl, callback);
}

function updateShot(filter_id, pageurl, callback){
   Screenshot.getShot(pageurl, null, function(shotFileName){
      db.collection('filters', function(err, collection){
         collection.findOne(
               {_id: ObjectID(filter_id)},
               function(err, filter){

                  collection.update(
                        {_id: ObjectID(filter_id)},
                        {  $set:      {shotName: shotFileName},
                           $addToSet: {oldShots: filter.shotName}
                        },
                        function(err, result){
                           if (err) console.warn(err.message);
                           callback('done');
                        }
                  );
               }
         )
      })
   });
}
exports.updateShot = updateShot;

function updateThumb(filter_id, pageurl, callback){
   console.log('pageurl=' + pageurl);
   Screenshot.getThumbnail(pageurl, null, function(thumbFileName){
      db.collection('filters', function(err, collection){
         collection.findOne(
               {_id: ObjectID(filter_id)},
               function(err, filter){

                  collection.update(
                        {_id: ObjectID(filter_id)},
                        {  $set:      {thumbName: thumbFileName},
                           $addToSet: {oldThumbs: filter.thumbName}
                        },
                        function(err, result){
                           if (err) console.warn(err.message);
                           callback('done');
                        }
                  );
               }
         )
      })
   });
}
exports.updateThumb = updateThumb; 
