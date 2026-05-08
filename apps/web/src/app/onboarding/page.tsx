"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const katoriPresets: Record<string, number> = {
  small: 0.4,
  medium: 0.6,
  large: 0.8,
};

const rotiPresets: Record<string, number> = {
  thin: 0.25,
  medium: 0.35,
  thick: 0.5,
};

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const totalSteps = 4;

  const [displayName, setDisplayName] = useState("");
  const [biologicalSex, setBiologicalSex] = useState("other");
  const [startingWeight, setStartingWeight] = useState("");
  const [targetCalories, setTargetCalories] = useState("2100");
  const [goalType, setGoalType] = useState("maintain");
  const [goalRate, setGoalRate] = useState("0");
  const [katoriSize, setKatoriSize] = useState("medium");
  const [rotiSize, setRotiSize] = useState("medium");
  const [oilLevel, setOilLevel] = useState("moderate");

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const completeOnboarding = async () => {
    setIsSaving(true);
    setError("");

    try {
      await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          display_name: displayName || null,
          biological_sex: biologicalSex,
          goal_type: goalType,
          goal_rate_kg_week: Number(goalRate),
          target_calories: Number(targetCalories),
          katori_multiplier: katoriPresets[katoriSize],
          roti_multiplier: rotiPresets[rotiSize],
          oil_level: oilLevel,
        }),
      });

      if (startingWeight) {
        await apiFetch("/weight/", {
          method: "POST",
          body: JSON.stringify({ weight_kg: Number(startingWeight) }),
        });
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save onboarding details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-12 items-center px-4">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="font-semibold tracking-tight">Zoro Food Tracker</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          Step {step} of {totalSteps}
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-card border rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Let&apos;s build your baseline</h2>
                <p className="text-muted-foreground">We need your profile, starting weight, and your current goal.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="What should we call you?" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <Select value={biologicalSex} onValueChange={setBiologicalSex}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Starting Weight (kg)</Label>
                  <Input id="weight" type="number" placeholder="e.g. 70" className="h-11" step="0.1" value={startingWeight} onChange={(e) => setStartingWeight(e.target.value)} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">What are you aiming for?</h2>
                <p className="text-muted-foreground">We&apos;ll use this to set an initial calorie target before the adaptive engine takes over.</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: "lose", title: "Cut (Lose Fat)", desc: "Controlled calorie deficit with small safe adjustments.", rate: "-0.5" },
                  { id: "maintain", title: "Maintain", desc: "Keep bodyweight steady while improving consistency.", rate: "0" },
                  { id: "gain", title: "Gain", desc: "Small surplus to support gradual muscle gain.", rate: "0.25" },
                ].map((goal) => (
                  <button
                    type="button"
                    key={goal.id}
                    onClick={() => {
                      setGoalType(goal.id);
                      setGoalRate(goal.rate);
                    }}
                    className={`w-full text-left flex flex-col border rounded-xl p-4 transition-colors ${goalType === goal.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <span className="font-semibold text-base">{goal.title}</span>
                    <span className="text-muted-foreground font-normal mt-1">{goal.desc}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="goal_rate">Goal Rate (kg / week)</Label>
                  <Input id="goal_rate" type="number" step="0.05" value={goalRate} onChange={(e) => setGoalRate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_kcal">Initial Target Calories</Label>
                  <Input id="target_kcal" type="number" value={targetCalories} onChange={(e) => setTargetCalories(e.target.value)} className="h-11" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Indian Portion Calibration</h2>
                <p className="text-muted-foreground text-balance">Set your household defaults so meal logging starts closer to reality.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Standard Katori (Bowl) Size</Label>
                  <Select value={katoriSize} onValueChange={setKatoriSize}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (about 40g cooked baseline)</SelectItem>
                      <SelectItem value="medium">Medium (about 60g cooked baseline)</SelectItem>
                      <SelectItem value="large">Large (about 80g cooked baseline)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Standard Roti / Chapati</Label>
                  <Select value={rotiSize} onValueChange={setRotiSize}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thin">Thin / Phulka</SelectItem>
                      <SelectItem value="medium">Standard Home Roti</SelectItem>
                      <SelectItem value="thick">Thick / Dhaba Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Household Oil Usage Level</Label>
                  <Select value={oilLevel} onValueChange={setOilLevel}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-6 py-6"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Ready to start tracking</h2>
              <p className="text-muted-foreground max-w-sm mx-auto text-balance">
                We&apos;ll save your starting profile, log your first weight if you entered one, and take you straight to the dashboard.
              </p>
              {error && <div className="text-sm text-red-500">{error}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between pt-6 border-t">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isSaving}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={nextStep} className="px-8">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={completeOnboarding} className="px-8 bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}>
              {isSaving ? "Saving..." : "Go to Dashboard"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
