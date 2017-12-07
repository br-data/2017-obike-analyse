# oBike
oBike ist Anbieter eines stationslosen Fahrradleihsystems. Der Firma wurde öfters vorgeworfen die Städte mit zahlreichen billigen Fahrrädern zu überfluten. Der Scraper erfasst, wie viele Fahrräder in einer von oBike bedienten Stadt vorhanden sind und wo diese stehen.

- [Billig-Fahrräder aus Asien fluten München](https://www.br.de/nachrichten/oberbayern/inhalt/billig-fahrraeder-aus-china-fluten-muenchen-100.html)
- [BR deckt Datenleck beim Fahrradverleiher Obike auf](https://www.br.de/nachrichten/datenleck-obike-100.html)

### Verwendung
1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. `node scapeLocations.js` oder `python scrapeBikes.py` ausführen

### API
Um die Anzahl und Standorte der Fahrräder zu erfassen, gibt es zwei öffentliche, ungesicherte API-Endpunkte, welche von oBike „angeboten“ werden:

Location-API, welche alle Fahrräder in einem Umkreis von einem Kilometer zu einem bestimmt Standort zurückliefert. Die Schnittstelle erwartet Längen- und Breitengrad des Standorts als Parameter:

```
https://mobile.o.bike/api/v1/bike/list?latitude=48.143077&longitude=11.553544.
```

Bike-API, welche Informationen und Standort für ein Fahrrad zurückliefert. Die Bike-ID setzt sich aus einem Länderprefix (049) und einer fünfstelligen Zahl (000000 bis circa 23000) zusammen:

```
https://mobile.o.bike/api/v1/bike/049000002
```

### Location Scraper
Node.js-basiertes Skript, welches für verschiedene Städte alle Standorte von oBikes sammelt. Dafür wird für jede Stadt ein Georaster mit ein Quadratkilometer großen Zellen aufgebaut. Für jede dieser Zellen wir eine Anfrage an die API gestellt und die zurückgelieferten Standorte und Daten der oBikes in einer MongoDB-Datenbank gespeichert. Ein [Upsert](https://docs.mongodb.com/manual/reference/method/Bulk.find.upsert/) stellt sicher, dass Fahrräder mit der gleichen `id` innerhalb eines Scraping-Durchlaufs nicht mehrfach gespeichert werden.

Ausführen: 

```
$ node scrapeLocations.js
```

Für jedes Fahrrad wird ein Dokument in der Kollektion `bikes` gespeichert. Beispiel: 

```javascript
{
  "_id" : ObjectId("5a15834a2b4203d1958bd9e1"),
  "id" : "049008750",
  "longitude" : 11.577437,
  "latitude" : 48.250024,
  "imei" : "686572616C48496E",
  "iconUrl" : null,
  "promotionActivityType" : null,
  "rideMinutes" : null,
  "countryId" : 60,
  "helmet" : 0,
  "city" : "muenchen",
  "date" : ISODate("2017-11-22T14:01:43.481Z"),
}
```

Um den Scraper regelmäßig, zum Beispiel stündlich, laufen zu lassen, empfiehlt sich der Einsatz eines Task Scheduler wie [cron](https://www.npmjs.com/package/node-cron) oder [Jenkins](https://jenkins-ci.org/).

### Bike Scraper
Python-basiertes Skript, welche Fahrräder von oBike mithilfe ihrer fortlaufenden ID erfassen kann. Die Daten werden in einer CSV-Datei `./output/bike-data.csv` gespeichert.

```
$ python scrapeBikes.js
```

Für welches Land nach Fahrrädern gesucht werden soll, kann im Skript festgelegt werden:

```python
countries = {
  "de" : "049",
  "nl" : "032",
  "ch" : "044"
}

country = "de"
country_id = countries[country]
```

Außerdem kann festgelegt werden für welche ID-Bereich nach Fahrrädern gesucht werden soll. Hier ein Beispiel für den maximalen ID-Bereich.

```python
for n in range(0, 99999):
```

Für Deutschland ist der maximale ID-Bereich **23000**.
