# Solar almanac — method, accuracy and edge cases

Every trail page shows sun times, solar altitude and coordinates for a chosen
date, computed **on the device** from that trail's own latitude and longitude.
Nothing is fetched: the app ships no astronomy service call, no API key and no
runtime dependency for this. Once the app (or the PWA) is installed, the panel
works in airplane mode, at the trailhead, for any date.

Code: [`src/utils/solar.ts`](../src/utils/solar.ts),
[`src/utils/utm.ts`](../src/utils/utm.ts),
[`src/utils/timezone.ts`](../src/utils/timezone.ts).
UI: [`src/components/trails/SolarPanel.tsx`](../src/components/trails/SolarPanel.tsx).

## What is shown

| Field | Source |
| --- | --- |
| Astronomical dawn / dusk | Sun centre at −18° |
| Nautical dawn / dusk | Sun centre at −12° |
| Civil dawn / dusk | Sun centre at −6° |
| Sunrise / sunset | Upper limb at the horizon (−0.833°, minus horizon dip) |
| Solar noon | Transit of the local meridian |
| Daylight duration | Sunset − sunrise |
| Solar altitude | Maximum (at noon) and, for today, live altitude and azimuth |
| Latitude / longitude | The trail's own `coordinates`, in decimal degrees and DMS |
| Elevation | First point of the trail's `gpxTrack` when it carries `ele` |
| UTM | Zone, MGRS band, hemisphere, easting, northing (WGS-84) |
| Time zone | IANA zone for the province, plus its UTC offset |

Times are labelled with the zone abbreviation and offset (`ART (UTC−03:00)`)
so a reader never has to guess whether a number is local or UTC.

## Method

The engine implements the NOAA Solar Calculator equations, themselves a
condensation of Meeus, *Astronomical Algorithms* (ch. 12, 22, 25, 28):

1. The instant is reduced to a Julian century `T` from J2000.0.
2. Geometric mean longitude, mean anomaly and the equation of the centre give
   the Sun's apparent ecliptic longitude, corrected for nutation and
   aberration.
3. The obliquity of the ecliptic (with its nutation term) turns that into
   declination, and the same quantities give the equation of time.
4. Solar transit is `720 − 4·longitude − equationOfTime` minutes UTC, and each
   event is `transit ± 4·H`, with the hour angle from
   `cos H = (sin h − sin φ · sin δ) / (cos φ · cos δ)`.
5. Declination and equation of time are recomputed **at** each event instant
   and the event is solved again — one refinement pass, which matters around
   the equinoxes where declination moves fastest.

The day is anchored on 12:00 **local** time, so a local calendar day that
straddles midnight UTC (every Argentine day does) still gets its own events,
including a dusk that falls after 00:00 UTC.

## Accuracy

Within **±1 minute** for sunrise and sunset between ±72° of latitude, which
covers every trail here (southernmost ≈ −55°, Tierra del Fuego). Twilight
thresholds are crossed at a shallower angle and land within ~2 minutes; solar
noon is within seconds.

Measured against SunCalc — the library behind suncalc.org — the agreement is
much tighter than those bounds: across 7 Argentine locations × 5 dates spread
over the year, every sunrise, sunset, solar noon and twilight time matched
within **≤ 2 s**, and solar altitude within **0.01°**. Run it yourself:

```bash
node --experimental-strip-types scripts/validate-solar.mjs
```

The dominant error in the field is not the algorithm. It is refraction (below)
and, far larger, terrain: a ridge to the east easily delays the *visible*
sunrise by ten minutes or more. These times describe a flat, unobstructed
horizon, which is the same convention SunCalc, NOAA and printed almanacs use.

### One documented difference from SunCalc

SunCalc clamps altitude at 0 before applying its refraction formula, so every
altitude it reports **below** the horizon carries a constant +0.4842° that is
an artefact of the clamp rather than physics. This implementation uses NOAA's
piecewise refraction fit, which keeps shrinking as the Sun sinks, and also
exposes the unrefracted `altitudeGeometric`. The validation script subtracts
SunCalc's own refraction term so geometry is compared with geometry.

