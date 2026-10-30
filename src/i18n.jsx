import { createContext, useContext, useEffect, useState } from 'react';

// All the page's text in English and Icelandic. Station names come from the APIs and
// are already Icelandic. Pollutant names in Icelandic follow loftgaedi.is. The health
// advice in English is quoted from the European Environment Agency's index page; the
// Icelandic is our own translation of it.

const TEXT = {
  en: {
    skip: 'Skip to content',
    tagline: 'Air quality and weather in Iceland, live.',
    summaryTitle: 'Right now at {count} air quality stations',
    updatedAgo: 'updated {minutes} min ago ({time} UTC)',
    updatedNow: 'updated just now ({time} UTC)',
    language: 'Language',
    darkMode: 'Dark mode',
    loading: 'Loading air quality and weather…',
    error: 'Error: {message}',
    station: 'Station',
    nearMe: 'Near me',
    nearMeLooking: 'Finding your location…',
    nearMeFound: 'Showing {name}, the nearest station, {km} km from you.',
    nearMeDenied: 'Location is turned off for this page, so the nearest station can’t be found.',
    nearMeFailed: 'Your location couldn’t be found.',
    mapTitle: 'Map of stations',
    windAnimation: 'Wind animation',
    mapHint:
      'Pick a station dot, or click anywhere for the nearest weather. Scroll to zoom. The streaks follow the wind measured right now at {count} weather stations.',
    legendTitle: 'Levels (European Air Quality Index)',
    legendNoIndex: 'No index: the station only measures gases the index doesn’t cover, like H₂S.',
    hourEnding: 'hour ending {time} UTC',
    airQuality: 'Air quality',
    whatItMeans: 'What it means',
    everyone: 'Everyone',
    sensitive: 'Sensitive groups',
    sensitiveNote: 'children, older people, and people with asthma or heart or lung conditions',
    adviceSource: 'Advice from the European Environment Agency.',
    noIndexAdvice:
      'This station only measures gases the European index doesn’t cover, so there is no general advice for it.',
    pollution: 'Pollution levels',
    noLevels: 'The European index has no levels for this one.',
    last24h: 'Last 24 hours',
    historyLoading: 'Loading the last 24 hours…',
    historyError: 'The last 24 hours couldn’t be loaded.',
    showTable: 'Show as a table',
    time: 'Time (UTC)',
    value: 'Value',
    chartSummary: '{label} over the last 24 hours: from {min} to {max} {unit}, now {now} {unit}.',
    weatherNearby: 'Weather nearby',
    kmAway: '{name}, {km} km away, at {time} UTC',
    temperature: 'Temperature',
    wind: 'Wind',
    notMeasured: 'Not measured',
    from: 'from {dir}',
    gusts: 'gusts {value} m/s',
    forecast: 'Forecast',
    forecastFor: 'For {name}, {km} km away. From Veðurstofa Íslands, issued {time} UTC.',
    forecastLoading: 'Loading the forecast…',
    forecastError: 'The forecast couldn’t be loaded.',
    weatherNearHere: 'Weather near here',
    farAway: '(far from where you clicked)',
    sources: 'Sources: {sources}. Levels: European Air Quality Index (EEA).',
    report: 'Read the report',
    reportAfter: 'on how AirCast Iceland was made.',
    levels: ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor', 'Extremely poor'],
    noIndex: 'No index',
    pollutants: {
      PM10: 'Dust (PM10)',
      'PM2.5': 'Fine dust (PM2.5)',
      PM1: 'Very fine dust (PM1)',
      NO2: 'Nitrogen dioxide (NO₂)',
      SO2: 'Sulphur dioxide (SO₂)',
      H2S: 'Hydrogen sulphide (H₂S)',
      O3: 'Ozone (O₃)',
      CO: 'Carbon monoxide (CO)',
    },
    // European Environment Agency, airindex.eea.europa.eu, quoted as written.
    advice: [
      ['The air quality is good. Enjoy your usual outdoor activities.', 'The air quality is good. Enjoy your usual outdoor activities.'],
      ['Enjoy your usual outdoor activities', 'Enjoy your usual outdoor activities'],
      ['Enjoy your usual outdoor activities', 'Consider reducing intense outdoor activities, if you experience symptoms.'],
      [
        'Consider reducing intense activities outdoors, if you experience symptoms such as sore eyes, a cough or sore throat',
        'Consider reducing physical activities, particularly outdoors, especially if you experience symptoms.',
      ],
      [
        'Consider reducing intense activities outdoors, if you experience symptoms such as sore eyes, a cough or sore throat',
        'Reduce physical activities, particularly outdoors, especially if you experience symptoms.',
      ],
      ['Reduce physical activities outdoors.', 'Avoid physical activities outdoors.'],
    ],
  },
  is: {
    skip: 'Fara beint í efnið',
    tagline: 'Loftgæði og veður á Íslandi, í rauntíma.',
    summaryTitle: 'Núna á {count} loftgæðastöðvum',
    updatedAgo: 'uppfært fyrir {minutes} mín. ({time} UTC)',
    updatedNow: 'uppfært rétt í þessu ({time} UTC)',
    language: 'Tungumál',
    darkMode: 'Dökkt útlit',
    loading: 'Sæki loftgæði og veður…',
    error: 'Villa: {message}',
    station: 'Stöð',
    nearMe: 'Næst mér',
    nearMeLooking: 'Finn staðsetningu þína…',
    nearMeFound: 'Sýni {name}, næstu stöð, {km} km frá þér.',
    nearMeDenied: 'Slökkt er á staðsetningu fyrir þessa síðu, svo ekki er hægt að finna næstu stöð.',
    nearMeFailed: 'Ekki tókst að finna staðsetningu þína.',
    mapTitle: 'Kort af stöðvum',
    windAnimation: 'Vindhreyfing',
    mapHint:
      'Veldu stöð á kortinu, eða smelltu hvar sem er til að sjá næsta veður. Skrunaðu til að þysja. Strikin fylgja vindinum eins og hann mælist núna á {count} veðurstöðvum.',
    legendTitle: 'Stig (evrópski loftgæðastuðullinn)',
    legendNoIndex: 'Enginn stuðull: stöðin mælir aðeins lofttegundir sem stuðullinn nær ekki yfir, eins og H₂S.',
    hourEnding: 'klukkustund sem lauk {time} UTC',
    airQuality: 'Loftgæði',
    whatItMeans: 'Hvað þýðir þetta',
    everyone: 'Allir',
    sensitive: 'Viðkvæmir hópar',
    sensitiveNote: 'börn, eldra fólk og fólk með astma eða hjarta- eða lungnasjúkdóma',
    adviceSource: 'Ráðleggingar Umhverfisstofnunar Evrópu (EEA), í okkar þýðingu.',
    noIndexAdvice: 'Þessi stöð mælir aðeins lofttegundir sem evrópski stuðullinn nær ekki yfir, svo engin almenn ráðlegging á við.',
    pollution: 'Mengunarstig',
    noLevels: 'Evrópski stuðullinn hefur engin stig fyrir þetta efni.',
    last24h: 'Síðasta sólarhring',
    historyLoading: 'Sæki síðasta sólarhring…',
    historyError: 'Ekki tókst að sækja síðasta sólarhring.',
    showTable: 'Sýna sem töflu',
    time: 'Tími (UTC)',
    value: 'Gildi',
    chartSummary: '{label} síðasta sólarhring: frá {min} upp í {max} {unit}, núna {now} {unit}.',
    weatherNearby: 'Veður í grennd',
    kmAway: '{name}, {km} km í burtu, kl. {time} UTC',
    temperature: 'Hiti',
    wind: 'Vindur',
    notMeasured: 'Ekki mælt',
    from: 'úr {dir}',
    gusts: 'hviður {value} m/s',
    forecast: 'Spá',
    forecastFor: 'Fyrir {name}, {km} km í burtu. Frá Veðurstofu Íslands, gefin út {time} UTC.',
    forecastLoading: 'Sæki spá…',
    forecastError: 'Ekki tókst að sækja spána.',
    weatherNearHere: 'Veður hér nálægt',
    farAway: '(langt frá þar sem þú smelltir)',
    sources: 'Heimildir: {sources}. Stig: evrópski loftgæðastuðullinn (EEA).',
    report: 'Lestu skýrsluna',
    reportAfter: 'um hvernig AirCast Iceland varð til (á ensku).',
    levels: ['Góð', 'Sæmileg', 'Miðlungs', 'Slæm', 'Mjög slæm', 'Afar slæm'],
    noIndex: 'Enginn stuðull',
    pollutants: {
      PM10: 'Gróft svifryk (PM10)',
      'PM2.5': 'Fínt svifryk (PM2.5)',
      PM1: 'Örfínt svifryk (PM1)',
      NO2: 'Köfnunarefnisdíoxíð (NO₂)',
      SO2: 'Brennisteinsdíoxíð (SO₂)',
      H2S: 'Brennisteinsvetni (H₂S)',
      O3: 'Óson (O₃)',
      CO: 'Kolmónoxíð (CO)',
    },
    advice: [
      ['Loftgæðin eru góð. Njóttu útiverunnar eins og venjulega.', 'Loftgæðin eru góð. Njóttu útiverunnar eins og venjulega.'],
      ['Njóttu útiverunnar eins og venjulega.', 'Njóttu útiverunnar eins og venjulega.'],
      ['Njóttu útiverunnar eins og venjulega.', 'Íhugaðu að draga úr erfiðri hreyfingu úti ef þú finnur fyrir einkennum.'],
      [
        'Íhugaðu að draga úr erfiðri hreyfingu úti ef þú finnur fyrir einkennum eins og sviða í augum, hósta eða særindum í hálsi.',
        'Íhugaðu að draga úr hreyfingu, sérstaklega úti, einkum ef þú finnur fyrir einkennum.',
      ],
      [
        'Íhugaðu að draga úr erfiðri hreyfingu úti ef þú finnur fyrir einkennum eins og sviða í augum, hósta eða særindum í hálsi.',
        'Dragðu úr hreyfingu, sérstaklega úti, einkum ef þú finnur fyrir einkennum.',
      ],
      ['Dragðu úr hreyfingu úti.', 'Forðastu hreyfingu úti.'],
    ],
  },
};

