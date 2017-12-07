import random
import requests
import time
import json
import unicodecsv

outfile = open("./output/bike-data.csv", "wb")

final_file = unicodecsv.writer(outfile, encoding='utf-8')
final_file.writerow([
  'country',
  'id',
  'success',
  'nolatlon',
  'latitude',
  'longitude',
  'iconUrl',
  'unitMinutes',
  'rideMinutes',
  'hasStation',
  'currency',
  'price',
  'overTime',
  'freeMinutes',
  'promotionActivityType'
])

baseurl = "https://mobile.o.bike/api/v1/bike/"

countries = {
  "de" : "049",
  "nl" : "032",
  "ch" : "044"
}

country = "de"
country_id = countries[country]

for n in range(0, 40000):
  bikeno = str('{:d}'.format(n).zfill(6))
  bikeid = country_id+bikeno
  url = baseurl+bikeid
  req = requests.get(url)
  data = json.loads(req.text)
  if data["success"] == True:
    if str(data["data"]["latitude"]) == "0.0" and str(data["data"]["longitude"]) == "0.0":
      nolatlon = True
    else:
      nolatlon = False
    final_file.writerow([
      country,
      bikeid,
      data["success"],
      nolatlon,
      data["data"]["latitude"],
      data["data"]["longitude"],
      data["data"]["iconUrl"],
      data["data"]["unitMinutes"],
      data["data"]["rideMinutes"],
      data["data"]["hasStation"],
      data["data"]["currency"],
      data["data"]["price"],
      data["data"]["overTime"],
      data["data"]["freeMinutes"],
      data["data"]["promotionActivityType"]
    ])

  elif data["success"] == False:
    final_file.writerow(
      [country, bikeid, data['success']])

  print bikeid
  time.sleep(random.randint(1, 3))
