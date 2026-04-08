import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Plus, Target, Trash2 } from "lucide-react";

export default function GoalsPanel({
  goals = [],
  loading = false,
  youtubeId,
  onCreateGoal,
  onCompleteGoal,
  onDeleteGoal,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [goals]);

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      setSaving(true);
      await onCreateGoal?.({
        title: title.trim(),
        description: description.trim(),
        youtubeIds: youtubeId ? [youtubeId] : [],
        dailyMinutes,
        targetDate: targetDate || null,
      });

      setTitle("");
      setDescription("");
      setDailyMinutes(30);
      setTargetDate("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/10 p-3">
            <Target size={18} className="text-emerald-300" />
          </div>
          <div>
            <h3 className="font-semibold">Study Goals</h3>
            <p className="text-sm text-muted">
              Create daily learning goals and mark them complete.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal title"
            className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Goal description (optional)"
            className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="1"
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Math.max(1, Number(e.target.value) || 30))}
              placeholder="Daily minutes"
              className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
            />

            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !title.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#10b981,#059669)] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-70"
          >
            <Plus size={16} />
            {saving ? "Creating..." : "Create Goal"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
            Loading goals...
          </div>
        ) : sortedGoals.length ? (
          sortedGoals.map((goal) => {
            const completed = goal.status === "completed";

            return (
              <div
                key={goal._id}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{goal.title}</p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          completed
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-white/5 text-muted"
                        }`}
                      >
                        {completed ? "Completed" : "Active"}
                      </span>
                    </div>

                    {goal.description ? (
                      <p className="text-sm text-muted">{goal.description}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-muted">
                        {goal.dailyMinutes || 0} min/day
                      </span>

                      {goal.targetDate ? (
                        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={12} />
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!completed ? (
                      <button
                        onClick={() => onCompleteGoal?.(goal._id)}
                        className="rounded-xl border border-emerald-500/20 p-2 text-emerald-300 transition hover:border-emerald-500/30"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    ) : null}

                    <button
                      onClick={() => onDeleteGoal?.(goal._id)}
                      className="rounded-xl border border-rose-500/20 p-2 text-rose-300 transition hover:border-rose-500/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
            No study goals yet.
          </div>
        )}
      </div>
    </div>
  );
}