import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-6 shadow-2xl transition-all", className)}>
      {children}
    </div>
  );
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:translate-y-0.5",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm active:translate-y-0.5",
    outline: "bg-transparent border border-white/20 text-white/70 hover:text-white hover:border-white/40 active:translate-y-0.5"
  };
  
  return (
    <button 
      className={cn(
        "px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</label>}
      <input 
        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder:text-white/20 transition-all"
        {...props}
      />
    </div>
  );
}
