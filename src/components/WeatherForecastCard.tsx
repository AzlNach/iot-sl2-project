"use client";

import { ForecastDay } from "@/hooks/useWeatherForecast";

interface WeatherForecastCardProps {
  day: ForecastDay;
  index: number;
}

// Get weather icon emoji
const getWeatherEmoji = (main: string): string => {
  const emojiMap: { [key: string]: string } = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Smoke: "🌫️",
    Haze: "🌫️",
    Dust: "🌫️",
    Fog: "🌫️",
    Sand: "🌫️",
    Ash: "🌫️",
    Squall: "💨",
    Tornado: "🌪️",
  };
  return emojiMap[main] || "🌤️";
};

// Format day name
const formatDay = (timestamp: number, index: number): string => {
  if (index === 0) return "Hari Ini";
  if (index === 1) return "Besok";
  
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("id-ID", { weekday: "short" });
};

// Format date
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

export default function WeatherForecastCard({ day, index }: WeatherForecastCardProps) {
  const weather = day.weather[0];
  const rainChance = Math.round(day.pop * 100);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition transform hover:scale-105 border-2 border-gray-100">
      {/* Day & Date */}
      <div className="text-center mb-3">
        <div className="text-sm font-bold text-gray-800">
          {formatDay(day.dt, index)}
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(day.dt)}
        </div>
      </div>

      {/* Weather Icon */}
      <div className="text-center mb-3">
        <div className="text-5xl mb-2">
          {getWeatherEmoji(weather.main)}
        </div>
        <div className="text-xs text-gray-600 capitalize">
          {weather.description}
        </div>
      </div>

      {/* Temperature */}
      <div className="text-center mb-3">
        <div className="flex justify-center items-center space-x-2">
          <span className="text-2xl font-bold text-gray-800">
            {Math.round(day.temp.day)}°
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>↑ {Math.round(day.temp.max)}°</span>
          <span>↓ {Math.round(day.temp.min)}°</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-1 text-xs border-t pt-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">💧 Kelembapan</span>
          <span className="font-semibold text-gray-800">{day.humidity}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">🌧️ Hujan</span>
          <span className="font-semibold text-gray-800">{rainChance}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">💨 Angin</span>
          <span className="font-semibold text-gray-800">{Math.round(day.speed)} m/s</span>
        </div>
      </div>
    </div>
  );
}