const STORAGE_KEY = 'aircast-language';

function savedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'is') return saved;
  } catch {
    // Storage can be blocked; fall back to English.
  }
  return 'en';
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(savedLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Not saving the choice is fine.
    }
  }, [lang]);

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

// t('key', { name: 'x' }) fills {name} in the text. Also gives level and pollutant names,
// numbers in the language's format, and compass directions.
export function useText() {
  const { lang, setLang } = useContext(LanguageContext);
  const text = TEXT[lang];

  const t = (key, vars = {}) => text[key].replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
  const levelName = (level) => (level ? text.levels[level.index] : text.noIndex);
  const pollutantName = (code) => text.pollutants[code] ?? code;
  const advice = (level) => (level ? text.advice[level.index] : null);
  // Icelandic writes 1.234,5 where English writes 1,234.5. Some browsers have no Icelandic
  // number format and quietly fall back to English, so the swap is done by hand.
  const number = (value) => {
    const english = value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
    return lang === 'is' ? english.replace(/[.,]/g, (c) => (c === '.' ? ',' : '.')) : english;
  };
  // Icelandic compass letters: austur (A) for east, vestur (V) for west.
  const direction = (dir) => (lang === 'is' && dir ? dir.replace(/E/g, 'A').replace(/W/g, 'V') : dir);

  return { lang, setLang, t, levelName, pollutantName, advice, number, direction, levels: text.levels };
}
