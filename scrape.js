var request = require('request'),
  mongoClient = require('mongodb').MongoClient;

var baseUrl = 'https://mobile.o.bike/api/v1/bike/list?',
  mongoUrl = 'mongodb://localhost:27017/obike',
  collectionName = 'muenchen';


(function init() {

  var datetime = new Date();
  var date = datetime.getFullYear() + '-' + datetime.getMonth() + '-' + datetime.getDate();
  var hour = datetime.getHours();

  mongoClient.connect(mongoUrl, function(error, db) {

    if (!error) {

      console.log('Connected to database');

      var lat0 = 48.016406,
        lon0 = 11.312153,
        lat1 = 48.256832,
        lon1 = 11.800645;

      var i = 1;
      // var j = 0;

      for (var lat = lat0; lat <= lat1; lat = lat + (1 / 110.574)) {

        for (var lon = lon0; lon <= lon1; lon = lon + (1 / (111.320 * Math.cos(lat * (Math.PI / 180))))) {

          var url = baseUrl + 'latitude=' + lat + '&longitude=' + lon;

          console.log(i + ': ' + url);
          setTimeout(request, i * 100, url, {jar: true}, scrape);

          i++;
        }
      }
    } else {

      console.log(error);
    }


    function scrape(error, response, body) {

      if (response.statusCode === 200) {

        var bikes = JSON.parse(body).data.list;
        // j = j + bikes.length;
        save(bikes, db);

      } else {

        console.log('Request failed');
      }
    }

    function save(data, db) {

      var collection = db.collection(collectionName);

      --i;

      data.forEach(function (element) {

        element['date'] = date;
        element['hour'] = hour;

        // console.log(element);
        collection.update(
          {
            id: element.id,
            date: date,
            hour: hour
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

