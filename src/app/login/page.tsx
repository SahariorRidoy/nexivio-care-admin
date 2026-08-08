"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await login(data.email, data.password);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #071848 0%, #153488 100%)" }}>
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-2xl mx-4">
      {/* Left hero panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-10 py-12 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4caf50, transparent)" }} />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4caf50, transparent)" }} />

        <div className="relative z-10 w-full">
          {/* Logo + Title row */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-white overflow-hidden shadow-lg">
              <Image src="/logo.jpeg" alt="Nexivio Care" width={64} height={64} className="object-cover w-full h-full" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">Nexivio Care</h1>
              <p className="text-white/60 text-sm mt-0.5">Admin Management Portal</p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-col gap-4 text-left">
            {[
              { icon: "🏥", title: "Caregiver Management", desc: "Oversee all caregivers and assignments" },
              { icon: "📋", title: "Patient Oversight", desc: "Monitor patient care plans and records" },
              { icon: "📊", title: "Analytics & Reports", desc: "Real-time insights and performance data" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <div className="w-full p-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md">
              <Image src="/logo.jpeg" alt="Nexivio Care" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <span className="text-white font-bold text-lg">Nexivio Care</span>
          </div>

          <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your admin account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {serverError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <span className="text-base">⚠️</span>
                  {serverError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="admin@nexiviocare.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all mt-1 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #388e3c, #2e7d32)" }}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-6 text-slate-400 text-xs">
               <p className="text-center text-xs mt-5">
            © {new Date().getFullYear()} Nexivio Care. All rights reserved.
          </p>
            </div>
        </div>
      </div>
      </div>
    </div>
  );
}
