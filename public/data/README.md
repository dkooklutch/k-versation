# Globe geography sources

- `countries-110m.json` is the `world-atlas` redistribution of Natural Earth 1:110m Admin-0 country boundaries. Natural Earth data is public domain.
- `lib/country-centroids.json` contains ISO country latitude/longitude reference points derived from the open `mledoze/countries` dataset. These points are used only to place verified analytics markers; they do not create analytics data.

The globe highlights a country only when that country exists in the production `analytics_events` table.
