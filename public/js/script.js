   $('.dropdown-toggle').dropdown();
$('a[rel="tooltip"]').tooltip('toggle');
// $('.modal-body a').popover();

try {
   console.warn(new Date + ' app started');
   var
       path1 = window.location.pathname.split( '/' )[1],
       path2 = window.location.pathname.split( '/' )[2],
       path3 = window.location.pathname.split( '/' )[3];
       
   
   // On sites
   if(path1 == 'sites' && path2 == null) {
      console.log('On sites');
      var code, fixedElem, sites;
      
      // get user's sites
      $.ajax({
         type: "POST",
         url: document.URL,
         data: "action=getSites"
      }).done(function(data) {
         sites = data;
         console.log(sites);
         // adding sites to view
         sites.forEach(function(site, index, array){
            $('ul.thumbnails > li:last-child').before(
               '<li class="span3">' +
                 '<a href="#editSite" data-toggle="modal" class="btn hidden">'+
                     '<i class="icon-pencil"></i> Edit'+
                 '</a>'+
                 '<a href="sites/'+site.code+'" class="thumbnail">' +
                     '<img src="http://'+window.location.host+'/'+'resources/thumbnails/'+site.thumbName+'" alt="'+ site.url+' thumbnail">' +
                 '</a>' +
               '</li>'
            );
         });
        
         // initializing behavior for edit buttons 
         $('.span3').mouseover(function(){
            $(this).children('a[href="#editSite"]').removeClass('hidden');
         }).mouseout(function() {
            $(this).children('a[href="#editSite"]').addClass('hidden');
         });;
         
      });
      
       
      // adding a new site. modal window   
      $('#addSiteModal').on('show', function(){
         $('input[name="url"]').val('');
         $('input[name="sitename"]').val('');
         $('input[name="fixedElemID"]').val('');
         code = fixedElem = '';

         $.ajax({
           type: "POST",
           url: document.URL,
           data: "action=newCode"
         }).done(function(data) {
            code = data;
            $('p#tracking').text('<script type="text/javascript">var pageData={code:"'+code+'", ofid:"'+fixedElem+'"}; (function(){var a=document.createElement("script"); a.type="text/javascript";a.async=!0;a.src="http://ksaitor.com/ft.js";try{var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(a,b)}catch(c){}})();</script>');
         });
         
         $('input[name="fixedElemID"]').keyup(function() {
            // TODO add hashtag filtering - if placed - remove it
            fixedElem = $('input[name="fixedElemID"]').val();
            $('p#tracking').text('<script type="text/javascript">var pageData={code:"'+code+'", ofid:"'+fixedElem+'"}; (function(){var a=document.createElement("script"); a.type="text/javascript";a.async=!0;a.src="http://ksaitor.com/ft.js";try{var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(a,b)}catch(c){}})();</script>');
         });
         
         $('a[href="#addSite"]').click(function(){
            var url = $('input[name="url"]').val()
              , name = $('input[name="sitename"]').val()
              , tagID = $('input[name="fixedElemID"]').val();
              
            if (url !== '') {
               if (name == '') { name = url }
               $.ajax({
                 type: 'POST',
                 url: document.URL,
                 data: 'action=addSite&url='+url+'&name='+name+'&tagID='+tagID+'&code='+code
               }).done(function(newsite) {
                  $('ul.thumbnails > li:last-child').before(
                     '<li class="span3">' +
                       '<a href="sites/'+newsite.code+'" class="thumbnail">' +
                           '<img src="http://'+window.location.host+'/'+'resources/thumbnails/'+newsite.thumbnail+'" alt="'+ newsite.url+' thumbnail">' +
                       '</a>' +
                     '</li>'
                  );
                  $('#addSiteModal').modal('hide')
               });
            } else {
               $('div#url').addClass('error');
            }
         });     
       
         $('input[name="url"]').focus(function(){
            $('div#url').removeClass('error');
         });     
      });
      
      $('a[href="#copyTrackingCode"]').click({
      /* copy:$('p#trackingCode').text(),
         afterCopy: function(){
            console.log("done!");
            $('p#trackingCode').before('<div class="alert alert-success"><a class="close" data-dismiss="alert">x</a><strong>Copied!</strong> Tracking code is in your buffer, ready to be inserted in your page</div>');
         } */
      });
   }
   
   // On filters   
   if(path1 == 'sites' && path2 != null && path3 == null) {
      console.log('On filters');
      var filters, site;
      
      // get user's site
      $.ajax({
         type: "POST",
         url: document.URL,
         data: {action:"getSite"}
      }).done(function(data) {
         site = data;
      });
      
      // get user's site filters
      $.ajax({
         type: "POST",
         url: document.URL,
         data: {action:"getFilters"}
      }).done(function(data) {
         filters = data;
         console.log(filters);
         // adding filters to the view
         filters.forEach(function(filter, index, array){
            $('ul.thumbnails > li:last-child').before(
               '<li class="span3">' +
                 '<a href="#editFilter" class="btn hidden" data-toggle="modal" data-id="'+ filter.id +'">'+
                     '<i class="icon-pencil"></i> Edit'+
                 '</a>'+
                 '<a href="'+document.location.pathname+'/'+filter.id+'" class="thumbnail">' +
                     '<img src="http://'+window.location.host+'/'+'resources/thumbnails/'+filter.thumbName+'" alt="'+ filter.name+' thumbnail">' +
                 '</a>' +
                 '<p>'+filter.name+'</p>'+
               '</li>'
            );
         });
         
         // initializing edit buttons  
         $('.span3').mouseover(function(){
            $(this).children('a[href="#editFilter"]').removeClass('hidden');
         }).mouseout(function() {
            $(this).children('a[href="#editFilter"]').addClass('hidden');
         });
         
         // initializing editFilterModal
         $('a[href="#editFilter"]').click(function(){
            var $thisFilterSpan = $(this).parent()
              , filter = {};
            findObjInArr(filters, "id", $(this).data('id'), function(foundObj){
               filter = foundObj;
            });
            console.log(filter);
            $('#editFilterModal input[name="name"]').val(filter.name);
            $('#editFilterModal input[name="description"]').val(filter.description);
            $('#editFilterModal input[name="pathname"]').val(filter.pathname);
            
            $("#editFilterModal").on('show', function(){
               $('#loadingProgress').addClass('hide');
               $('#loadingProgress').removeClass('btn-danger');
               $('#loadingProgress').html('<img src="/img/16px_loading.gif">');
               
               $('a[href="#submitFilter"]').on('click', function(){
                  var params = {action:"editFilter", id:filter.id}
                  $('#editFilterModal input').each(function() {
                      params[this.name] = $(this).val();
                  });
                  console.log(params)
                  $.ajax({
                    type: 'POST',
                    url: document.location.pathname,
                    data: params
                  }).done(function(response) {
                     console.log(response);
                     $('#editFilterModal').modal('hide')  
                  });
               });
               $('a[href="#deleteFilter"]').on('click', function(){
                  $.ajax({
                     type: "POST",
                     url: document.URL,
                     data: "action=deleteFilter&id="+filter.id
                  }).done(function(response){
                     console.log(response);
                     if(response == "filter_deleted"){
                        $("#editFilterModal").modal('hide');
                        $thisFilterSpan.fadeOut();
                     }
                  })
               });
               $('a[href="#updateThumb"]').on('click', function(){
                  // disable link after pressing it
                  $('a[href="#updateThumb"]').off('click');
                  
                  $.ajax({
                    type: 'POST',
                    url: document.location.pathname,
                    data: {action:"updateThumb", id:filter.id, url:site.url+filter.pathname}
                  }).done(function(response) {
                     console.log(response);
                  });
               });
               $('a[href="#updateShots"]').on('click', function(){
                  // disable link after pressing it
                  $('a[href="#updateThumb"]').off('click');
                  $('#loadingProgress').removeClass('hide');
                  
                  $.ajax({
                    type: 'POST',
                    url: document.location.pathname,
                    data: {action:"updateShots", id:filter.id, url:site.url+filter.pathname}
                  }).done(function(response) {
                     console.log(response);
                     if (response == "done"){
                        $('#loadingProgress').addClass('hide');
                     }
                  }).error(function(response){
                     $('#loadingProgress').addClass('btn-danger');
                     $('#loadingProgress').html("error");
                  });
               });
            }).on('hide', function(){
               $('a[href="#submitFilter"]').off('click');
               $('a[href="#deleteFilter"]').off('click');
               $('a[href="#updateThumb"]').off('click');
               $('a[href="#updateShot"]').off('click');
               $('#editFilterModal').off('show').off('hide');
            });
            $("#editFilterModal").modal();
         });
      });
      
      
      
      // adding a new filter modal window   
      $('#addFilterModal').on('show', function(){
         var Site = {};
         $('input[name="pathname"]').val('');
         $('input[name="name"]').val('');
         
         // getting site's pathnames
         $.ajax({
           type: "POST",
           url: document.URL,
           data: "action=getSite"
         }).done(function(site) {
            Site = site;
            var Paths = [];
            for(x in site.paths){
               Paths[x] = site.paths[x] || '';
            }
            
            $('input[name="pathname"]').typeahead({
               source: Paths,
            })
         });
         
         $('a[href="#addParam"]').click(function() {
            $('a.icon-plus').before(
               '<div class="control-group">'+
                  '<input type="text" name="" placeholder="" class="span4">'+
               '</div>'
            );
         });
         
         $('a[href="#addFilter"]').on('click',function(){
            // collecting data from all input fields
            var params = {action:"addFilter", site: Site}
            $('#addFilterModal input').each(function() {
                params[this.name] = $(this).val();
            });
              
            if (params.pathname !== '') {  
               console.log(params)
               $.ajax({
                 type: 'POST',
                 url: document.location.pathname,
                 data: params
               }).done(function(newfilter) {
                  location.reload(true);
        /*          $('ul.thumbnails > li:last-child').before(
                     '<li class="span3">' +
                       '<a href="#editFilter" class="btn hidden" data-toggle="modal" data-id="'+ newfilter.id +'">'+
                       '<a href="'+document.location.pathname+'/'+newfilter.id+'" class="thumbnail">' +
                           '<img src="http://'+window.location.host+'/'+'resources/thumbnails/'+newfilter.thumbnail+'" alt="'+ newfilter.name+' thumbnail">' +
                       '</a>' +
                       '<p>'+newfilter.name+'</p>'+
                     '</li>'
                  );
                  
                  $('#addFilterModal').modal('hide')  */
               });
            }
            else {
               $('div#pathname').addClass('error');
            }
         });     
         
         $('input[name="pathname"]').focus(function(){
            $('div#pathname').removeClass('error');
         });     
         
      }).on('hide', function(){
         $('a[href="#addFilter"]').off();
         $('a[href="#addParam"]').off();
      });
      
   }
   
   // On heatmap view
   if(path3 != null){
      console.log('on filter view');
      var map, filter, screenshotNumber=0;
   
      $.ajax({
         type: "POST",
         url: document.URL,
         data: "action=getFilter"
      }).done(function(filter_res) {
         filter = filter_res;
         console.log(filter);
         screenshotNumber = filter.oldShots.length-1;
         $('#screenshotCounter').html((screenshotNumber+1) + '/' + filter.oldShots.length);
         $('#heatmap-container').append(
            '<img src="' + window.location.origin + window.location.pathname + '/map" alt="heatmap" id="heatmap">' +
            '<img src="http://'+window.location.host+'/'+'resources/screenshots/'+filter.shotName+'" alt="pageshot" id="pageshot">'
         );
         map = $('#heatmap, #pageshot, #heatmap-container');
      });
      
      // Toolbox buttons actions
      $('a[href="#zoom-in"]').click(function() {
         map.css('width', (parseFloat(map.css('width')) + 50) + 'px');
      });
      $('a[href="#zoom-out"]').click(function() {
         map.css('width', (parseFloat(map.css('width')) - 50) + 'px');
      });
      $('a[href="#zoom-reset"]').click(function() {
         map.css('width', '1280');
      });
      
      $('a[href="#toggle-heatmap"]').click(function() {
         $('a[href="#toggle-heatmap"]').button('toggle');
         $('#heatmap').fadeToggle(250, function(){
            $('a[href="#toggle-heatmap"]').button('toggle');
         });
      })
      
      $('a[href="#next_shot"]').click(function() {
         if(screenshotNumber<filter.oldShots.length-1){
            screenshotNumber++;
            $('#screenshotCounter').html((screenshotNumber+1) + '/' + filter.oldShots.length);
         }
         $('img#pageshot').attr('src','http://'+window.location.host+'/'+'resources/screenshots/'+filter.oldShots[screenshotNumber]);
      });
      $('a[href="#prev_shot"]').click(function() {
         if(screenshotNumber>=1){
            screenshotNumber--;
            $('#screenshotCounter').html((screenshotNumber+1) + '/' + filter.oldShots.length);
         }
         $('img#pageshot').attr('src','http://'+window.location.host+'/'+'resources/screenshots/'+filter.oldShots[screenshotNumber]);
      });
      $('a[href="#curr_shot"]').click(function() {
         screenshotNumber = filter.oldShots.length-1;
         $('#screenshotCounter').html((screenshotNumber+1) + '/' + filter.oldShots.length);
         $('img#pageshot').attr('src','http://'+window.location.host+'/'+'resources/screenshots/'+filter.oldShots[screenshotNumber]);
      });
      
      // FadeIn the heat map when it is ready
      $('#heatmap').ready(function(){
         $('#heatmap').fadeIn(1500);
      });
      
   } 
   


} catch(err) {}



function findObjInArr(array, property, val, callback){
   array.forEach(function(obj, index, array){
      if (obj[property] === val){
         callback(obj);
      }
   })
}
