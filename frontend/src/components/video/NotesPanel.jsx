import { useMemo, useState } from "react";
import {
  Clock3,
  FileText,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

function formatTimestamp(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NotesPanel({
  notes = [],
  loading = false,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  getCurrentTimestamp,
  onGenerateRevisionFromNotes,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [timestampSec, setTimestampSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editTimestampSec, setEditTimestampSec] = useState(0);
  const [updating, setUpdating] = useState(false);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if ((a?.timestampSec || 0) !== (b?.timestampSec || 0)) {
        return (a?.timestampSec || 0) - (b?.timestampSec || 0);
      }
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [notes]);

  const handleUseCurrentTime = () => {
    const current = getCurrentTimestamp?.() || 0;
    setTimestampSec(current);
  };

  const handleCreate = async () => {
    if (!content.trim()) return;

    try {
      setSaving(true);
      await onCreateNote?.({
        title: title.trim(),
        content: content.trim(),
        timestampSec,
        tags: parseTags(tagsInput),
      });

      setTitle("");
      setContent("");
      setTagsInput("");
      setTimestampSec(0);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateRevision = async () => {
    try {
      setCreatingRevision(true);
      await onGenerateRevisionFromNotes?.();
    } finally {
      setCreatingRevision(false);
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
    setEditTagsInput(Array.isArray(note.tags) ? note.tags.join(", ") : "");
    setEditTimestampSec(note.timestampSec || 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTagsInput("");
    setEditTimestampSec(0);
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    try {
      setUpdating(true);
      await onUpdateNote?.(editingId, {
        title: editTitle.trim(),
        content: editContent.trim(),
        timestampSec: editTimestampSec,
        tags: parseTags(editTagsInput),
      });
      cancelEdit();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-500/10 p-3">
            <FileText size={18} className="text-blue-300" />
          </div>
          <div>
            <h3 className="font-semibold">Notes</h3>
            <p className="text-sm text-muted">
              Timestamp-based learning notes for this video.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title (optional)"
            className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
          />

          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Tags: xss, auth, revision"
              className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
            />

            <button
              type="button"
              onClick={handleUseCurrentTime}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm transition hover:border-white/20"
            >
              <span className="inline-flex items-center gap-2">
                <Clock3 size={14} />
                {formatTimestamp(timestampSec)}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !content.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-70"
          >
            <Plus size={16} />
            {saving ? "Saving..." : "Add Note"}
          </button>

          <button
            type="button"
            onClick={handleGenerateRevision}
            disabled={creatingRevision}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:border-white/20 disabled:opacity-70"
          >
            {creatingRevision ? "Creating revision..." : "Create revision from notes"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
            Loading notes...
          </div>
        ) : sortedNotes.length ? (
          sortedNotes.map((note) => {
            const isEditing = editingId === note._id;

            return (
              <div
                key={note._id}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note title"
                      className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                    />

                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                    />

                    <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                      <input
                        value={editTagsInput}
                        onChange={(e) => setEditTagsInput(e.target.value)}
                        placeholder="Tags"
                        className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                      />

                      <input
                        type="number"
                        min="0"
                        value={editTimestampSec}
                        onChange={(e) =>
                          setEditTimestampSec(Number(e.target.value) || 0)
                        }
                        className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={updating || !editContent.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition"
                      >
                        <Save size={14} />
                        {updating ? "Saving..." : "Save"}
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:border-white/20"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                          {formatTimestamp(note.timestampSec || 0)}
                        </span>

                        {note.title ? (
                          <span className="text-sm font-semibold">{note.title}</span>
                        ) : null}
                      </div>

                      <p className="whitespace-pre-wrap text-sm text-muted">
                        {note.content}
                      </p>

                      {Array.isArray(note.tags) && note.tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {note.tags.map((tag) => (
                            <span
                              key={`${note._id}-${tag}`}
                              className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-muted"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="rounded-xl border border-white/10 p-2 transition hover:border-white/20"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => onDeleteNote?.(note._id)}
                        className="rounded-xl border border-rose-500/20 p-2 text-rose-300 transition hover:border-rose-500/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
            No notes yet for this video.
          </div>
        )}
      </div>
    </div>
  );
}