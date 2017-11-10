# Obike
Obike ist Anbieter eines stationslosen Fahrradleihsystems. Mit dem Scraper lässt sich feststellen, wieviele Fahrräder in einer von Obike bedienten Stadt vorhanden sind und wo diese zum Zeitpunkt der Ausführung stehen. Eine rudimentäre Dokumentation der API findest sich [hier](https://github.com/ubahnverleih/WoBike)

### Verwendung
1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. `node scape.js` oder `node analyse.js`  ausführen

### Scraper
Der Scraper `scrape.js` liegt unter `/var/www/app/obike-scraper` auf dem BR-Data-Server und wird von einem Jenkins Job ausgeführt. Aktuelle

Für jedes Fahrrad wird ein Document in der Collection `bikes` gespeichert, die nach der Stadt benannt ist. Beispiel: 

```
{
  "_id" : ObjectId("5a05d7b4e824a8387cc1c07e"),
  "id" : "049000613",
  "longitude" : 11.59628,
  "latitude" : 48.025925,
  "imei" : "7469376F6E53696D",
  "iconUrl" : null,
  "promotionActivityType" : null,
  "rideMinutes" : null,
  "countryId" : 60,
  "helmet" : 0,
  "date" : "2017-10-10",
  "hour" : 17,
  "city" : "muenchen"
}
```
