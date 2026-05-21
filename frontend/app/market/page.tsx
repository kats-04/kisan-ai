"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { marketAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { INDIAN_STATES } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Search, RefreshCw, Sprout, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const POPULAR_CROPS = ["Tomato", "Onion", "Potato", "Rice", "Wheat", "Cotton", "Maize", "Soybean"];

export default function MarketPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState(user?.profile?.state || "");
  const [crop, setCrop] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"prices" | "schemes">("prices");
  const [schemes, setSchemes] = useState<any>(null);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  useEffect(() => { fetchPrices(); }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await marketAPI.getPrices({ state: state || undefined, crop: crop || undefined, language: user?.profile?.preferred_language || "en" });
      setData(res.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchSchemes = async () => {
    setLoadingSchemes(true);
    try {
      const res = await marketAPI.getSchemes({ state: state || undefined, language: user?.profile?.preferred_language || "en" });
      setSchemes(res.data);
    } catch { } finally { setLoadingSchemes(false); }
  };

  useEffect(() => {
    if (activeTab === "schemes" && !schemes) fetchSchemes();
  }, [activeTab]);

  const filteredPrices = data?.prices?.filter((p: any) =>
    !search || p.crop_name.toLowerCase().includes(search.toLowerCase()) || p.market_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const chartData = POPULAR_CROPS.map((cropName) => {
    const prices = data?.prices?.filter((p: any) => p.crop_name === cropName) || [];
    const avg = prices.length ? Math.round(prices.reduce((s: number, p: any) => s + p.modal_price, 0) / prices.length) : 0;
    return { name: cropName, price: avg };
  }).filter((d) => d.price > 0);

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">📊 Market Intelligence</h1>
        <p className="text-slate-500 dark:text-slate-400">Live mandi prices with AI sell/hold recommendations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[{ id: "prices", label: "Mandi Prices", icon: TrendingUp }, { id: "schemes", label: "Gov Schemes", icon: Sprout }].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "prices" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Search crop or market..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="max-w-xs" />
            <Select value={state} onChange={(e) => setState(e.target.value)}
              options={[{ value: "", label: "All States" }, ...INDIAN_STATES.map((s) => ({ value: s, label: s }))]}
              className="max-w-xs"
            />
            <Button onClick={fetchPrices} variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
          </div>

          {/* Quick crop filter */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setCrop(""); fetchPrices(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!crop ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
              All Crops
            </button>
            {POPULAR_CROPS.map((c) => (
              <button key={c} onClick={() => { setCrop(c); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${crop === c ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Price Table */}
              <div className="xl:col-span-2">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Crop</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Market</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Min</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Modal</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Max</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredPrices.slice(0, 20).map((price: any, i: number) => (
                          <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-sm text-slate-900 dark:text-white">{price.crop_name}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{price.market_name}</td>
                            <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">₹{price.min_price.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold text-sm text-slate-900 dark:text-white">₹{price.modal_price.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">₹{price.max_price.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {trendIcon(price.trend)}
                                <Badge variant={price.trend === "up" ? "success" : price.trend === "down" ? "danger" : "neutral"} size="sm">
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
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Chart */}
                {chartData.length > 0 && (
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary-500" /> Price Overview
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => [`₹${v}`, "Modal Price"]} />
                        <Bar dataKey="price" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* AI Recommendation */}
                {data?.ai_recommendation && (
                  <div className="rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800/40 p-4">
                    <p className="font-semibold text-primary-800 dark:text-primary-300 mb-2 flex items-center gap-2">
                      <Sprout className="w-4 h-4" /> AI Advice
                    </p>
                    <p className="text-sm text-primary-700 dark:text-primary-200 leading-relaxed">{data.ai_recommendation}</p>
                    <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800/40">
                      <p className="text-xs text-primary-600 dark:text-primary-400"><strong>Best time to sell:</strong> {data.best_time_to_sell}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "schemes" && (
        <div className="space-y-4">
          {loadingSchemes ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : schemes?.schemes?.length > 0 ? (
            schemes.schemes.map((scheme: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{scheme.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{scheme.description}</p>
                  </div>
                  <Badge variant={scheme.category === "subsidy" ? "success" : scheme.category === "loan" ? "info" : scheme.category === "insurance" ? "warning" : "neutral"}>
                    {scheme.category}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Eligibility</p>
                    <ul className="space-y-1">{scheme.eligibility?.map((e: string, j: number) => (
                      <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{e}</li>
                    ))}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Benefits</p>
                    <ul className="space-y-1">{scheme.benefits?.map((b: string, j: number) => (
                      <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">•</span>{b}</li>
                    ))}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">How to Apply</p>
                    <ol className="space-y-1">{scheme.how_to_apply?.map((s: string, j: number) => (
                      <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5"><span className="text-primary-500 font-bold mt-0.5">{j + 1}.</span>{s}</li>
                    ))}</ol>
                  </div>
                </div>
                {scheme.link && (
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                    Visit Official Website →
                  </a>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">No schemes found</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