## Refraction assumptions

* **Sunrise / sunset**: geometric altitude **−0.833°** — the standard
  convention of 34′ mean atmospheric refraction at the horizon plus the Sun's
  16′ semidiameter, i.e. the moment the upper limb touches the horizon.
* **Elevation**: the visible horizon drops by the dip angle
  `0.0353° · √(metres)`, subtracted from the −0.833° when the trail data
  carries a trailhead elevation. At 4 370 m (Plaza de Mulas) that is ~2.3°,
  moving sunrise about 8 minutes earlier than the sea-level figure.
* **Twilight (−6°, −12°, −18°)**: by definition the altitude of the Sun's
  *centre*, with no refraction or semidiameter term, and therefore not
  adjusted for elevation either.
* Refraction varies with pressure and temperature; a cold, dense Patagonian
  morning can shift true sunrise ~30 s from the mean value. No almanac written
  for hikers models that, and neither does this one.

## Time zone

Argentina keeps a single offset, **UTC−03:00 (ART)**, and has had no daylight
saving since 2009 — but the country is still split across a dozen IANA zones
that differ only in their history. The zone is chosen from the trail's
province following tzdata's `zone1970.tab`
(`America/Argentina/Buenos_Aires`, `…/Ushuaia`, `…/Mendoza`, and so on; the one
Chilean trail in the data maps to `America/Punta_Arenas`, also UTC−03:00).

The offset is read from the JS engine's own tz database through `Intl`, which
needs no network. Where a React Native engine ships a cut-down ICU without tz
data, it falls back to the zone's standard offset from a small table — which,
for every zone used here, is the offset actually in force year-round.

## Edge cases

* **Event does not occur.** When `|cos H| > 1` the Sun never reaches that
  altitude. The direction is reported rather than collapsed to a blank:
  `always-above` (the Sun stays higher — midnight sun, or a night that never
  gets that dark) versus `always-below` (polar night). The UI turns each into a
  sentence: *"Amanecer astronómico: el sol no baja tanto."*
* **Tierra del Fuego in midsummer.** At −54.8° around the December solstice the
  Sun's lowest altitude is about **−11.8°**, so neither astronomical (−18°) nor
  nautical (−12°) twilight ever ends — the sky sits in nautical twilight all
  night. Both fields correctly report that they do not occur; sunrise and
  sunset still exist. This is the case the panel is most likely to hit in
  Argentina, and it is covered by the validation script.
* **Polar night and midnight sun.** Outside Argentina (the engine is
  coordinate-agnostic) the panel reports a 24 h or 0 h day and flags which,
  rather than printing a nonsensical duration. Daylight duration is `null`
  whenever sunrise or sunset is missing.
* **Date changes.** All values are derived from the selected local date, so
  stepping a day forward or back recomputes everything, including which events
  exist.
* **UTM.** Undefined beyond 84°N / 80°S, where UPS takes over — not a case any
  trail here reaches. The Norway and Svalbard zone exceptions are implemented
  for correctness.

## Validation

`scripts/validate-solar.mjs` checks, on every run:

* sunrise, solar noon, sunset and all three twilight pairs against SunCalc for
  7 Argentine locations (Jujuy to Tierra del Fuego) across 5 dates including
  both solstices and both equinoxes;
* the Ushuaia midsummer case, where both this implementation and SunCalc must
  agree that astronomical and nautical night do not exist;
* polar night and midnight sun at 78°N, including which of the two;
* solar altitude and azimuth against SunCalc at three times of day;
* UTM zone, hemisphere and band against reference points, plus the zone-31
  origin where easting must be exactly 500 000 m and northing 0.

SunCalc is a `devDependency` used only by that script. The shipped app has no
astronomy dependency.
