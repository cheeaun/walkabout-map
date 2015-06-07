var request = require('request');
var geojson = require('geojson');
var geocoder = require('geocoder');
var fs = require('fs');

request({
  url: 'http://www.walkabout.sg/ajax/company-all',
  json: true
}, function(err, resp, body){
  var promises = [];
  Object.keys(body).forEach(function(key){
    var val = body[key];
    var p = new Promise(function(resolve, reject){
      if (val.long < 90 || /(uber|gigs|apvera|bonappetour)/i.test(key)){ // Only for those with invalid coords
        if (/apvera/i.test(key)){
          val.address = '1 Marina Boulevard #22-01, One Marina Boulevard, Singapore 018989';
        }
        geocoder.geocode(val.address, function(e, d){
          console.log('Geocoding', key, val.address);
          if (e){
            console.log('FAIL', e);
            resolve(val);
          };
          var location = d.results[0].geometry.location;
          console.log('Result', location.lat, location.lng);
          val.lat = location.lat;
          val.long = location.lng;
          resolve(val);
        });
      } else {
        resolve(val);
      }
    });
    promises.push(p);
  });

  Promise.all(promises).then(function(points){
    var data = geojson.parse(points.map(function(point){
      return {
        name: point.companyName,
        website: point.websiteURL,
        address: point.address,
        lat: point.lat,
        lng: point.long
      }
    }), { Point: ['lat', 'lng'] });
    fs.writeFile('sg-companies.geojson', JSON.stringify(data), function(){
      console.log('sg-companies.geojson generated!');
    });
  });
});
