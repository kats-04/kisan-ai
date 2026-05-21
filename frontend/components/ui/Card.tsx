"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function Card({ children, className, hover = false, glass = false, onClick, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        glass
          ? "bg-white/8 backdrop-blur-xl border-white/15 dark:bg-black/20"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
        hover && "cursor-pointer hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-500/30",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-4 border-b border-slate-200 dark:border-slate-800", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-4 border-t border-slate-200 dark:border-slate-800", className)}>
      {children}
    </div>
  );
}
