"use client";

import { Activity, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type FeedbackItem = {
  id: number;
  message: string;
  status: string;
  created_at: string;
};

export default function UserFeedbackPage() {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    const data = await apiFetch("/feedback/mine");
    setHistory(data.items ?? []);
  };

  useEffect(() => {
    let active = true;

    const loadInitialHistory = async () => {
      try {
        const data = await apiFetch("/feedback/mine");
        if (active) {
          setHistory(data.items ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load feedback.");
        }
      }
    };

    void loadInitialHistory();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;

    try {
      await apiFetch("/feedback/", {
        method: "POST",
        body: JSON.stringify({ message: msg }),
      });
      setSent(true);
      setMsg("");
      await loadHistory();
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send feedback.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <Activity className="w-5 h-5" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Transmit Feedback</h1>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 p-8 shadow-sm max-w-3xl">
        <h2 className="text-lg font-medium text-zinc-900 mb-2">Direct line to Admin</h2>
        <p className="text-sm text-zinc-500 mb-6">Report bugs, request foods, or share product feedback.</p>

        {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

        {sent && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 font-medium">
            Transmission sent successfully. Thank you.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="We're actively monitoring this space..."
              rows={6}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={!msg.trim()} className="bg-[#111] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium hover:bg-black transition-colors flex items-center gap-2">
              <Send className="w-4 h-4" /> Secure Transmit
            </button>
          </div>
        </form>

        <div className="mt-10 border-t border-zinc-100 pt-8">
          <h3 className="text-base font-semibold text-zinc-900 mb-4">Previous Messages</h3>
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-sm text-zinc-500">No feedback submitted yet.</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-zinc-900">{new Date(item.created_at).toLocaleString()}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">{item.status}</span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
