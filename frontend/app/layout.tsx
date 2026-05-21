import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KrishiMitra – AI Farmer Advisory Copilot",
  description: "AI-powered agritech platform helping Indian farmers make smarter agricultural decisions",
  keywords: ["farming", "agriculture", "AI", "crop recommendation", "weather", "mandi prices", "India"],
  authors: [{ name: "KrishiMitra Team" }],
  openGraph: {
    title: "KrishiMitra – AI Farmer Advisory Copilot",
    description: "Smart farming decisions powered by AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--toast-bg, #1e293b)",
                  color: "var(--toast-color, #f8fafc)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "12px",
                  fontSize: "14px",
                },
                success: {
                  iconTheme: { primary: "#22c55e", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
