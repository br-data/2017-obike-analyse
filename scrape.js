const request = require('request');
const mongoClient = require('mongodb').MongoClient;

const mongoUrl = 'mongodb://localhost:27017/obike';
const collectionName = 'bikes';

// O-Bike location API endpoint
const baseUrl = 'https://mobile.o.bike/api/v1/bike/list?';

// Cities that should be scraped
const cities = ['muenchen', 'frankfurt', 'berlin', 'hannover'];

// Bounding boxes for the cities. Convenient helper for
// creating bounding boxes: http://boundingbox.klokantech.com/
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

// Timestamp for each scraping run
const timestamp = new Date();

(function init() {

  connect(prepare);
})();

// Establish database connection
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

// Create URLs from bounding boxes
function prepare(db, locations = []) {

  cities.forEach(city => {

    // Get bounding box
    const boundary = boundaries[city];

    // Build a 1 by 1 km grid for scraping the location API
    // km to degree conversion details here: https://stackoverflow.com/a/1253545/2037629
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

// Iterate recursively to allow for timeouts
function iterate(db, locations) {

  if (locations.length) {

    // 150ms timeout
    setTimeout(() => {

      const location = locations.pop();

      scrape(db, location, locations.length);
      iterate(db, locations);
    }, 150);
  }
}

// Request and handle data from API endpoint
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

    // Try to save data, no matter if data was collected or not
    save(db, body, location.city, index);
  });
}

// Save results to MongoDB
function save(db, bikes, city, index) {

  // Create bulk operation
  const collection = db.collection(collectionName);
  const bulk = collection.initializeUnorderedBulkOp();

  // Handle empty responses
  if (bikes && bikes.length > 0) {

    bikes.forEach(bike => {

      bike.city = city;
      bike.timestamp = timestamp;

      // @todo Remove (wrong) legacy date timestamp
      bike.date = timestamp.getFullYear() + '-' + timestamp.getMonth() + '-' + timestamp.getDate();
      bike.hour = timestamp.getHours();
      bike.minute = timestamp.getMinutes();

      // Upsert data in bulk
      bulk
        .find({
          id: bike.id,
          date: bike.date
        })
        .upsert()
        .updateOne(bike);
    });

    bulk.execute(error => {

      // Close database connection when done
      if (index === 0) {

        db.close();
        console.log('Disconnected from database');
      }

      if (error) {

        console.error(`${error.name}: ${error.message}`);
      }
    });
  // Close database connection when done
  } else if (index === 0) {

    db.close();
    console.log('Disconnected from database');
  }
}
