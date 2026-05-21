"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { authAPI } from "@/lib/api";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sprout, Phone, Lock, User, MapPin, Leaf, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { SOIL_TYPES, INDIAN_STATES, LANGUAGES } from "@/lib/utils";
import toast from "react-hot-toast";

const STEPS = ["Account", "Location", "Farm Details"];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", phone: "", password: "", email: "",
    village: "", district: "", state: "",
    farm_size: "", soil_type: "", crop_types: [] as string[],
    preferred_language: "en",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) newErrors.name = "Name is required";
      if (!form.phone || form.phone.length !== 10) newErrors.phone = "Enter valid 10-digit phone";
      if (!form.password || form.password.length < 6) newErrors.password = "Password must be 6+ characters";
    }
    if (step === 1) {
      if (!form.state) newErrors.state = "State is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        farm_size: form.farm_size ? parseFloat(form.farm_size) : undefined,
      };
      const response = await authAPI.register(payload);
      const { access_token, user } = response.data;
      login(access_token, user);
      toast.success(`Welcome to KrishiMitra, ${user.name}! 🌾`);
      router.push("/dashboard");
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const cropOptions = ["Rice", "Wheat", "Cotton", "Maize", "Tomato", "Onion", "Potato", "Sugarcane", "Soybean", "Groundnut"];

  const toggleCrop = (crop: string) => {
    setForm((prev) => ({
      ...prev,
      crop_types: prev.crop_types.includes(crop)
        ? prev.crop_types.filter((c) => c !== crop)
        : [...prev.crop_types, crop],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-xl gradient-text">KrishiMitra</div>
              <div className="text-xs text-slate-500">AI Farmer Copilot</div>
            </div>
          </Link>
        </div>

        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? "bg-primary-500 text-white" :
                  i === step ? "bg-primary-600 text-white ring-2 ring-primary-400 ring-offset-2 ring-offset-slate-900" :
                  "bg-slate-800 text-slate-500"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-primary-400" : "text-slate-500"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-primary-500" : "bg-slate-800"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Create your account</h2>
                <Input label="Full Name" placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} error={errors.name} leftIcon={<User className="w-4 h-4" />} />
                <Input label="Phone Number" type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} error={errors.phone} leftIcon={<Phone className="w-4 h-4" />} />
                <Input label="Password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={form.password} onChange={(e) => update("password", e.target.value)} error={errors.password} leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
                />
                <Select label="Preferred Language" value={form.preferred_language} onChange={(e) => update("preferred_language", e.target.value)}
                  options={LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` }))}
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Your location</h2>
                <Select label="State *" value={form.state} onChange={(e) => update("state", e.target.value)} error={errors.state}
                  options={[{ value: "", label: "Select your state" }, ...INDIAN_STATES.map((s) => ({ value: s, label: s }))]}
                />
                <Input label="District" placeholder="Your district" value={form.district} onChange={(e) => update("district", e.target.value)} leftIcon={<MapPin className="w-4 h-4" />} />
                <Input label="Village" placeholder="Your village name" value={form.village} onChange={(e) => update("village", e.target.value)} leftIcon={<MapPin className="w-4 h-4" />} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Farm details</h2>
                <Input label="Farm Size (acres)" type="number" placeholder="e.g. 2.5" value={form.farm_size} onChange={(e) => update("farm_size", e.target.value)} leftIcon={<Leaf className="w-4 h-4" />} />
                <Select label="Soil Type" value={form.soil_type} onChange={(e) => update("soil_type", e.target.value)}
                  options={[{ value: "", label: "Select soil type" }, ...SOIL_TYPES.map((s) => ({ value: s, label: s }))]}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Crops you grow</label>
                  <div className="flex flex-wrap gap-2">
                    {cropOptions.map((crop) => (
                      <button key={crop} type="button" onClick={() => toggleCrop(crop)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.crop_types.includes(crop)
                            ? "bg-primary-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} leftIcon={<ChevronLeft className="w-4 h-4" />} className="flex-1">
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />} className="flex-1">
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1" size="lg">
                {isLoading ? "Creating account..." : "Create Account 🌾"}
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
