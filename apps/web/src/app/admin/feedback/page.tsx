"use client";

import { MessageSquare, CheckCircle, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type FeedbackItem = {
  id: number;
  user_email: string;
  message: string;
  status: string;
  created_at: string;
};

export default function AdminFeedbackPage() {
  const [activeTab, setActiveTab] = useState("unread");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState("");

  const loadFeedback = async () => {
    const data = await apiFetch("/feedback/admin");
    setFeedbacks(data.items ?? []);
  };

  useEffect(() => {
    let active = true;

    const loadInitialFeedback = async () => {
      try {
        const data = await apiFetch("/feedback/admin");
        if (active) {
          setFeedbacks(data.items ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load feedback.");
        }
      }
    };

    void loadInitialFeedback();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () => feedbacks.filter((item) => activeTab === "all" || item.status === activeTab),
    [activeTab, feedbacks],
  );

  const updateStatus = async (feedbackId: number, status: string) => {
    await apiFetch(`/feedback/admin/${feedbackId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadFeedback();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4 border-b border-zinc-800/50 pb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white leading-none mb-2 mt-2">User Feedback Stream</h1>
          <p className="text-zinc-500">Direct transmission messages from active users.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab("unread")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "unread" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-[#0a0a0a] text-zinc-500 border border-zinc-800 hover:text-zinc-300"}`}>
          Unread
        </button>
        <button onClick={() => setActiveTab("read")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "read" ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-[#0a0a0a] text-zinc-500 border border-zinc-800 hover:text-zinc-300"}`}>
          Processed
        </button>
        <button onClick={() => setActiveTab("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "all" ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-[#0a0a0a] text-zinc-500 border border-zinc-800 hover:text-zinc-300"}`}>
          All Transmissions
        </button>
      </div>

      {error && <div className="text-sm text-red-400 mb-6">{error}</div>}

      <div className="space-y-4 max-w-4xl">
        {filtered.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-zinc-800 p-12 rounded-2xl text-center text-zinc-500">
            No messages in this queue.
          </div>
        ) : filtered.map((item) => (
          <div key={item.id} className="bg-[#0a0a0a] border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm group hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-1">
              <MessageSquare className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2 gap-4">
                <span className="font-medium text-emerald-400 text-sm tracking-wide">{item.user_email}</span>
                <span className="text-xs text-zinc-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-4">{item.message}</p>

              {item.status === "unread" ? (
                <button onClick={() => updateStatus(item.id, "read")} className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1 hover:text-blue-400 transition-colors">
                  <CheckCircle className="w-3 h-3" /> Mark Processed
                </button>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {item.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
