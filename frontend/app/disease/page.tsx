"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { cropAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { imageToBase64 } from "@/lib/utils";
import { Upload, Image as ImageIcon, Microscope, AlertTriangle, CheckCircle, Leaf, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CROP_TYPES = ["Tomato", "Wheat", "Rice", "Cotton", "Maize", "Potato", "Onion", "Sugarcane", "Soybean", "Groundnut", "Other"];

export default function DiseasePage() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState("");
  const [language, setLanguage] = useState(user?.profile?.preferred_language || "en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImage(url);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
  });

  const handleDetect = async () => {
    if (!imageFile) { toast.error("Please upload a crop image"); return; }
    setLoading(true);
    try {
      const base64 = await imageToBase64(imageFile);
      const res = await cropAPI.detectDisease({ image_base64: base64, crop_type: cropType || undefined, language });
      setResult(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Detection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const severityVariant = (s: string) => {
    if (s === "critical") return "danger";
    if (s === "high") return "danger";
    if (s === "medium") return "warning";
    return "success";
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">🔬 Disease Detection</h1>
        <p className="text-slate-500 dark:text-slate-400">Upload a crop photo for AI-powered disease analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              isDragActive
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20"
                : "border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 bg-slate-50 dark:bg-slate-900"
            }`}
          >
            <input {...getInputProps()} />
            {image ? (
              <div className="relative">
                <img src={image} alt="Uploaded crop" className="w-full h-72 object-cover rounded-2xl" />
                <button
                  onClick={(e) => { e.stopPropagation(); setImage(null); setImageFile(null); setResult(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                  {imageFile?.name}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <motion.div
                  animate={{ y: isDragActive ? -8 : 0 }}
                  className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center mb-4"
                >
                  <Upload className="w-8 h-8 text-primary-500" />
                </motion.div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isDragActive ? "Drop your image here" : "Upload crop photo"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Drag & drop or click to browse</p>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG, WebP · Max 10MB</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Crop Type (optional)"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              options={[{ value: "", label: "Auto-detect" }, ...CROP_TYPES.map((c) => ({ value: c, label: c }))]}
            />
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={[{ value: "en", label: "🇬🇧 English" }, { value: "hi", label: "🇮🇳 Hindi" }, { value: "kn", label: "🇮🇳 Kannada" }]}
            />
          </div>

          <Button onClick={handleDetect} isLoading={loading} disabled={!image} className="w-full" size="lg" leftIcon={<Microscope className="w-5 h-5" />}>
            {loading ? "Analyzing..." : "Detect Disease"}
          </Button>

          {/* Tips */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📸 Photo Tips</p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Take close-up photos of affected leaves/stems</li>
              <li>• Use good lighting (natural light preferred)</li>
              <li>• Include both healthy and affected parts</li>
              <li>• Avoid blurry or dark images</li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">Analyzing your crop...</p>
                <p className="text-sm text-slate-400 mt-1">AI is examining the image</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Disease Header */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{result.disease_name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{result.affected_area}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-primary-600 dark:text-primary-400">{result.confidence}%</div>
                      <p className="text-xs text-slate-500">Confidence</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={severityVariant(result.severity)}>
                      {result.severity === "critical" ? "🔴" : result.severity === "high" ? "🟠" : result.severity === "medium" ? "🟡" : "🟢"} {result.severity} severity
                    </Badge>
                  </div>
                </div>

                {/* Solutions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Organic */}
                  <div className="rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 p-4">
                    <p className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                      <Leaf className="w-4 h-4" /> Organic Solutions
                    </p>
                    <ul className="space-y-2">
                      {result.organic_solutions?.map((sol: string, i: number) => (
                        <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {sol}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chemical */}
                  <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
                    <p className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Chemical Solutions
                    </p>
                    <ul className="space-y-2">
                      {result.chemical_solutions?.map((sol: string, i: number) => (
                        <li key={i} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {sol}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Prevention */}
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Prevention Tips
                  </p>
                  <ul className="space-y-1.5">
                    {result.prevention_tips?.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                        <span className="mt-0.5">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Analysis */}
                {result.ai_analysis && (
                  <div className="rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800/40 p-4">
                    <p className="font-semibold text-primary-800 dark:text-primary-300 mb-2">🤖 AI Analysis</p>
                    <p className="text-sm text-primary-700 dark:text-primary-200 leading-relaxed">{result.ai_analysis}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center px-6"
              >
                <Microscope className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-2">Upload a crop photo</h3>
                <p className="text-sm text-slate-400">AI will detect diseases and suggest treatments</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
