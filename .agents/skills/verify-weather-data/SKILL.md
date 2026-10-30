---
name: verify-weather-data
description: Checks live Icelandic weather and air quality answers against the clock and the real API before replying. Use when answering questions about current weather, wind, temperature or air quality in Iceland, especially with the vedurstofa MCP tools, api.vedur.is or api.ust.is.
---

# Verify weather data before answering

Live data can be wrong, stale or mislabelled, and tools don't always say so. Before you
answer a question about current weather or air quality in Iceland, follow these steps.
Iceland uses UTC all year (no summer time), so compare everything in UTC.

## 1. Find out what time it is now

Run one of these in the terminal and note the result:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```powershell
(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

## 2. Get the data

Use the vedurstofa MCP tools if they are available, otherwise the APIs below.

## 3. Check the time of the data

- An observation can never be from **after** the current time. If it is, it is a forecast
  or a mistake. Say so plainly, and do not call it an observation.
- If the newest observation is more than 1 hour old, say how old it is.

## 4. Check one value against the API directly

Fetch the same station from the source and compare temperature and wind:

- Weather (Veðurstofa): `https://api.vedur.is/weather/observations/aws/10min/latest?station_id=<id>`
  - Station ids: `https://api.vedur.is/weather/stations`. Reykjavík is `1470`.
  - The answer is always an array. `t` = temperature °C, `f` = wind m/s, `fg` = gusts m/s,
    `d_txt` = wind direction, `time` = observation time (UTC).
- Air quality (Loftgæði): `https://api.ust.is/aq/a/getCurrent/id/<station id>`
  - Values are strings, and the hours are keys `"0"`, `"1"`… where `"0"` is the newest.

Small differences can come from readings taken at different times (the API updates every
10 minutes). Say which reading each number comes from.

## 5. Answer

- Give each value with its unit, the station name, the observation time in UTC and the source.
- End with a short **Checks** line: what you compared, and whether it matched.
- If you noticed anything that doesn't add up, say it in the answer. Never notice a problem
  in your reasoning and leave it out of the reply.
- If a check could not be done (no terminal, API down), say that instead of skipping it.
- Never fill in a missing value with a guess.

## Example

> **Reykjavík (station 1470), observed 22:40 UTC (Veðurstofa):** 6.2 °C, wind 3.6 m/s from
> SSE, gusts 6.1 m/s.
>
> **Checks:** it is 22:45 UTC now. The vedurstofa tool reported this as "23:00", which is
> in the future, so that time is wrong; the API's own newest reading is from 22:40 and its
> values are used above.
