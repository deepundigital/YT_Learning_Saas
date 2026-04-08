import { useState } from "react";
import Button from "../common/Button";

export default function TranscriptPanel({
  transcript,
  transcriptStatus,
  onImportTranscript,
  onFetchTranscript,
  loading,
}) {
  const [rawText, setRawText] = useState("");

  const handleImport = async () => {
    if (!rawText.trim()) return;
    await onImportTranscript(rawText);
    setRawText("");
  };

  return (
    <div className="glass rounded-3xl p-5 shadow-2xl">
      <h3 className="text-lg font-semibold">Transcript</h3>
      <p className="mt-2 text-sm text-muted">
        Auto fetch failed? Paste transcript manually and improve AI results.
      </p>

      <div className="mt-4">
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs">
          Status: {transcriptStatus}
        </span>
      </div>

      {transcript ? (
        <div className="mt-4 rounded-2xl border border-white/10 p-4">
          <p className="mb-2 text-sm font-medium">Saved Transcript Preview</p>
          <p className="max-h-40 overflow-auto text-sm text-muted">
            {transcript.rawText}
          </p>
        </div>
      ) : null}

      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        className="mt-4 min-h-[180px] w-full rounded-2xl border border-white/10 bg-transparent p-4 outline-none"
        placeholder="Paste transcript here..."
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={handleImport} disabled={loading}>
          {loading ? "Importing..." : "Import Transcript"}
        </Button>

        <Button variant="secondary" onClick={onFetchTranscript} disabled={loading}>
          {loading ? "Checking..." : "Auto Fetch"}
        </Button>
      </div>
    </div>
  );
}