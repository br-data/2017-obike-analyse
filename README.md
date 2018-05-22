# oBike Analyse
oBike ist Anbieter eines stationslosen Fahrradleihsystems. Der Firma wurde öfters vorgeworfen die Städte mit zahlreichen Billig-Leihrädern zu überfluten. BR Data und BR Recherche haben nun ein Datenleck bei
oBike entdeckt. Persönliche Daten und Bewegungsdaten von Nutzern auf der ganzen Welt waren eine Zeit lang für jeden frei zugänglich.

- [Billig-Fahrräder aus Asien fluten München](https://www.br.de/nachrichten/oberbayern/inhalt/billig-fahrraeder-aus-china-fluten-muenchen-100.html)
- [BR deckt Datenleck beim Fahrradverleiher Obike auf](https://www.br.de/nachrichten/datenleck-obike-100.html)

## Scraper
Der Scraper erfasst, wie viele Fahrräder in einer von oBike bedienten Stadt vorhanden sind und wo diese stehen.

### Verwendung 
1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. `node scapeLocations.js` oder `python scrapeBikes.py` ausführen

### API
Um die Anzahl und Standorte der Fahrräder zu erfassen, gibt es zwei öffentliche, ungesicherte API-Endpunkte, welche von oBike „angeboten“ werden:

Location-API, welche alle Fahrräder in einem Umkreis von einem Kilometer zu einem bestimmt Standort zurückliefert. Die Schnittstelle erwartet Längen- und Breitengrad des Standorts als Parameter:

```
https://mobile.o.bike/api/v1/bike/list?latitude=48.143077&longitude=11.553544
```

Bike-API, welche Informationen und Standort für ein Fahrrad zurückliefert. Die Bike-ID setzt sich aus einem Länderprefix (049) und einer fünfstelligen Zahl (000000 bis circa 23000) zusammen:

```
https://mobile.o.bike/api/v1/bike/049008159
```

### Location Scraper
Node.js-basiertes Skript, welches für verschiedene Städte alle Standorte von oBikes sammelt. Dafür wird für jede Stadt ein Georaster mit ein Quadratkilometer großen Zellen aufgebaut. Für jede dieser Zellen wird eine Anfrage an die API gestellt und die zurückgelieferten Standorte und Daten der oBikes in einer MongoDB-Datenbank gespeichert. Ein [Upsert](https://docs.mongodb.com/manual/reference/method/Bulk.find.upsert/) stellt sicher, dass Fahrräder mit der gleichen `id` innerhalb eines Scraping-Durchlaufs nicht mehrfach gespeichert werden.

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

Neue Städte können im Konfigurationobjekt `boundaries` hinzugefügt werden. Dabei hilft das webbasierte [Bounding-Box-Tool von Klokan](http://boundingbox.klokantech.com/). Beispiel Frankfurt:  

```javascript
const boundaries = {
  frankfurt: {
    lat0: 49.984826,
    lon0: 8.4134782,
    lat1: 50.239489,
    lon1: 8.8565601
  }
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

Außerdem kann festgelegt werden für welche ID-Bereich nach Fahrrädern gesucht werden soll. Für Deutschland ist eine maximale ID von **23000** sinnvoll. Hier ein Beispiel für den maximalen ID-Bereich.

```python
for n in range(0, 99999):
```

Die API wird mit der Länderkennung `049` und der fortlaufenden Nummer `008159` angefragt:

```
$ curl https://mobile.o.bike/api/v1/bike/049008159

```

Die API liefert für das Fahrrad mit der ID `049008159` folgende Daten zurück: 

``` 
{
  "data": {
    "unitMinutes": 30,
    "hasStation": true,
    "price": 0.50,
    "latitude": 48.118604,
    "freeMinutes": 0,
    "overTime": 15,
    "currency": "€",
    "iconUrl": null,
    "rideMinutes": null,
    "promotionActivityType": null,
    "longitude": 11.609734
  },
  "success": true
}
```

## oBike-Karte
Wo stehen die meisten oBikes in München? Die Anwendung ermöglicht es mithilfe von [D3](https://d3js.org/) und [Canvas](https://developer.mozilla.org/de/docs/Web/HTML/Canvas) tausende Punkte performant auf eine Kartenebene (z.B. Open Street Map) zu zeichnen.

### Verwendung
1. Erforderliche Module installieren `npm install`
2. Website über Apache oder einen ähnlichen HTTP-Server ausliefern

Zum lokalen Entwicklen und Testen ist ein kleiner [HTTP-Server](https://github.com/indexzero/http-server) integriert. Diesen kann man mit dem Befehl `npm start` starten. Der Server läuft unter http://localhost:8080. Beim Starten des Entwicklungsservers sollte automatisch ein neues Browserfenster aufgehen.

### Animation
Das Zeichnen der einzelnen Punkte kann auch animiert werden:

```
var isAnimated = true;
```

### Verbesserungen
- mobiles Pinch-to-Zoom verbessern
- interaktiver Layer hinzufügen (z.b. Popups)

### Referenzen
- Mike Bostock: [Zoomable Map Tiles](http://bl.ocks.org/mbostock/4132797)
- Lars Verspohl: [D3 and Canvas in 3 steps](https://medium.freecodecamp.org/d3-and-canvas-in-3-steps-8505c8b27444)
- Irene Ros: [Working with D3 and Canvas](https://bocoup.com/blog/d3js-and-canvas)

