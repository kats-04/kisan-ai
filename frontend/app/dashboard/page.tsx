"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { weatherAPI, marketAPI } from "@/lib/api";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import {
  MessageSquare, CloudSun, Leaf, TrendingUp, Microscope,
  ShieldCheck, Calendar, ArrowRight, Thermometer, Droplets,
  Wind, AlertTriangle, TrendingDown, Minus
} from "lucide-react";

const quickActions = [
  { href: "/chat", label: "Ask AI Copilot", icon: MessageSquare, color: "from-primary-600 to-primary-500", desc: "Get instant farming advice" },
  { href: "/crops", label: "Crop Advisor", icon: Leaf, color: "from-emerald-600 to-teal-500", desc: "Best crops for your farm" },
  { href: "/disease", label: "Disease Detect", icon: Microscope, color: "from-orange-600 to-red-500", desc: "Upload crop photo" },
  { href: "/market", label: "Market Prices", icon: TrendingUp, color: "from-purple-600 to-violet-500", desc: "Live mandi rates" },
  { href: "/weather", label: "Weather", icon: CloudSun, color: "from-sky-600 to-blue-500", desc: "7-day forecast" },
  { href: "/schemes", label: "Gov Schemes", icon: ShieldCheck, color: "from-yellow-600 to-amber-500", desc: "Subsidies & benefits" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const city = user?.profile?.district || user?.profile?.state || "Delhi";
        const res = await weatherAPI.getWeather({ city, language: user?.profile?.preferred_language || "en" });
        setWeather(res.data);
      } catch { } finally { setLoadingWeather(false); }
    };
    const fetchMarket = async () => {
      try {
        const res = await marketAPI.getPrices({ state: user?.profile?.state, language: user?.profile?.preferred_language || "en" });
        setMarket(res.data);
      } catch { } finally { setLoadingMarket(false); }
    };
    fetchWeather();
    fetchMarket();
  }, [user]);

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{greeting()},</p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {user?.name} 👋
          </h1>
          {user?.profile?.state && (
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              📍 {user.profile.district ? `${user.profile.district}, ` : ""}{user.profile.state}
              {user.profile.farm_size && ` · ${user.profile.farm_size} acres`}
            </p>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link href={action.href} className="block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:shadow-primary-500/10 transition-all group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.desc}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Card */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weather</h2>
            <Link href="/weather" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loadingWeather ? (
            <SkeletonCard />
          ) : weather ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 p-6 text-white shadow-xl shadow-sky-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sky-200 text-sm font-medium">{weather.location}</p>
                  <div className="text-5xl font-black mt-1">{weather.current.temperature}°</div>
                  <p className="text-sky-200 text-sm mt-1">{weather.current.description}</p>
                </div>
                <div className="text-5xl">{weather.current.icon}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
                <div className="text-center">
                  <Droplets className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                  <p className="text-xs text-sky-200">Humidity</p>
                  <p className="font-bold text-sm">{weather.current.humidity}%</p>
                </div>
                <div className="text-center">
                  <Wind className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                  <p className="text-xs text-sky-200">Wind</p>
                  <p className="font-bold text-sm">{weather.current.wind_speed} km/h</p>
                </div>
                <div className="text-center">
                  <Thermometer className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                  <p className="text-xs text-sky-200">Feels like</p>
                  <p className="font-bold text-sm">{weather.current.feels_like}°</p>
                </div>
              </div>
              {weather.farming_alerts?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-sky-200 font-medium mb-2">🌾 Farming Alert</p>
                  <p className="text-xs text-white/90">{weather.farming_alerts[0]}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center">
              <CloudSun className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Weather unavailable</p>
            </div>
          )}
        </div>

        {/* Market Prices */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Market Prices</h2>
            <Link href="/market" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loadingMarket ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : market?.prices?.length > 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Crop</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Market</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Price/Qtl</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {market.prices.slice(0, 8).map((price: any, i: number) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">{price.crop_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{price.market_name}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">₹{price.modal_price.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {trendIcon(price.trend)}
                            <Badge variant={price.trend === "up" ? "success" : price.trend === "down" ? "danger" : "neutral"}>
                              {price.trend}
                            </Badge>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center">
              <TrendingUp className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Market data unavailable</p>
            </div>
          )}
        </div>
      </div>

      {/* Farming Alerts */}
      {weather?.farming_alerts?.length > 1 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">🌾 Farming Alerts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weather.farming_alerts.map((alert: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">{alert}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* AI Recommendation */}
      {weather?.ai_recommendation && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-950/30 dark:to-emerald-950/20 border border-primary-200 dark:border-primary-800/40 p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-primary-900 dark:text-primary-300">AI Farming Recommendation</h3>
            </div>
            <p className="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">{weather.ai_recommendation}</p>
            <Link href="/chat" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary-700 dark:text-primary-400 hover:text-primary-600 transition-colors">
              Ask AI Copilot for more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.section>
      )}
    </DashboardLayout>
  );
}
