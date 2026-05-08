"use client";

import { Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type MealEntry = {
  id: number;
  food: {
    name: string;
  };
  date_logged: string;
  meal_type: string;
  quantity: number;
  unit_type: string;
  calculated_calories: number;
  calculated_protein: number;
};

export default function MealLogPage() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/meals/history")
      .then((data) => setMeals(data.entries ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load meal history."));
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <Utensils className="w-5 h-5" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Meal History</h1>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 p-8 shadow-sm">
        {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

        {meals.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No historical meal data yet. Once you log meals on the dashboard, they&apos;ll appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {meals.map((meal) => (
              <div key={meal.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-zinc-900">{meal.food.name}</div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {new Date(meal.date_logged).toLocaleDateString()} • {meal.quantity} {meal.unit_type} • {meal.meal_type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-zinc-900">{meal.calculated_calories.toFixed(0)} kcal</div>
                  <div className="text-sm text-zinc-500">{meal.calculated_protein.toFixed(1)}g protein</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
