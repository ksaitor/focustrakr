var fs = require('fs')
      , util = require('util')
      , Memcached = require('memcached')
      , memcached = new Memcached('127.0.0.1:11211')
      , Png = require('png').Png
      , Buffer = require('buffer').Buffer
      , pngMap = require("./pngMapCreate");

/*
 * Val=		255		510		765		1020
 * Blue		Cyan	Green	Yellow	Red
 *   ------> ------> ------> ------>
 * R:0		0		0++		255		255
 * G:0++	255		255		255--	0
 * B:255	255--	0		0		0
 */


exports.createMapOverlay = function(pageData, filter_id, callback){      // TODO maxVal should be changed to normalizing multiplier and generated on the client side
   /* Creates a png buffer from compounded pageData
    * returns (via callback): binary png buffer
    */
   var date = new Date()
         , width = 1280
         , height = pageData.page.height
         , rgba = new Buffer(width * height * 4)
         , val
         , coef = 1020 / pageData.movesMax;		// generating a normalization coefficient. Should be generated and passed by client. TODO depreciate in future - should be generated on the client side

   // First we are filling the entire buffer with one color
   rgba.fill(0);
   // Now fill with transparency
   for (var i = 0; i < height; i++) {
      var wid = i * width * 4 + 3;
      for (var j = 0; j < width; j++) {
         rgba[wid + (j << 2)] = 200;       // (j*4) == (j<<2) for fast multiplication by 4
      }
   }

   var red, green, blue, alpha, pos, kk = 0, inin = 0;

   var d1 = new Date;
   for (y in pageData.moves) {                 // traversal of the compounded matrix starts
      for (x in pageData.moves[y]) {
         kk++;             // TODO remove. it is tmp
         val = (pageData.moves[y][x] * coef) << 0;     // normalizing value
         if ((val > -1) && (val < 1021)) {                // initial value range check
            inin++;        // TODO remove. it is tmp
            red = 1;
            green = 1;
            blue = 180;
            if (val > 1 && val < 256) {                  // Blue to Cyan
               red = 0;
               green = val;
               blue = 255;
               alpha = 160;
            } else if (val > 255 && val < 511) {         // Cyan to Green
               red = 0;
               green = 255;
               blue = 510 - val;
               alpha = 110;
            } else if (val > 510 && val < 766) {         // Green to Yellow
               red = val - 510;
               green = 255;
               blue = 0;
               alpha = 100;
            } else if (val > 765 && val < 1001) {        // Yellow to almost Red
               red = 255;
               green = 1020 - val;
               blue = 0;
               alpha = 40;
            } else if (val > 1000) {                 // let top 2% of all values be red
               red = 255;
               green = 0;
               blue = 0;
               alpha = 20;
            }
            pos = x * width * 4 + y * 4;     // additional step for performance optimized calculations
            rgba[pos] = red;         // storing pixel color value in a rgba buffer
            rgba[pos + 1] = green;
            rgba[pos + 2] = blue;
            rgba[pos + 3] = alpha;
         }
      }
   }

   console.log(kk + ' =kk');
   console.log(inin + ' =inin');

   for (x in pageData.clicks) {
      for (y in pageData.clicks[x]) {
         rgba = putClick(y, x, rgba);
      }
   }


   var png = new Png(rgba, width, height, 'rgba').encodeSync();
   // var filename = './resources/maps/map' + date.getHours() + '' +	date.getMinutes() + '' + date.getMilliseconds() + '-' + date.getDate() + '' +	date.getMonth()+1 + '' + date.getFullYear() + '.png';
   // fs.writeFileSync(filename, png.encodeSync().toString('binary'), 'binary');
   callback(png);

   console.log((new Date - d1) + ' =total traversal time');
   console.log(new Date + ' finished traversing clicks. Creating png object.');


   function putClick(x, y, rgba){
      var red = 255
            , green = 0
            , blue = 0
            , alpha = 0

            , x0 = x * width * 4
            , x1 = (x - 1) * width * 4
            , x2 = (x - 2) * width * 4
            , x_1 = (x + 1) * width * 4
            , x_2 = (x + 2) * width * 4
            , y0 = y * 4
            , y1 = (y - 1) * 4
            , y2 = (y - 2) * 4
            , y_1 = (y + 1) * 4
            , y_2 = (y + 2) * 4;
      // rgba[x0 + y0 + 0] = red;
      // rgba[x0 + y0 + 1] = green;
      // rgba[x0 + y0 + 2] = blue;
      // rgba[x0 + y0 + 3] = alpha;

      rgba[x0 + y0 + 0] = red;
      rgba[x0 + y0 + 1] = green;
      rgba[x0 + y0 + 2] = blue;
      rgba[x0 + y0 + 3] = alpha;

      return rgba
   }
}