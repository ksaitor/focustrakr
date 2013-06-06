var Mongo = require('mongodb')
      , db = new Mongo.Db('userfocus_dev', new Mongo.Server('127.0.0.1', 27017, {auto_reconnect: true}), {})
// , db = require('./db_actions').db
      , clc = require('cli-color')     // CLI coloring   https://github.com/medikoo/cli-color
      , ObjectID = require('mongodb').ObjectID
      , Memcached = require('memcached')
      , memcached = new Memcached('127.0.0.1:11211')
      , pngMap = require("./pngMapCreate");


var expiretime = 3600;      // Memcache expiration time in seconds

db.open(function(err, pClient){
   console.log(new Date + " connected to MongoDB")
});


exports.generate = function(filter, callback){
   /* Proxy for compounding pageDatas, generating pngOverlay and calling callback to send it back
    * it also checks if overlay already exists in cache 
    * 
    * returns (via callback): binary png buffer 
    */

   memcached.get(filter._id + 1, function(err, png){       // Caching OFF!
      // memcached.get(filter._id, function(err, png){      // Caching ON!
      if (err)       console.error("memcached error: ", err)
      if (png) {
         console.log('png from cache');
         callback(new Buffer(png, 'base64').toString('binary'));

      } else {
         getMap(filter.query, /*limit*/ 1000, function(pageData){
            pngMap.createMapOverlay(pageData, filter._id, function(png){
               callback(png.toString('binary'));

               var pngCache = png.toString('base64');
               // putting png in cache
               memcached.add(filter._id, pngCache, expiretime, function(err, result){
                  if (err) {
                     console.error("memcached error: ", err)
                  } else {
                     console.log('added png for ' + filter._id);
                  }
               })
            });
         });
      }
   });


};

function getMap(filterQuery, limit, callback){
   /*
    * map filtering and compounding
    * preparing filter for quering
    * returns (via callback): compounded pageData object 
    */

   filterQuery = filterQuery || {};
   limit = limit || 1000;
   var map = {
      url:        "",
      page:       {height: 4, width: 0},
      moves:      {},
      movesMax:   0,
      clicks:     {},
      scrolls:    {},
      scrollsMax: 0
   };

   var now = new Date
         , qDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

   console.log('  now=' + now);
   console.log('today=' + qDate);

   // filterQuery = mergeObj(filterQuery,{inittime:{$gte: qDate}});

   // TODO compound clicks, scrolls
   console.log(filterQuery);
   // these operations performed in async mode
   db.collection('visits', function(err, collection){
      // collection.find(filter).limit(10).toArray(function(err, doc){
      collection.find(filterQuery, {limit: limit}, function(err, cursor){
         cursor.toArray(function(err, docs){
            console.log("Returned " + docs.length + " documents");
            docs.forEach(function(doc){
               // doc[n] is a visit object
               if (map.page.height < doc.page.height) map.page.height = doc.page.height;
               // if (map.page.width < doc.page.width) map.page.width = doc.page.width;
               var moves = doc.moves
                     , clicks = doc.clicks;

               if (doc.movesMax > map.movesMax) {
                  map.movesMax = doc.movesMax;
               }
               for (var x in moves) {
                  if ((x > 0) && (x < 1281)) {
                     var Xm = moves[x];
                     if (typeof map.moves[x] == 'undefined') {
                        map.moves[x] = Xm;
                     } else {
                        for (var y in Xm) {
                           if (typeof map.moves[x][y] == 'undefined') {
                              map.moves[x][y] = Xm[y];
                           } else {
                              map.moves[x][y] += Xm[y];

                              /*
                               // this is inefficient
                               if (map.moves[x][y] > map.movesMax) {
                               map.movesMax = map.moves[x][y];
                               }
                               */
                           }
                        }
                     }
                  }
               }
               for (var x in clicks) {
                  if ((x > 0) && (x < 1281)) {
                     var Xm = clicks[x];
                     if (typeof map.clicks[x] == 'undefined') {
                        map.clicks[x] = Xm;
                     } else {
                        for (var y in Xm) {
                           if (typeof map.clicks[x][y] == 'undefined') {
                              map.clicks[x][y] = Xm[y];
                           } else {
                              map.clicks[x][y] += Xm[y];
                           }
                        }
                     }
                  }
               }
            });

            /* finding movesMax */
            for (var x in map.clicks) {
               var Xm = map.clicks[x];
               for (var y in Xm) {
                  if (Xm[y] > map.movesMax) {
                     map.movesMax = Xm[y];
                  }
               }
            }

            map.clicks = alterClicks(map.clicks, 4);

            callback(map);
         });
         // should return a map object ready to be traced by pngMapOverlay
         // console.log(map);

      });
   });
}

