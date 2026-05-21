"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { weatherAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Thermometer, Droplets, Wind, Eye, Gauge, Search, MapPin, AlertTriangle, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WeatherPage() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const language = user?.profile?.preferred_language || "en";

  useEffect(() => {
    const defaultCity = user?.profile?.district || user?.profile?.state || "Delhi";
    setCity(defaultCity);
    fetchWeather(defaultCity);
  }, [user]);

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    try {
      const res = await weatherAPI.getWeather({ city: cityName, language });
      setWeather(res.data);
    } catch {
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchCity.trim()) {
      setCity(searchCity.trim());
      fetchWeather(searchCity.trim());
    }
  };

  const getLocationWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        setLoading(true);
        try {
          const res = await weatherAPI.getWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude, language });
          setWeather(res.data);
        } catch { } finally { setLoading(false); }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">🌤️ Weather Intelligence</h1>
        <p className="text-slate-500 dark:text-slate-400">Live weather data with AI-powered farming recommendations</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-8">
        <Input
          placeholder="Search city or district..."
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          leftIcon={<Search className="w-4 h-4" />}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} size="md">Search</Button>
        <Button onClick={getLocationWeather} variant="outline" leftIcon={<MapPin className="w-4 h-4" />} size="md">
          My Location
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : weather ? (
        <div className="space-y-6">
          {/* Current Weather Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-sky-200" />
                    <span className="text-sky-200 font-medium">{weather.location}</span>
                  </div>
                  <div className="text-8xl font-black">{weather.current.temperature}°</div>
                  <p className="text-sky-200 text-xl mt-1">{weather.current.description}</p>
                  <p className="text-sky-300 text-sm mt-1">Feels like {weather.current.feels_like}°C</p>
                </div>
                <div className="text-8xl">{weather.current.icon}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
                {[
                  { icon: Droplets, label: "Humidity", value: `${weather.current.humidity}%` },
                  { icon: Wind, label: "Wind", value: `${weather.current.wind_speed} km/h` },
                  { icon: Eye, label: "Visibility", value: `${weather.current.visibility} km` },
                  { icon: Gauge, label: "Pressure", value: `${weather.current.pressure} hPa` },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="text-center">
                      <Icon className="w-5 h-5 mx-auto mb-1 text-sky-200" />
                      <p className="text-xs text-sky-200">{item.label}</p>
                      <p className="font-bold">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* 7-Day Forecast */}
          {weather.forecast?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">7-Day Forecast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weather.forecast.map((day: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "rounded-2xl p-4 text-center border transition-all",
                      i === 0
                        ? "bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/40"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700"
                    )}
                  >
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{i === 0 ? "Today" : day.day_name.slice(0, 3)}</p>
                    <div className="text-3xl mb-2">{day.icon}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-tight">{day.description}</p>
                    <div className="flex justify-center gap-2 text-xs font-bold">
                      <span className="text-red-500">{day.temp_max}°</span>
                      <span className="text-blue-500">{day.temp_min}°</span>
                    </div>
                    {day.rain_probability > 0 && (
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-blue-500 font-medium">{day.rain_probability}%</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Farming Alerts */}
          {weather.farming_alerts?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🌾 Farming Alerts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weather.farming_alerts.map((alert: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">{alert}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          {weather.ai_recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-950/30 dark:to-emerald-950/20 border border-primary-200 dark:border-primary-800/40 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Sprout className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-primary-900 dark:text-primary-300">AI Farming Recommendation</h3>
              </div>
              <p className="text-sm text-primary-800 dark:text-primary-200 leading-relaxed whitespace-pre-line">{weather.ai_recommendation}</p>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500">Unable to fetch weather data. Please try again.</p>
          <Button onClick={() => fetchWeather(city)} className="mt-4">Retry</Button>
        </div>
      )}
    </DashboardLayout>
  );
}
