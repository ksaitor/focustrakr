var fs = require('fs')
      , http = require('http')
      , dateFormat = require('dateformat')
      , crypto = require('crypto')
      , exec = require('child_process').exec;

var myQueue = []
      , child;

exports.getThumbnail = function(url, options, callback){
   // console.log('getThumbnail (' + url + ', ' + options + ', ' + callback + ')');

   var file_url = 'http://mini.s-shot.ru/1194x825/260/?' + url;
   var download_dir = './resources/thumbnails/';
   var file_name = cleanURL(url) + '' + dateFormat(new Date(), "isoDateTime") + '.jpeg';
   console.log('file_name: ' + file_name);

   // TODO make sure that folder exists. If not - create one!
   var wget = 'wget -O ' + download_dir + file_name + ' ' + file_url;

   // execute wget using child_process' exec function
   var child = exec(wget, function(err, stdout, stderr){
      // console.log('stdout: ' + stdout);
      // console.log('stderr: ' + stderr);
      if (err)
         throw err;
      else
         callback(file_name);
   });
}

exports.getShot = function(url, options, callback){
   // console.log('getShot(' + url + ', ' + options + ', ' + callback + ')');

   var download_dir = './resources/screenshots/';
   var file_name = cleanURL(url) + dateFormat(new Date(), "isoDateTime") + '.jpeg';

   // ./wkhtmltoimage-amd64 --disable-smart-width --no-stop-slow-scripts --javascript-delay 5000 --width 1280 --quality 80 http://www.ksaitor.com/ ksmain.jpg
   // xvfb-run --server-args="-screen 0, 1024x768x24" ./wkhtmltoimage-amd64 --width 1280 --enable-plugins --stop-slow-scripts http://ksaitor.com/portfolio ksportfo.jpg
   // xvfb-run --server-args="-screen 0, 1024x768x24" cutycapt --min-width=1280 --plugins=on --delay=5000  --url=http://ksaitor.com/portfolio --out=ksaitor-portfolio.jpg     
   // var wkhtmltoimage = './wkhtmltoimage-amd64 --disable-smart-width --no-stop-slow-scripts --width 1280 --quality 80 ' + url + ' '+download_dir + file_name;
   var cutycapt = 'xvfb-run --server-args="-screen 0, 1024x768x24" cutycapt --min-width=1280 --plugins=on --delay=5000 --url="http://' + url + '" --out=' + download_dir + file_name;

   // This is a queue
   myQueue.push(function(){
      // console.log('myQueue.length='+myQueue.length);
      exec(cutycapt, function(err, stdout, stderr){
         // console.log('stdout: '+stdout);
         // console.log('stderr: '+stderr);
         if (err) {
            throw err;
         } else {
            // console.log('screenshot: '+file_name);
            callback(file_name);
         }
         if (myQueue.length > 0) {
            (myQueue.shift())();
         }
      });
   })
   myQueue.push(function(){
      if (myQueue.length > 0) (myQueue.shift())();
   })

   // console.log('myQueue.length='+myQueue.length);
   if (myQueue.length == 2) {
      (myQueue.shift())();
   }


   /*
    % CutyCapt --help
    -----------------------------------------------------------------------------
    Usage: CutyCapt --url=http://www.example.org/ --out=localfile.png
    -----------------------------------------------------------------------------
    --help                         Print this help page and exit
    --url=<url>                    The URL to capture (http:...|file:...|...)
    --out=<path>                   The target file (.png|pdf|ps|svg|jpeg|...)
    --out-format=<f>               Like extension in --out, overrides heuristic
    --min-width=<int>              Minimal width for the image (default: 800)
    --min-height=<int>             Minimal height for the image (default: 600)
    --max-wait=<ms>                Don't wait more than (default: 90000, inf: 0)
    --delay=<ms>                   After successful load, wait (default: 0)
    --user-styles=<url>            Location of user style sheet, if any
    --header=<name>:<value>        request header; repeatable; some can't be set
    --method=<get|post|put>        Specifies the request method (default: get)
    --body-string=<string>         Unencoded request body (default: none)
    --body-base64=<base64>         Base64-encoded request body (default: none)
    --app-name=<name>              appName used in User-Agent; default is none
    --app-version=<version>        appVers used in User-Agent; default is none
    --user-agent=<string>          Override the User-Agent header Qt would set
    --javascript=<on|off>          JavaScript execution (default: on)
    --java=<on|off>                Java execution (default: unknown)
    --plugins=<on|off>             Plugin execution (default: unknown)
    --private-browsing=<on|off>    Private browsing (default: unknown)
    --auto-load-images=<on|off>    Automatic image loading (default: on)
    --js-can-open-windows=<on|off> Script can open windows? (default: unknown)
    --js-can-access-clipboard=<on|off> Script clipboard privs (default: unknown)
    --print-backgrounds=<on|off>   Backgrounds in PDF/PS output (default: off)
    -----------------------------------------------------------------------------
    <f> is svg,ps,pdf,itext,html,rtree,png,jpeg,mng,tiff,gif,bmp,ppm,xbm,xpm
    -----------------------------------------------------------------------------
    */
}


function cleanURL(url){
   // TODO should be a hashing function
   return url.replace(/\//g, "_").replace(/\?/g, "").replace(/\&/g, "");
}
