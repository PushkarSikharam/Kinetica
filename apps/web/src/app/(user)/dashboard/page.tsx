"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Plus, Search, X, Check, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Food = {
  id: number;
  name: string;
  base_calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

type MealEntry = {
  id: number;
  food: Food;
  date_logged: string;
  meal_type: string;
  quantity: number;
  unit_type: string;
  calculated_calories: number;
  calculated_protein: number;
};

type TodaySummary = {
  date_logged: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
};

type Profile = {
  target_calories: number;
};

type ParsedMeal = {
  food_identified: string;
  quantity: number;
  unit: string;
  confidence: number;
};

const unitOptions = ["grams", "katori", "roti", "pieces"];

export default function Dashboard() {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loggedMeals, setLoggedMeals] = useState<MealEntry[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quantity, setQuantity] = useState("100");
  const [unitType, setUnitType] = useState("grams");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<ParsedMeal | null>(null);
  const [error, setError] = useState("");
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [editQuantity, setEditQuantity] = useState("1");
  const [editUnitType, setEditUnitType] = useState("grams");

  const loadDashboard = async () => {
    const [profileData, summaryData, entryData] = await Promise.all([
      apiFetch("/users/me"),
      apiFetch("/meals/today"),
      apiFetch("/meals/today/entries"),
    ]);

    setProfile(profileData);
    setSummary(summaryData);
    setLoggedMeals(entryData.entries ?? []);
  };

  useEffect(() => {
    loadDashboard().catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard."));
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    if (searchQuery.trim().length < 2 || parsedMeal) {
      setFoods([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const results = await apiFetch(`/foods/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setFoods(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to search foods.");
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isSearchOpen, parsedMeal, searchQuery]);

  const targetKcal = profile?.target_calories ?? 2100;
  const consumedKcal = summary?.total_calories ?? 0;

  const macros = useMemo(
    () => ({
      protein: { target: 140, current: summary?.total_protein ?? 0, color: "bg-blue-500" },
      carbs: { target: 200, current: summary?.total_carbs ?? 0, color: "bg-emerald-500" },
      fats: { target: 65, current: summary?.total_fats ?? 0, color: "bg-purple-500" },
    }),
    [summary],
  );

  const progressPercentage = Math.min((consumedKcal / targetKcal) * 100, 100);

  const resetSearchState = () => {
    setSearchQuery("");
    setFoods([]);
    setParsedMeal(null);
    setQuantity("100");
    setUnitType("grams");
    setError("");
  };

  const handleAddMeal = async (foodId: number, nextQuantity?: number, nextUnitType?: string) => {
    try {
      await apiFetch("/meals/", {
        method: "POST",
        body: JSON.stringify({
          food_id: foodId,
          quantity: nextQuantity ?? Number(quantity),
          unit_type: nextUnitType ?? unitType,
          meal_type: "general",
        }),
      });
      await loadDashboard();
      setIsSearchOpen(false);
      resetSearchState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log meal.");
    }
  };

  const handleParseText = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsParsing(true);
    setError("");

    try {
      const parsed = await apiFetch("/meals/parse-text", {
        method: "POST",
        body: JSON.stringify({ text: searchQuery }),
      });

      if (!parsed.success) {
        throw new Error(parsed.message || "Unable to parse meal.");
      }

      setParsedMeal(parsed);
      setQuantity(String(parsed.quantity));
      setUnitType(parsed.unit);
      const matches = await apiFetch(`/foods/search?q=${encodeURIComponent(parsed.food_identified)}`);
      setFoods(matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to parse meal.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    try {
      await apiFetch(`/meals/${mealId}`, { method: "DELETE" });
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete meal.");
    }
  };

  const openEditor = (meal: MealEntry) => {
    setEditingMeal(meal);
    setEditQuantity(String(meal.quantity));
    setEditUnitType(meal.unit_type);
  };

  const handleUpdateMeal = async () => {
    if (!editingMeal) {
      return;
    }

    try {
      await apiFetch(`/meals/${editingMeal.id}`, {
        method: "PUT",
        body: JSON.stringify({
          quantity: Number(editQuantity),
          unit_type: editUnitType,
          meal_type: editingMeal.meal_type,
        }),
      });
      setEditingMeal(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update meal.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-zinc-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-zinc-200"
            >
              <div className="flex items-center px-4 py-4 border-b border-zinc-100 gap-3">
                <Search className="w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setParsedMeal(null);
                  }}
                  placeholder="Search foods or type a natural sentence..."
                  className="flex-1 outline-none text-zinc-900 text-lg placeholder:text-zinc-400"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    resetSearchState();
                  }}
                  className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-zinc-100 grid grid-cols-1 sm:grid-cols-[1fr_160px_160px_140px] gap-3">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-200 px-3"
                  placeholder="Quantity"
                />
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-200 px-3 bg-white"
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleParseText}
                  className="h-11 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
                >
                  {isParsing ? "Parsing..." : "Parse Text"}
                </button>
                <button
                  onClick={async () => {
                    if (searchQuery.trim().length > 1) {
                      setParsedMeal(null);
                      const results = await apiFetch(`/foods/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setFoods(results);
                    }
                  }}
                  className="h-11 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                >
                  Search
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {parsedMeal && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="font-semibold text-blue-900">{parsedMeal.food_identified}</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Parsed as {parsedMeal.quantity} {parsedMeal.unit} with {Math.round(parsedMeal.confidence * 100)}% confidence.
                    </div>
                  </div>
                )}

                {error && <div className="text-sm text-red-500">{error}</div>}

                {foods.length === 0 ? (
                  <div className="text-center text-zinc-500 py-10">
                    Search the food database or parse a natural sentence to get started.
                  </div>
                ) : (
                  foods.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddMeal(item.id)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-zinc-100 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div>
                        <div className="font-semibold text-zinc-900">{item.name}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {item.base_calories} kcal / 100g • {item.protein_g}g P • {item.carbs_g}g C • {item.fats_g}g F
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">Edit {editingMeal.food.name}</h2>
              <div className="space-y-4">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full h-11 rounded-xl border border-zinc-200 px-3"
                />
                <select
                  value={editUnitType}
                  onChange={(e) => setEditUnitType(e.target.value)}
                  className="w-full h-11 rounded-xl border border-zinc-200 px-3 bg-white"
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingMeal(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMeal}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 leading-none mb-2">Today&apos;s Protocol</h1>
          <p className="text-zinc-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="h-12 bg-[#111] hover:bg-black text-white px-6 rounded-xl flex items-center justify-center font-medium transition-all shadow-md active:scale-95 group shrink-0 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-white transition-colors" />
          Log Meal
        </button>
      </div>

      {error && <div className="mb-6 text-sm text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-zinc-500 font-medium flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Energy Expenditure
            </h2>
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Live</span>
          </div>

          <div className="flex items-baseline gap-2 mb-4 relative z-10">
            <span className="text-6xl font-medium tracking-tighter text-zinc-900">{Math.max(targetKcal - consumedKcal, 0).toFixed(0)}</span>
            <span className="text-xl font-medium text-zinc-400 tracking-tight">kcal remaining</span>
          </div>

          <div className="relative z-10 mt-2">
            <div className="flex justify-between text-sm font-medium text-zinc-500 mb-3">
              <span>{consumedKcal.toFixed(0)} consumed</span>
              <span>{targetKcal.toFixed(0)} baseline</span>
            </div>
            <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.2, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-[#111] to-zinc-600 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <h2 className="text-zinc-500 font-medium mb-6">Macronutrient Split</h2>
          <div className="space-y-6">
            {Object.entries(macros).map(([key, macro]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="capitalize font-medium text-zinc-800">{key}</span>
                  <span className="text-zinc-500">
                    <strong className="text-zinc-900">{macro.current.toFixed(0)}g</strong> / {macro.target}g
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full ${macro.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-zinc-900">Today&apos;s Log</h2>
          <span className="text-sm text-zinc-500">{loggedMeals.length} meals</span>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {loggedMeals.map((meal) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.95, overflow: "hidden" }}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border border-zinc-200 rounded-lg shadow-sm flex items-center justify-center font-semibold text-zinc-400">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{meal.food.name}</h3>
                    <p className="text-sm text-zinc-500 font-medium mt-0.5">
                      {meal.quantity} {meal.unit_type} • {meal.meal_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-lg text-zinc-900">
                      {meal.calculated_calories.toFixed(0)} <span className="text-xs font-medium text-zinc-500">kcal</span>
                    </div>
                    <div className="text-xs font-medium text-zinc-500 mt-1">{meal.calculated_protein.toFixed(1)}g protein</div>
                  </div>
                  <button onClick={() => openEditor(meal)} className="text-zinc-500 hover:text-zinc-900">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteMeal(meal.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loggedMeals.length === 0 && (
            <div className="text-center py-8 text-zinc-400 font-medium text-sm">
              Your log is empty today. Add your first meal to start the adaptive tracking loop.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
