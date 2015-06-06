var request = require('request');
var geojson = require('geojson');
var geocoder = require('geocoder');
var fs = require('fs');

request({
  url: 'http://www.walkabout.sg/ajax/company-all',
  json: true
}, function(err, resp, body){
  var promises = [];
  for (var key in body){
    var val = body[key];
    var p = new Promise(function(resolve, reject){
      if (val.long < 90){ // Invalid longitude!!!
        geocoder.geocode(val.address, function(e, d){
          console.log('Geocoding', val.address);
          if (e){
            console.log('FAIL', e);
            resolve(val);
          };
          var location = d.results[0].geometry.location;
          console.log('Result', location.lat, location.lng);
          val.lat = location.lat;
          val.lng = location.lng;
          resolve(val);
        });
      } else {
        resolve(val);
      }
    });
    promises.push(p);
  }

  Promise.all(promises).then(function(points){
    var data = geojson.parse(points.map(function(point){
      return {
        name: point.companyName,
        description: point.description,
        website: point.websiteURL,
        lat: point.lat,
        lng: point.long
      }
    }), { Point: ['lat', 'lng'] });
    fs.writeFile('sg-companies.geojson', JSON.stringify(data), function(){
      console.log('sg-companies.geojson generated!');
    });
  });
});
