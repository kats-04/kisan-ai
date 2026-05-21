"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Calendar, Plus, Droplets, Leaf, Bug, Scissors, Sprout, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ACTIVITY_TYPES = [
  { id: "sowing", label: "Sowing", icon: Sprout, color: "bg-green-500", light: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40 text-green-800 dark:text-green-300" },
  { id: "watering", label: "Watering", icon: Droplets, color: "bg-blue-500", light: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-300" },
  { id: "fertilizer", label: "Fertilizer", icon: Leaf, color: "bg-yellow-500", light: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300" },
  { id: "pesticide", label: "Pest Control", icon: Bug, color: "bg-orange-500", light: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40 text-orange-800 dark:text-orange-300" },
  { id: "harvest", label: "Harvest", icon: Scissors, color: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40 text-purple-800 dark:text-purple-300" },
];

const SAMPLE_EVENTS = [
  { date: new Date().getDate(), type: "watering", title: "Irrigate wheat field", crop: "Wheat" },
  { date: new Date().getDate() + 2, type: "fertilizer", title: "Apply NPK fertilizer", crop: "Tomato" },
  { date: new Date().getDate() + 5, type: "pesticide", title: "Spray neem oil", crop: "Cotton" },
  { date: new Date().getDate() + 8, type: "harvest", title: "Harvest ready", crop: "Onion" },
  { date: new Date().getDate() - 2, type: "sowing", title: "Sow rabi seeds", crop: "Wheat" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [events] = useState(SAMPLE_EVENTS);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const getEventsForDate = (day: number) => events.filter((e) => e.date === day);
  const getActivityType = (typeId: string) => ACTIVITY_TYPES.find((a) => a.id === typeId);

  const selectedEvents = getEventsForDate(selectedDate);
  const upcomingEvents = events.filter((e) => e.date >= today.getDate()).sort((a, b) => a.date - b.date);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">📅 Farm Calendar</h1>
        <p className="text-slate-500 dark:text-slate-400">Plan and track your farming activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">{day}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const isSelected = day === selectedDate;
                const dayEvents = getEventsForDate(day);

                return (
                  <motion.button
                    key={day}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 text-sm font-medium transition-all",
                      isSelected ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30" :
                      isToday ? "bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500" :
                      "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {day}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((event, j) => {
                          const type = getActivityType(event.type);
                          return <div key={j} className={cn("w-1.5 h-1.5 rounded-full", type?.color || "bg-slate-400")} />;
                        })}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className={cn("w-3 h-3 rounded-full", type.color)} />
                    {type.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected day events */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {selectedDate} {MONTHS[currentMonth]}
              </h3>
              <Button size="sm" leftIcon={<Plus className="w-3 h-3" />}>Add</Button>
            </div>
            {selectedEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedEvents.map((event, i) => {
                  const type = getActivityType(event.type);
                  const Icon = type?.icon || Calendar;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={cn("flex items-start gap-3 p-3 rounded-xl border", type?.light)}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", type?.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{event.title}</p>
                        <p className="text-xs opacity-70">{event.crop}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No activities planned</p>
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Upcoming Activities</h3>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event, i) => {
                const type = getActivityType(event.type);
                const Icon = type?.icon || Calendar;
                const daysLeft = event.date - today.getDate();
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", type?.color)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{event.title}</p>
                      <p className="text-xs text-slate-500">{event.crop}</p>
                    </div>
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 flex-shrink-0">
                      {daysLeft === 0 ? "Today" : `${daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
