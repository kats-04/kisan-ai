"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, CloudSun, Leaf,
  TrendingUp, Calendar, ShieldCheck, Microscope, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500" },
  { href: "/chat", label: "AI Copilot", icon: MessageSquare, color: "text-primary-500" },
  { href: "/weather", label: "Weather", icon: CloudSun, color: "text-sky-500" },
  { href: "/crops", label: "Crop Advisor", icon: Leaf, color: "text-emerald-500" },
  { href: "/disease", label: "Disease Detect", icon: Microscope, color: "text-orange-500" },
  { href: "/market", label: "Market Prices", icon: TrendingUp, color: "text-purple-500" },
  { href: "/calendar", label: "Farm Calendar", icon: Calendar, color: "text-pink-500" },
  { href: "/schemes", label: "Gov Schemes", icon: ShieldCheck, color: "text-yellow-500" },
  { href: "/profile", label: "Settings", icon: Settings, color: "text-slate-500" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:flex flex-col w-64 min-h-screen border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="flex-1 px-3 py-6 space-y-1">
        {sidebarLinks.map((link, i) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  active
                    ? "bg-primary-100 dark:bg-primary-900/40"
                    : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                )}>
                  <Icon className={cn("w-4 h-4", active ? "text-primary-600 dark:text-primary-400" : link.color)} />
                </div>
                {link.label}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom card */}
      <div className="p-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-4 text-white">
          <p className="text-xs font-semibold opacity-80 mb-1">🌾 Farming Tip</p>
          <p className="text-xs opacity-90 leading-relaxed">
            Test your soil every season for optimal crop yield and reduced input costs.
          </p>
        </div>
      </div>
    </aside>
  );
}
