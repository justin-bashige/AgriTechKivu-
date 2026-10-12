import React from 'react';
import { CloudSun, Droplets, Wind, Thermometer, AlertCircle, RefreshCw, MapPin, CheckCircle2 } from 'lucide-react';
import { WeatherData } from '../types';
import { KIVU_TERRITORIES, TerritoryCoordinates } from '../services/weather';

interface WeatherViewProps {
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
  selectedTerritory: TerritoryCoordinates;
  onSelectTerritory: (territory: TerritoryCoordinates) => void;
  onRefresh: () => void;
}

export const WeatherView: React.FC<WeatherViewProps> = ({
  weatherData,
  loading,
  error,
  selectedTerritory,
  onSelectTerritory,
  onRefresh,
}) => {
  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-sky-600" />
            <span>Météo Agricole & Climat</span>
          </h1>
          <p className="text-xs text-stone-500">
            Prévisions Open-Meteo en direct pour les décisions de semis, sarclage et récolte
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Territory Selector */}
      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
          Sélectionner votre zone agricole / Territoire :
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {KIVU_TERRITORIES.map((territory) => (
            <button
              key={territory.name}
              onClick={() => onSelectTerritory(territory)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition flex items-center gap-1 ${
                selectedTerritory.name === territory.name
                  ? 'bg-[#15803d] text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <MapPin className="w-3 h-3 opacity-70" />
              <span>{territory.name}</span>
              <span className="text-[10px] opacity-80">({territory.province})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && !weatherData && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center animate-pulse space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-100 mx-auto flex items-center justify-center text-sky-600">
            <CloudSun className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs text-stone-500">
            Chargement des données météorologiques satellitaires...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Indisponibilité temporaire du service météo :</p>
              <p className="mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-lg bg-amber-700 text-white font-medium hover:bg-amber-800 transition"
          >
            Réessayer la connexion
          </button>
        </div>
      )}

      {/* Weather Data Display */}
      {weatherData && (
        <>
          {/* Current Weather Card */}
          <div className="bg-gradient-to-br from-sky-600 to-sky-800 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-200">
                  {weatherData.locationName} · Altitude {selectedTerritory.altitudeMeters}m
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {weatherData.current.temperature}°C
                  </span>
                  <div>
                    <span className="text-base sm:text-lg font-bold block">
                      {weatherData.current.weatherDescription}
                    </span>
                    <span className="text-xs text-sky-200">
                      Ressenti : {weatherData.current.apparentTemperature}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-xs text-center">
                <div>
                  <Droplets className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                  <span className="text-[10px] text-sky-200 uppercase block">Pluie</span>
                  <span className="text-xs font-bold">{weatherData.current.precipitation} mm</span>
                </div>
                <div>
                  <Thermometer className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                  <span className="text-[10px] text-sky-200 uppercase block">Humidité</span>
                  <span className="text-xs font-bold">{weatherData.current.relativeHumidity}%</span>
                </div>
                <div>
                  <Wind className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                  <span className="text-[10px] text-sky-200 uppercase block">Vent</span>
                  <span className="text-xs font-bold">{weatherData.current.windSpeed} km/h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Agronomic Advice (Real calculations from Open-Meteo) */}
          <div className="bg-[#f2f8f3] border border-[#d2ead6] rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
              <span>Conseils agronomiques contextualisés</span>
            </div>
            <ul className="space-y-2 text-xs text-stone-700">
              {weatherData.agriculturalAdvice.map((adv, i) => (
                <li key={i} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-800">·</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 7-Day Forecast */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Prévisions sur 7 jours
            </h2>
            <div className="space-y-2">
              {weatherData.daily.map((day, idx) => {
                const dateObj = new Date(day.date);
                const dayName = idx === 0 ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

                return (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 transition border border-stone-100 text-xs"
                  >
                    <span className="font-semibold text-stone-800 w-28 capitalize">
                      {dayName}
                    </span>
                    <span className="text-stone-500 flex-1 truncate px-2 text-center">
                      {day.weatherDescription}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sky-700 font-medium">
                        {day.precipitationSum} mm ({day.precipitationProbabilityMax}%)
                      </span>
                      <span className="font-bold text-stone-900">
                        {day.tempMin}° / {day.tempMax}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