function mergeObj(obj1, obj2){
   var obj3 = {};
   for (var attrname in obj1) {
      obj3[attrname] = obj1[attrname];
   }
   for (var attrname in obj2) {
      obj3[attrname] = obj2[attrname];
   }
   return obj3;
}
function oc(a){
   //tests is value is in array 
   var o = {};
   for (var i = 0; i < a.length; i++) {
      o[a[i]] = '';
   }
   return o;
}


function alterMap(oldMap, r){
   var newMap = {}
         , myQueue = [];

   for (var x in oldMap) {
      if ((x > 0) && (x < 1280)) {
         for (var y in oldMap[x]) {
            myQueue.push('newMap = circle(newMap,' + oldMap[x][y] + ',' + x + ',' + y + ',' + r + ')');
         }
      }
   }
   return queue();


   function queue(){
      if (myQueue.length > 0) {
         eval(myQueue.shift());
         queue();
      }
      if (myQueue.length == 0) {
         return newMap;
      }
   }

   ;

}

function alterClicks(oldMap, r){
   var newMap = {}
         , myQueue = [];

   for (var x in oldMap) {
      if ((x > 0) && (x < 1280)) {
         for (var y in oldMap[x]) {
            myQueue.push('newMap = cross(newMap,' + x + ',' + y + ',' + r + ')');
         }
      }
   }
   return queue();


   function queue(){
      if (myQueue.length > 0) {
         eval(myQueue.shift());
         queue();
      }
      if (myQueue.length == 0) {
         return newMap;
      }
   }

   ;

}

function circle(newMap, val, xc, yc, r){
   // CircleBresenham
   var x = 0
         , y = r
         , p = 3 - 2 * r;

   while(x <= y) {
      // newMap = putpixel(newMap, val, (xc + x)/10, (yc + y)/10);
      // newMap = putpixel(newMap, val, xc - x, (yc + y)/10);
      newMap = drawLine(newMap, val, (xc - x), (yc + y), (xc + x), (yc + y));

      // newMap = putpixel(newMap, val, (xc + x)/10, yc - y);
      // newMap = putpixel(newMap, val, xc - x, yc - y);
      newMap = drawLine(newMap, val, (xc - x), (yc - y), (xc + x), (yc - y));

      // newMap = putpixel(newMap, val, (xc + y)/10, (yc + x)/10);
      // newMap = putpixel(newMap, val, xc - y, (yc + x)/10);
      newMap = drawLine(newMap, val, (xc - y), (yc + x), (xc + y), (yc + x));

      // newMap = putpixel(newMap, val, (xc + y)/10, yc - x);
      // newMap = putpixel(newMap, val, xc - y, yc - x);
      newMap = drawLine(newMap, val, (xc - y), (yc - x), (xc + y), (yc - x));

      if (p < 0) {
         p += 4 * x++ + 6;
      } else {
         p += 4 * (x++ - y--) + 10;
      }
   }
   return newMap;
}
function circleFilled(newMap, val, xc, yc, r){
   var x = 0
         , y = r
         , p = 3 - 2 * r;

   for (var x = -r; x < r; x++) {
      var height = Math.sqrt(r * r - x * x);

      for (var y = -height; y < height; y++) {
         newMap = putpixel(newMap, val, x + xc, y + yc);
      }
   }
   return newMap;
}

function cross(newMap, x, y, d){
   newMap = drawLine(newMap, 1, (x - d), (y - d), (x + d), (y + d));
   newMap = drawLine(newMap, 1, (x + d), (y - d), (x - d), (y + d));

   return newMap;
}

function drawLine(newMap, val, x1, y1, x2, y2){
   //console.log('drawing a line1. x1='+x1+' y='+y1 + ' x2='+x2+' y2='+y2);
   var dx = x1 - x2
         , dy = y1 - y2;

   if (dy == 0) {
      for (var x = Math.min(x1, x2); x <= Math.max(x1, x2); ++x) {
         newMap = putpixel(newMap, val, x, y1);
      }

   } else if (dx == 0) {
      for (var y = Math.min(y1, y2); y <= Math.max(y1, y2); ++y) {
         newMap = putpixel(newMap, val, x1, y);
      }
   } else {
      var m = dy / dx
            , b = y1 - m * x1;

      if (Math.abs(dy) <= Math.abs(dx)) {
         for (var x = Math.min(x1, x2); x <= Math.max(x1, x2); ++x) {
            newMap = putpixel(newMap, val, x, Math.round(m * x + b));
         }
      } else {
         for (var y = Math.min(y1, y2); y <= Math.max(y1, y2); ++y) {
            newMap = putpixel(newMap, val, Math.round((y - b) / m), y);
         }
      }
   }

   return newMap;
}

function putpixel(map, val, x, y){
   //rounding just in case
   x = x << 0;
   y = y << 0;

   if ((x > 0) && (x < 1280)) {
      if ((typeof map[x] == 'undefined') || (map[x] == null)) {
         map[x] = {};
      }
      if ((typeof map[x][y] == 'undefined') || (map[x][y] < val)) {
         map[x][y] = val;
      }
   }
   return map;
}