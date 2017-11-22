const request = require('request');
const mongoClient = require('mongodb').MongoClient;

const baseUrl = 'https://mobile.o.bike/api/v1/bike/list?';
const mongoUrl = 'mongodb://localhost:27017/obike';
const collectionName = 'bikes';

// Add city (e.g. 'berlin') here
const cities = ['muenchen', 'frankfurt', 'berlin'];

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
  },
  hannover: {
    lat0: 52.262484,
    lon0: 9.542656,
    lat1: 52.467514,
    lon1: 9.926491
  }
};

const date = new Date();

(function init() {

  connect(prepare);
})();

function connect(callback) {

  mongoClient.connect(mongoUrl, (error, db) => {

    if (!error) {

      console.log(`Connected to database: ${mongoUrl}`);
      callback(db);
    } else {

      console.error(`${error.name}: ${error.message}`);

      db.close();
      console.log('Disconnected from database');
    }
  });
}

function prepare(db, locations = []) {

  cities.forEach(city => {

    const boundary = boundaries[city];

    // For transformation of 1km to degree see: https://stackoverflow.com/a/1253545/2037629
    for (let lat = boundary.lat0; lat <= boundary.lat1; lat = lat + (1 / 110.574) * 0.9) {

      for (let lon = boundary.lon0; lon <= boundary.lon1; lon = lon + (1 / (111.320 * Math.cos(lat * (Math.PI / 180)))) * 0.9) {

        locations.push({
          city,
          url: `${baseUrl}latitude=${lat}&longitude=${lon}`
        });
      }
    }
  });

  console.log(`Processing ${locations.length} locations`);
  iterate(db, locations);
}

function iterate(db, locations) {

  if (locations.length) {

    setTimeout(() => {

      const location = locations.pop();

      scrape(db, location, locations.length);
      iterate(db, locations);
    }, 200);
  }
}

function scrape(db, location, index) {

  request(location.url, {jar: true}, (error, response, body) => {

    if (response && response.statusCode === 200) {

      console.log(`Request ${index} (${location.city}): ${location.url}`);
      body = JSON.parse(body).data.list;

    } else if (response) {

      console.error(`Request ${location.url} failed: Status ${response.statusCode}`);
    } else {

      console.error(`Request ${location.url} failed: Error ${error}`);
    }

    save(db, body, location.city, index);
  });
}

function save(db, bikes, city, index) {

  const collection = db.collection(collectionName);
  const bulk = collection.initializeUnorderedBulkOp();

  if (bikes && bikes.length > 0) {

    bikes.forEach(bike => {

      bike.date = date;
      bike.city = city;

      bulk
        .find({
          id: bike.id,
          date: bike.date
        })
        .upsert()
        .updateOne(bike);
    });

    bulk.execute(error => {

      if (index === 0) {

        db.close();
        console.log('Disconnected from database');
      }

      if (error) {

        console.error(`${error.name}: ${error.message}`);
      }
    });
  } else if (index === 0) {

    db.close();
    console.log('Disconnected from database');
  }
}
