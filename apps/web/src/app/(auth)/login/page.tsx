"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { persistSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.set("username", email);
      formData.set("password", password);

      const tokenResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!tokenResponse.ok) {
        const payload = await tokenResponse.json().catch(() => null);
        throw new Error(payload?.detail ?? "Unable to sign in.");
      }

      const tokenPayload = await tokenResponse.json();
      const profile = await apiFetch("/auth/me", {
        token: tokenPayload.access_token,
      });

      persistSession(tokenPayload.access_token, profile.role);
      router.push(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Check that the backend is running and reachable.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background selection:bg-primary/20">
      {/* Left side - Visual/Brand */}
      <div className="hidden md:flex md:w-1/2 bg-muted/40 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <Link href="/" className="flex items-center gap-2 z-10 w-fit">
          <Leaf className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">Zoro Food Tracker</span>
        </Link>

        <div className="z-10 mb-20 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance mb-4">
            Intelligence without the noise.
          </h2>
          <p className="text-muted-foreground text-lg">
            Log back in to view your high-fidelity, data-driven calorie and weight trends tailored natively for your diet.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm shrink-0">
          
          <div className="md:hidden flex items-center gap-2 mb-12">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg tracking-tight">Zoro Food Tracker</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h1>
            <p className="text-muted-foreground mb-8">Enter your credentials to access your dashboard.</p>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11 shadow-sm" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 shadow-sm" />
              </div>
              
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

              <Button type="submit" disabled={isLoading} className="w-full h-11 text-base group mt-2">
                {isLoading ? "Authenticating..." : "Sign in"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create one now
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
