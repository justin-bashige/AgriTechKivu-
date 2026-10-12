import { WeatherData } from '../types';

export interface TerritoryCoordinates {
  name: string;
  province: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
}

export const KIVU_TERRITORIES: TerritoryCoordinates[] = [
  { name: 'Bukavu', province: 'Sud-Kivu', latitude: -2.5085, longitude: 28.8608, altitudeMeters: 1490 },
  { name: 'Goma', province: 'Nord-Kivu', latitude: -1.6792, longitude: 29.2228, altitudeMeters: 1530 },
  { name: 'Kabare', province: 'Sud-Kivu', latitude: -2.4833, longitude: 28.7833, altitudeMeters: 1750 },
  { name: 'Walungu', province: 'Sud-Kivu', latitude: -2.6375, longitude: 28.6728, altitudeMeters: 1800 },
  { name: 'Uvira', province: 'Sud-Kivu', latitude: -3.3975, longitude: 29.1378, altitudeMeters: 780 },
  { name: 'Kalehe', province: 'Sud-Kivu', latitude: -2.0911, longitude: 28.8956, altitudeMeters: 1470 },
  { name: 'Idjwi', province: 'Sud-Kivu', latitude: -2.1583, longitude: 29.0667, altitudeMeters: 1500 },
  { name: 'Rutshuru', province: 'Nord-Kivu', latitude: -1.1833, longitude: 29.4500, altitudeMeters: 1250 },
  { name: 'Masisi', province: 'Nord-Kivu', latitude: -1.3986, longitude: 28.8108, altitudeMeters: 1600 },
  { name: 'Fizi', province: 'Sud-Kivu', latitude: -4.3017, longitude: 28.9453, altitudeMeters: 1100 },
];

// Traduction officielle des codes WMO Open-Meteo en français
export function decodeWmoWeather(code: number): string {
  switch (code) {
    case 0:
      return 'Ciel dégagé';
    case 1:
      return 'Principalement ensoleillé';
    case 2:
      return 'Partiellement nuageux';
    case 3:
      return 'Nuageux';
    case 45:
    case 48:
      return 'Brouillard matinal';
    case 51:
    case 53:
    case 55:
      return 'Bruine légère';
    case 61:
      return 'Pluie légère';
    case 63:
      return 'Pluie modérée';
    case 65:
      return 'Forte pluie';
    case 80:
    case 81:
    case 82:
      return 'Averses orageuses';
    case 95:
      return 'Orage';
    case 96:
    case 99:
      return 'Orage avec grêle';
    default:
      return 'Temps variable';
  }
}

// Générer des conseils agronomiques prudents basés sur les données réelles constatées
function generateContextualAdvice(
  currentPrecip: number,
  maxProbRain: number,
  humidity: number,
  tempMax: number,
  tempMin: number
): string[] {
  const advice: string[] = [];

  if (currentPrecip > 5 || maxProbRain > 70) {
    advice.push('Fortes pluies prévues : reportez les pulvérisations foliaires et vérifiez le drainage des parcelles en bas de pente pour éviter l\'asphyxie racinaire.');
    advice.push('Conditions propices au développement de maladies cryptogamiques (mildiou, cercosporiose). Inspectez les feuilles basses après l\'accalmie.');
  } else if (maxProbRain < 25 && currentPrecip === 0) {
    advice.push('Faible risque de pluie : créneau favorable pour le désherbage manuel, le sarclage et le séchage des grains au soleil.');
    if (tempMax > 27) {
      advice.push('Chaleur diurne élevée : privilégiez un paillage épais au pied des cultures maraîchères pour conserver l\'humidité du sol.');
    }
  } else {
    advice.push('Pluies modérées probables : maintien d\'une humidité adéquate pour la levée des semis de saison.');
  }

  if (humidity > 85 && tempMin > 16) {
    advice.push('Humidité relative élevée : aérez les parcelles maraîchères tuteurées (tomates, haricots grimpants) pour limiter la condensation.');
  }

  if (advice.length === 0) {
    advice.push('Surveillez l\'évolution quotidienne du ciel avant toute intervention de semis ou d\'épandage de fertilisants.');
  }

  return advice;
}

export async function fetchAgriculturalWeather(
  location: TerritoryCoordinates = KIVU_TERRITORIES[0]
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération météo (${res.status} ${res.statusText})`);
  }

  const data = await res.json();
  const current = data.current;
  const daily = data.daily;

  if (!current || !daily) {
    throw new Error('Données météorologiques incomplètes reçues.');
  }

  const dailyForecast = (daily.time || []).slice(0, 7).map((timeStr: string, idx: number) => {
    const code = daily.weather_code?.[idx] ?? 0;
    return {
      date: timeStr,
      tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 0),
      tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 0),
      precipitationSum: Number((daily.precipitation_sum?.[idx] ?? 0).toFixed(1)),
      precipitationProbabilityMax: daily.precipitation_probability_max?.[idx] ?? 0,
      weatherCode: code,
      weatherDescription: decodeWmoWeather(code),
    };
  });

  const maxProbRain = dailyForecast[0]?.precipitationProbabilityMax || 0;
  const tempMax = dailyForecast[0]?.tempMax || 25;
  const tempMin = dailyForecast[0]?.tempMin || 16;

  const agronomicAdvice = generateContextualAdvice(
    current.precipitation || 0,
    maxProbRain,
    current.relative_humidity_2m || 60,
    tempMax,
    tempMin
  );

  return {
    locationName: `${location.name} (${location.province})`,
    latitude: location.latitude,
    longitude: location.longitude,
    current: {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      relativeHumidity: Math.round(current.relative_humidity_2m),
      precipitation: Number((current.precipitation || 0).toFixed(1)),
      weatherCode: current.weather_code,
      weatherDescription: decodeWmoWeather(current.weather_code),
      windSpeed: Math.round(current.wind_speed_10m),
      time: current.time,
    },
    daily: dailyForecast,
    agriculturalAdvice: agronomicAdvice,
  };
}
