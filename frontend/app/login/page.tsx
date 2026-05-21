"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { authAPI } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sprout, Phone, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const { login } = useAuth();
  const router = useRouter();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!phone || phone.length < 10) newErrors.phone = "Enter a valid 10-digit phone number";
    if (!password || password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const response = await authAPI.login({ phone, password });
      const { access_token, user } = response.data;
      login(access_token, user);
      toast.success(`Welcome back, ${user.name}! 🌾`);
      router.push("/dashboard");
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-xl gradient-text">KrishiMitra</div>
              <div className="text-xs text-slate-500">AI Farmer Copilot</div>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white mb-1">Welcome back 👋</h1>
            <p className="text-slate-400 text-sm">Sign in to your KrishiMitra account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your 10-digit phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              error={errors.phone}
              leftIcon={<Phone className="w-4 h-4" />}
              maxLength={10}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-xl bg-primary-950/40 border border-primary-800/30">
            <p className="text-xs text-primary-400 font-medium mb-1">🧪 Demo Account</p>
            <p className="text-xs text-slate-400">Phone: <span className="text-slate-300 font-mono">9999999999</span> · Password: <span className="text-slate-300 font-mono">demo123</span></p>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to KrishiMitra?{" "}
            <Link href="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
