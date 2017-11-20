const request = require('request');
const mongoClient = require('mongodb').MongoClient;

const baseUrl = 'https://mobile.o.bike/api/v1/bike/list?',
const mongoUrl = 'mongodb://localhost:27017/obike';
const collectionName = 'bikes';

// Add city (e.g. 'berlin') here
const cities = ['muenchen', 'frankfurt'];

const boundaries = {
  frankfurt: {
    lat0: 49.984826,
    lon0: 8.4134782,
    lat1: 50.239489,
    lon1: 8.8565601
  },
  berlin: {
    lat0: 52.380591,
    lon0: 13.010205,
    lat1: 52.678389,
    lon1: 13.793848
  },
  muenchen: {
    lat0: 48.016406,
    lon0: 11.312153,
    lat1: 48.256832,
    lon1: 11.800645
  }
}

(function init() {

  const datetime = new Date();
  const date = `${datetime.getFullYear()}-${datetime.getMonth()}-${datetime.getDate()}`;
  const hour = datetime.getHours();
  const minute = datetime.getMinutes();

  connect(prepare);
})();

function connect(callback) {

  // TODO: divide maths and db-connect
  mongoClient.connect(mongoUrl, (error, db) => {

    if (!error) {

      console.log('Connected to database');
      callback();
    } else {

      console.error(error);
    }
  })
}

function prepare(db) {
  // count requests
  let i = 1;

  for (let city of cities) {

    let boundary = boundaries[city]

    // For transformation of 1km to degree see
    // https://stackoverflow.com/a/1253545/2037629
    for (let lat = boundary.lat0; lat <= boundary.lat1; lat = lat + (1 / 110.574) * 0.9) {

      for (let lon = boundary.lon0; lon <= boundary.lon1; lon = lon + (1 / (111.320 * Math.cos(lat * (Math.PI / 180)))) * 0.9) {

        const url = `${baseUrl}latitude=${lat}&longitude=${lon}`;

        console.log(`${city}: ${i}: ${url}`);

        setTimeout(req, i * 120, url, city);
        i++;
      }
    }
  }
}

function req(url, city) {

  request(url, {jar:true}, scrape);

  function scrape(error, response, body) {

    --i;

    db.collection('requests').insert({
      url,
      date,
      hour,
      minute,
      city,
      statusCode: response.statusCode
    });

    if (response && response.statusCode === 200) {

      const bikes = JSON.parse(body).data.list;
      // j = j + bikes.length;

      save(bikes, db, city);
    } else {

      console.log(`Request ${url} failed: Status ${response.statusCode}`);

      if (i === 1) {

        console.log('Close database');
        db.close();
      }
    }
  }
}

function save(data, db, city) {

  const collection = db.collection(collectionName);

  if (data === undefined) {

    data === [];
  }

  data.forEach(element => {

    element['date'] = date;
    element['hour'] = hour;
    element['minute'] = minute;
    element['city'] = city;

    // TODO: bulkOperation und close database in callback
    collection.update(
      {
        id: element.id,
        date,
        hour,
        city
      },
      element,
      { upsert: true, multi: false },
      error => {

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
