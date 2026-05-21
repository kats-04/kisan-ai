"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { authAPI } from "@/lib/api";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SOIL_TYPES, INDIAN_STATES, LANGUAGES, getInitials } from "@/lib/utils";
import { User, Phone, MapPin, Leaf, Save, Globe } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    village: user?.profile?.village || "",
    district: user?.profile?.district || "",
    state: user?.profile?.state || "",
    farm_size: user?.profile?.farm_size?.toString() || "",
    soil_type: user?.profile?.soil_type || "",
    preferred_language: user?.profile?.preferred_language || "en",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        ...form,
        farm_size: form.farm_size ? parseFloat(form.farm_size) : undefined,
      });
      updateUser(res.data);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">⚙️ Profile Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account and farm details</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-primary-500/30">
              {getInitials(user?.name || "U")}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
              <p className="text-slate-500 dark:text-slate-400">{user?.phone}</p>
              {user?.profile?.state && (
                <p className="text-sm text-slate-400 mt-1">📍 {user.profile.district ? `${user.profile.district}, ` : ""}{user.profile.state}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} leftIcon={<User className="w-4 h-4" />} />
            <Input label="Phone Number" value={user?.phone || ""} disabled leftIcon={<Phone className="w-4 h-4" />} hint="Phone cannot be changed" />
            <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" />
            <Select label="Preferred Language" value={form.preferred_language} onChange={(e) => update("preferred_language", e.target.value)}
              options={LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` }))}
            />
          </div>
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" /> Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="State" value={form.state} onChange={(e) => update("state", e.target.value)}
              options={[{ value: "", label: "Select state" }, ...INDIAN_STATES.map((s) => ({ value: s, label: s }))]}
            />
            <Input label="District" value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Your district" />
            <Input label="Village" value={form.village} onChange={(e) => update("village", e.target.value)} placeholder="Your village" />
          </div>
        </motion.div>

        {/* Farm Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary-500" /> Farm Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Farm Size (acres)" type="number" value={form.farm_size} onChange={(e) => update("farm_size", e.target.value)} placeholder="e.g. 2.5" />
            <Select label="Soil Type" value={form.soil_type} onChange={(e) => update("soil_type", e.target.value)}
              options={[{ value: "", label: "Select soil type" }, ...SOIL_TYPES.map((s) => ({ value: s, label: s }))]}
            />
          </div>
        </motion.div>

        <Button onClick={handleSave} isLoading={saving} size="lg" leftIcon={<Save className="w-5 h-5" />} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </DashboardLayout>
  );
}
