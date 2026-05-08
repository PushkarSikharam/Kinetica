"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { persistSession } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

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
        throw new Error(payload?.detail ?? "Unable to start onboarding.");
      }

      const tokenPayload = await tokenResponse.json();
      const profile = await apiFetch("/auth/me", {
        token: tokenPayload.access_token,
      });

      persistSession(tokenPayload.access_token, profile.role);
      router.push("/onboarding");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Check that the backend is running and reachable.",
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
            A tracker built on transparency and precision.
          </h2>
          <p className="text-muted-foreground text-lg">
            Say goodbye to endless noisy databases. Let the engine observe your behavior and build a true baseline of your metabolism.
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
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Create an account</h1>
            <p className="text-muted-foreground mb-8">Start your intelligence-driven nutrition journey.</p>

            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required className="h-11 shadow-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required className="h-11 shadow-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password</Label>
                <Input id="password_confirm" type="password" required className="h-11 shadow-sm" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="pt-2">
                  <Button type="submit" className="w-full h-11 text-base group" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Continue to setup"}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in instead
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
