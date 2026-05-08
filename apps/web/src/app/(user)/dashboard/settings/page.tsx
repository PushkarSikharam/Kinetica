"use client";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Profile = {
  display_name: string | null;
  biological_sex: string;
  goal_type: string;
  goal_rate_kg_week: number;
  target_calories: number;
  katori_multiplier: number;
  roti_multiplier: number;
  oil_level: string;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/users/me")
      .then((data) => setProfile(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load settings."));
  }, []);

  const handleSave = async () => {
    if (!profile) {
      return;
    }

    try {
      const updated = await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setProfile(updated);
      setStatus("Profile settings updated.");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">System Preferences</h1>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 p-8 shadow-sm max-w-3xl">
        <h2 className="text-lg font-medium text-zinc-900 mb-6">Profile & Volume Settings</h2>

        {error && <div className="text-sm text-red-500 mb-4">{error}</div>}
        {status && <div className="text-sm text-emerald-600 mb-4">{status}</div>}

        {!profile ? (
          <div className="text-sm text-zinc-500">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Display Name</label>
                <input
                  type="text"
                  value={profile.display_name ?? ""}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Target Calories</label>
                <input
                  type="number"
                  value={profile.target_calories}
                  onChange={(e) => setProfile({ ...profile, target_calories: Number(e.target.value) })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Goal Type</label>
                <select
                  value={profile.goal_type}
                  onChange={(e) => setProfile({ ...profile, goal_type: e.target.value })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                >
                  <option value="lose">Lose</option>
                  <option value="maintain">Maintain</option>
                  <option value="gain">Gain</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Biological Sex</label>
                <select
                  value={profile.biological_sex}
                  onChange={(e) => setProfile({ ...profile, biological_sex: e.target.value })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Goal Rate (kg / week)</label>
                <input
                  type="number"
                  step="0.05"
                  value={profile.goal_rate_kg_week}
                  onChange={(e) => setProfile({ ...profile, goal_rate_kg_week: Number(e.target.value) })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Katori Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  value={profile.katori_multiplier}
                  onChange={(e) => setProfile({ ...profile, katori_multiplier: Number(e.target.value) })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Roti Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  value={profile.roti_multiplier}
                  onChange={(e) => setProfile({ ...profile, roti_multiplier: Number(e.target.value) })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Oil Level</label>
                <select
                  value={profile.oil_level}
                  onChange={(e) => setProfile({ ...profile, oil_level: e.target.value })}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900"
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <button onClick={handleSave} className="bg-[#111] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-black transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
