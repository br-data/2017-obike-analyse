var request = require('request'),
  mongoClient = require('mongodb').MongoClient;

var baseUrl = 'https://mobile.o.bike/api/v1/bike/list?',
  mongoUrl = 'mongodb://localhost:27017/obike',
  collectionName = 'bikes',
  // Add city (e.g. 'berlin') here
  cities = ['muenchen', 'frankfurt'];


(function init() {

  var datetime = new Date(),
    date = datetime.getFullYear() + '-' + datetime.getMonth() + '-' + datetime.getDate(),
    hour = datetime.getHours(),
    minute = datetime.getMinutes(),
    city;

  // TODO: divide maths and db-connect
  mongoClient.connect(mongoUrl, function(error, db) {

    if (!error) {

      console.log('Connected to database');

      var lat0, lon0, lat1, lon1;

      // count requests
      var i = 1;

      // // count bikes (with overlappings)
        // var j = 0;

      for (var z = 0; z < cities.length; z++) {

        city = cities[z];

        if (city === 'frankfurt') {

          lat0 = 49.984826;
          lon0 = 8.413478;
          lat1 = 50.239489;
          lon1 = 8.856560;
        } else if (city === 'berlin') {

          lat0 = 52.380591;
          lon0 = 13.010205;
          lat1 = 52.678389;
          lon1 = 13.793848;
        } else
        // if (city === 'muenchen')
        {

          lat0 = 48.016406;
          lon0 = 11.312153;
          lat1 = 48.256832;
          lon1 = 11.800645;
        }

        for (var lat = lat0; lat <= lat1; lat = lat + (1 / 110.574) * 0.9) {
          // for transformation of 1km to degree see https://stackoverflow.com/questions/1253499/simple-calculations-for-working-with-lat-lon-km-distance
          for (var lon = lon0; lon <= lon1; lon = lon + (1 / (111.320 * Math.cos(lat * (Math.PI / 180)))) * 0.9) {

            var url = baseUrl + 'latitude=' + lat + '&longitude=' + lon;
            console.log(city + ': ' + i + ': ' + url);

            setTimeout(req, i * 120, url, city);
            i++;
          }
        }
      }
    } else {

      console.log(error);
    }


    function req(url, city) {

      request(url, {jar:true}, scrape);

      function scrape(error, response, body) {

        --i;

        if (response.statusCode === 200) {

          var bikes = JSON.parse(body).data.list;
          // j = j + bikes.length;

          save(bikes, db, city);
        } else {

          console.log('Request ' + url + ' failed: Status ' + response.statusCode);
          save([ { id: url + '/' + 'minute=' + minute, error: 'http'} ], db, city);

          if (i === 1) {

            console.log('Close database');
            db.close();
          }
        }
      }
    }

    function save(data, db, city) {

      var collection = db.collection(collectionName);

      data.forEach(function (element) {

        element['date'] = date;
        element['hour'] = hour;
        element['minute'] = minute;
        element['city'] = city;

        // TODO: bulkOperation und close database in callback
        collection.update(
          {
            id: element.id,
            date: date,
            hour: hour,
            city: city
          },
          element,
          { upsert: true, multi: false },
          function (error) {

            if (error) {

              console.log(error);
            }

            // --j;
            // console.log(i + '-' + j);

            // if (i === 1 && j === 0) {

            //   console.log('Close database');
            //   db.close();
            // }
          }
        );
      });

      // console.log(i);
      if (i === 1) {

        console.log('Close database');
        db.close();
      }
    }
  });
})();

