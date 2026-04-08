import { useMemo, useState } from "react";
import { Bookmark, Clock3, Plus, Trash2 } from "lucide-react";

function formatTimestamp(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function BookmarksPanel({
  bookmarks = [],
  loading = false,
  onCreateBookmark,
  onDeleteBookmark,
  onSeekToTimestamp,
  onGenerateRevisionFromBookmarks,
  getCurrentTimestamp,
}) {
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [timestampSec, setTimestampSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      if ((a?.timestampSec || 0) !== (b?.timestampSec || 0)) {
        return (a?.timestampSec || 0) - (b?.timestampSec || 0);
      }
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [bookmarks]);

  const useCurrentTime = () => {
    const current = getCurrentTimestamp?.() || 0;
    setTimestampSec(current);
  };

  const handleCreate = async () => {
    if (!label.trim()) return;

    try {
      setSaving(true);
      await onCreateBookmark?.({
        label: label.trim(),
        note: note.trim(),
        timestampSec,
      });

      setLabel("");
      setNote("");
      setTimestampSec(0);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateRevision = async () => {
    try {
      setCreatingRevision(true);
      await onGenerateRevisionFromBookmarks?.();
    } finally {
      setCreatingRevision(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-500/10 p-3">
            <Bookmark size={18} className="text-cyan-300" />
          </div>
          <div>
            <h3 className="font-semibold">Bookmarks</h3>
            <p className="text-sm text-muted">
              Save important moments and jump back instantly.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Bookmark label"
            className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
          />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Short note (optional)"
            className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
          />

          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <button
              type="button"
              onClick={useCurrentTime}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/20"
            >
              <span className="inline-flex items-center gap-2">
                <Clock3 size={14} />
                {formatTimestamp(timestampSec)}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !label.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-70"
            >
              <Plus size={16} />
              {saving ? "Saving..." : "Add Bookmark"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerateRevision}
            disabled={creatingRevision}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:border-white/20 disabled:opacity-70"
          >
            {creatingRevision ? "Creating revision..." : "Create revision from bookmarks"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
            Loading bookmarks...
          </div>
        ) : sortedBookmarks.length ? (
          sortedBookmarks.map((bookmark) => (
            <div
              key={bookmark._id}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onSeekToTimestamp?.(bookmark.timestampSec || 0)}
                      className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
                    >
                      {formatTimestamp(bookmark.timestampSec || 0)}
                    </button>

                    <p className="text-sm font-semibold">{bookmark.label}</p>
                  </div>

                  {bookmark.note ? (
                    <p className="text-sm text-muted whitespace-pre-wrap">
                      {bookmark.note}
                    </p>
                  ) : (
                    <p className="text-sm text-muted">No note added.</p>
                  )}
                </div>

                <button
                  onClick={() => onDeleteBookmark?.(bookmark._id)}
                  className="rounded-xl border border-rose-500/20 p-2 text-rose-300 transition hover:border-rose-500/30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
            No bookmarks yet for this video.
          </div>
        )}
      </div>
    </div>
  );
}