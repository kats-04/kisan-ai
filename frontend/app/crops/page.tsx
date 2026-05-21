"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { cropAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SOIL_TYPES, INDIAN_STATES, SEASONS, WATER_AVAILABILITY } from "@/lib/utils";
import { Leaf, Sprout, TrendingUp, Clock, Droplets, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function CropsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [expandedCrop, setExpandedCrop] = useState<number | null>(0);
  const [form, setForm] = useState({
    soil_type: user?.profile?.soil_type || "",
    state: user?.profile?.state || "",
    region: user?.profile?.district || "",
    water_availability: "medium",
    season: "kharif",
    farm_size: user?.profile?.farm_size?.toString() || "",
    budget: "medium",
    language: user?.profile?.preferred_language || "en",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.soil_type || !form.state) {
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await cropAPI.recommend({
        ...form,
        farm_size: form.farm_size ? parseFloat(form.farm_size) : undefined,
      });
      setResult(res.data);
      setExpandedCrop(0);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">🌱 Crop Advisor</h1>
        <p className="text-slate-500 dark:text-slate-400">AI-powered crop recommendations for your farm</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary-500" /> Farm Details
            </h2>
            <Select label="Soil Type *" value={form.soil_type} onChange={(e) => update("soil_type", e.target.value)}
              options={[{ value: "", label: "Select soil type" }, ...SOIL_TYPES.map((s) => ({ value: s, label: s }))]}
            />
            <Select label="State *" value={form.state} onChange={(e) => update("state", e.target.value)}
              options={[{ value: "", label: "Select state" }, ...INDIAN_STATES.map((s) => ({ value: s, label: s }))]}
            />
            <Select label="Season" value={form.season} onChange={(e) => update("season", e.target.value)}
              options={SEASONS.map((s) => ({ value: s.value, label: `${s.icon} ${s.label}` }))}
            />
            <Select label="Water Availability" value={form.water_availability} onChange={(e) => update("water_availability", e.target.value)}
              options={WATER_AVAILABILITY.map((w) => ({ value: w.value, label: w.label }))}
            />
            <Select label="Budget Level" value={form.budget} onChange={(e) => update("budget", e.target.value)}
              options={[{ value: "low", label: "Low Budget" }, { value: "medium", label: "Medium Budget" }, { value: "high", label: "High Budget" }]}
            />
            <Select label="Language" value={form.language} onChange={(e) => update("language", e.target.value)}
              options={[{ value: "en", label: "🇬🇧 English" }, { value: "hi", label: "🇮🇳 Hindi" }, { value: "kn", label: "🇮🇳 Kannada" }]}
            />
            <Button onClick={handleSubmit} isLoading={loading} className="w-full" size="lg" leftIcon={<Sprout className="w-4 h-4" />}>
              {loading ? "Analyzing..." : "Get Recommendations"}
            </Button>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Best Crop Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-600 p-6 text-white shadow-xl shadow-primary-500/20"
              >
                <p className="text-primary-200 text-sm font-medium mb-1">🏆 Best Recommendation</p>
                <h2 className="text-3xl font-black">{result.best_crop}</h2>
                <p className="text-primary-200 text-sm mt-2">{result.season_advice}</p>
              </motion.div>

              {/* Crop Cards */}
              {result.recommendations?.map((crop: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCrop(expandedCrop === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-emerald-100 dark:from-primary-950/40 dark:to-emerald-950/40 flex items-center justify-center text-2xl">
                        🌾
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 dark:text-white">{crop.crop_name}</h3>
                        {crop.local_name && <p className="text-sm text-slate-500">{crop.local_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className={`text-2xl font-black ${scoreColor(crop.suitability_score)}`}>{crop.suitability_score}%</p>
                        <p className="text-xs text-slate-500">Suitability</p>
                      </div>
                      {expandedCrop === i ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedCrop === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            {[
                              { icon: TrendingUp, label: "Expected Yield", value: crop.expected_yield },
                              { icon: TrendingUp, label: "Est. Profit", value: crop.estimated_profit },
                              { icon: Clock, label: "Duration", value: `${crop.duration_days} days` },
                              { icon: Droplets, label: "Water Need", value: crop.water_requirement },
                            ].map((item) => {
                              const Icon = item.icon;
                              return (
                                <div key={item.label} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-center">
                                  <Icon className="w-4 h-4 mx-auto mb-1 text-primary-500" />
                                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                                </div>
                              );
                            })}
                          </div>
                          {crop.tips?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Farming Tips
                              </p>
                              <ul className="space-y-1">
                                {crop.tips.map((tip: string, j: number) => (
                                  <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="text-primary-500 mt-0.5">•</span> {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {crop.risks?.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-amber-500" /> Risks
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {crop.risks.map((risk: string, j: number) => (
                                  <Badge key={j} variant="warning">{risk}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {/* AI Summary */}
              {result.ai_summary && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800/40 p-5"
                >
                  <p className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-2">🤖 AI Analysis</p>
                  <p className="text-sm text-primary-700 dark:text-primary-200 leading-relaxed">{result.ai_summary}</p>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Leaf className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">Get Crop Recommendations</h3>
              <p className="text-sm text-slate-400">Fill in your farm details and click "Get Recommendations"</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
