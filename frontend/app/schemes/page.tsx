"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { marketAPI } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ShieldCheck, Search, ExternalLink, CheckCircle, IndianRupee, BookOpen, Tractor } from "lucide-react";

const CATEGORIES = [
  { id: "", label: "All Schemes" },
  { id: "subsidy", label: "Subsidies" },
  { id: "loan", label: "Loans" },
  { id: "insurance", label: "Insurance" },
  { id: "training", label: "Training" },
];

export default function SchemesPage() {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");

  useEffect(() => { fetchSchemes(); }, [category]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await marketAPI.getSchemes({
        state: user?.profile?.state,
        category: category || undefined,
        language: user?.profile?.preferred_language || "en",
      });
      setSchemes(res.data.schemes || []);
      setAiExplanation(res.data.ai_explanation || "");
    } catch { } finally { setLoading(false); }
  };

  const filtered = schemes.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const categoryIcon = (cat: string) => {
    if (cat === "subsidy") return <IndianRupee className="w-4 h-4" />;
    if (cat === "loan") return <BookOpen className="w-4 h-4" />;
    if (cat === "insurance") return <ShieldCheck className="w-4 h-4" />;
    return <Tractor className="w-4 h-4" />;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">🏛️ Government Schemes</h1>
        <p className="text-slate-500 dark:text-slate-400">Agricultural subsidies, loans, and benefits for farmers</p>
      </div>

      {/* AI Explanation */}
      {aiExplanation && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-950/30 dark:to-emerald-950/20 border border-primary-200 dark:border-primary-800/40 p-5">
          <p className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-1">🤖 AI Summary</p>
          <p className="text-sm text-primary-700 dark:text-primary-200 leading-relaxed">{aiExplanation}</p>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Search schemes..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="max-w-xs" />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat.id
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700"
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((scheme, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:shadow-primary-500/5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-emerald-100 dark:from-primary-950/40 dark:to-emerald-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                    {categoryIcon(scheme.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{scheme.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{scheme.description}</p>
                    <p className="text-xs text-slate-400 mt-1">By: {scheme.ministry}</p>
                  </div>
                </div>
                <Badge variant={scheme.category === "subsidy" ? "success" : scheme.category === "loan" ? "info" : scheme.category === "insurance" ? "warning" : "neutral"}>
                  {scheme.category}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">✅ Eligibility</p>
                  <ul className="space-y-1.5">
                    {scheme.eligibility?.map((e: string, j: number) => (
                      <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" /> {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">💰 Benefits</p>
                  <ul className="space-y-1.5">
                    {scheme.benefits?.map((b: string, j: number) => (
                      <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-primary-500 mt-0.5">•</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">📋 How to Apply</p>
                  <ol className="space-y-1.5">
                    {scheme.how_to_apply?.map((s: string, j: number) => (
                      <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5 flex-shrink-0">{j + 1}.</span> {s}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {scheme.link && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Visit Official Website
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
