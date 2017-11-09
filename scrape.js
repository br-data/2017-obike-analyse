var request = require('request'),
  mongoClient = require('mongodb').MongoClient;

var baseUrl = 'https://mobile.o.bike/api/v1/bike/list?',
  mongoUrl = 'mongodb://localhost:27017/obike',
  collectionName = 'muenchen';


(function init() {

  mongoClient.connect(mongoUrl, function(error, db) {

    if (!error) {

      console.log('Connected to database');

      var lat0 = 48.016406,
        lon0 = 11.312153,
        lat1 = 48.256832,
        lon1 = 11.800645;

      var i = 1;

      for (var lat = lat0; lat <= lat1; lat = lat + (1 / 110.574)) {

        for (var lon = lon0; lon <= lon1; lon = lon + (1 / (111.320 * Math.cos(lat * (Math.PI / 180))))) {

          var url = baseUrl + 'latitude=' + lat + '&longitude=' + lon;

          console.log(i + ': ' + url);
          setTimeout(request, i * 100, url, {jar: true}, scrape);
          // request(url, {jar: true}, scrape);

          i++;
        }
      }

      // setTimeout(db.close, 1000);
      // db.close();
    } else {

      console.log(error);
    }


    function scrape(error, response, body) {

      if (response.statusCode === 200) {

        var bikes = JSON.parse(body).data.list;
        save(bikes, db);
      }

      else {

        console.log('Request failed');
      }
    }

    function save(data, db) {

      var collection = db.collection(collectionName);

      data.forEach(function (element) {

        // console.log(element);
        collection.update(
          { id: element.id },
          element,
          { upsert: true, multi: false }
        );
      });

      i = i - 1;
      console.log(i);
      if (i === 1) {
        console.log('Close database');
        db.close();
      }
    }
  });
})();

