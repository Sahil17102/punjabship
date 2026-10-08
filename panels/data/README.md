# Global postal-code data

`global-postal-codes.json.gz` is generated from the GeoNames postal-code export and contains unique postal-code records for Canada, the United States, and the European countries enabled by PunjabShip.

Regenerate it with:

```powershell
node panels/scripts/generate-global-postal-data.mjs C:\path\to\allCountries.txt
```

GeoNames data is licensed under Creative Commons Attribution 4.0: https://www.geonames.org/export/
