"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import {
  Sprout, MessageSquare, CloudSun, Leaf, TrendingUp,
  Microscope, ShieldCheck, Mic, ArrowRight, Star,
  CheckCircle2, Zap, Globe, Users, BarChart3
} from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Copilot Chat", desc: "Ask anything in Hindi, Kannada or English. Get expert farming advice instantly.", color: "from-green-500 to-emerald-600", bg: "bg-green-50 dark:bg-green-950/20" },
  { icon: CloudSun, title: "Weather Intelligence", desc: "Live weather + 7-day forecast with AI-powered farming alerts.", color: "from-sky-500 to-blue-600", bg: "bg-sky-50 dark:bg-sky-950/20" },
  { icon: Leaf, title: "Crop Recommendations", desc: "AI suggests best crops based on your soil, region, and season.", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  { icon: Microscope, title: "Disease Detection", desc: "Upload crop photo. AI detects diseases and suggests treatments.", color: "from-orange-500 to-red-600", bg: "bg-orange-50 dark:bg-orange-950/20" },
  { icon: TrendingUp, title: "Market Prices", desc: "Live mandi prices with AI sell/hold recommendations.", color: "from-purple-500 to-violet-600", bg: "bg-purple-50 dark:bg-purple-950/20" },
  { icon: ShieldCheck, title: "Gov Schemes", desc: "Simplified government scheme info with eligibility and application guide.", color: "from-yellow-500 to-amber-600", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
  { icon: Mic, title: "Voice Assistant", desc: "Speak in your language. KrishiMitra understands and responds.", color: "from-pink-500 to-rose-600", bg: "bg-pink-50 dark:bg-pink-950/20" },
  { icon: BarChart3, title: "Farm Analytics", desc: "Beautiful dashboard with crop insights, alerts, and trends.", color: "from-indigo-500 to-blue-600", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
];

const stats = [
  { value: "50K+", label: "Farmers Helped", icon: Users },
  { value: "15+", label: "AI Models", icon: Zap },
  { value: "3", label: "Languages", icon: Globe },
  { value: "98%", label: "Accuracy", icon: Star },
];

const testimonials = [
  { name: "Ramesh Kumar", location: "Karnataka", text: "KrishiMitra helped me identify a disease in my tomato crop early. Saved my entire harvest!", crop: "Tomato Farmer" },
  { name: "Sunita Devi", location: "Uttar Pradesh", text: "The weather alerts are amazing. I knew about rain 3 days early and harvested on time.", crop: "Wheat Farmer" },
  { name: "Vijay Patil", location: "Maharashtra", text: "Market price recommendations helped me sell cotton at the right time. Earned 20% more!", crop: "Cotton Farmer" },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={`rounded-2xl p-6 border border-slate-200 dark:border-slate-800 ${feature.bg} cursor-default group`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-950/60 border border-primary-800/50 text-primary-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Powered by Gemini AI & Groq
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="gradient-text">Smart Farming</span>
              <br />
              <span className="text-white">Starts Here</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              KrishiMitra is your AI-powered farming advisor. Get crop recommendations, disease detection, weather alerts, and market insights — all in your language.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-2xl shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all text-lg"
                >
                  Start for Free <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-700 text-slate-300 font-bold rounded-2xl hover:border-primary-600 hover:text-primary-400 transition-all text-lg"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              ✓ Free to use &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Works on any phone
            </p>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 max-w-3xl mx-auto shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-slate-500">KrishiMitra AI Copilot</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm flex-shrink-0">👨‍🌾</div>
                  <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-300 max-w-xs">
                    मेरे टमाटर की पत्तियां पीली हो रही हैं, क्या करूं?
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-gradient-to-br from-primary-900/60 to-primary-800/40 border border-primary-700/30 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-primary-200 max-w-sm">
                    <p className="font-semibold text-primary-400 mb-1">🌿 KrishiMitra</p>
                    टमाटर की पत्तियों का पीला होना नाइट्रोजन की कमी या अर्ली ब्लाइट के कारण हो सकता है।
                    <br /><br />
                    <strong>तुरंत करें:</strong><br />
                    • यूरिया 20 किग्रा/एकड़ डालें<br />
                    • मैंकोजेब 2g/L पानी में स्प्रे करें
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                    <Sprout className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-950/60 border border-primary-800/40 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="text-3xl font-black gradient-text">{stat.value}</div>
                  <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black mb-4">
              Everything a farmer <span className="gradient-text">needs</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              From AI chat to disease detection — all tools in one platform, designed for Indian farmers.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black mb-4">Farmers <span className="gradient-text">love it</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.crop} · {t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-primary-900/60 to-emerald-900/40 border border-primary-700/30 p-12"
          >
            <Sprout className="w-16 h-16 text-primary-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-4">Ready to farm smarter?</h2>
            <p className="text-slate-400 mb-8 text-lg">Join thousands of farmers already using KrishiMitra.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
              >
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
              {["Free forever", "No credit card", "Works offline"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-500" /> {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">KrishiMitra</span>
          </div>
          <p className="text-sm text-slate-500">© 2024 KrishiMitra. Built for Indian farmers with ❤️</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
