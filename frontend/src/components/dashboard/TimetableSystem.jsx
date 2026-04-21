import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "../common/Button";
import {
  getTimetable,
  createTimetableEntry,
  deleteTimetableEntry,
} from "../../services/timetableService";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TimetableSystem() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newDay, setNewDay] = useState(1); // Default to Monday
  const [newSubject, setNewSubject] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await getTimetable();
      if (res.ok) {
        setEntries(res.timetable || []);
      }
    } catch (err) {
      console.error("Failed to fetch timetable", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      const res = await createTimetableEntry({
        dayOfWeek: newDay,
        subject: newSubject,
        startTime: newStart,
        endTime: newEnd,
      });
      if (res.ok) {
        setEntries([...entries, res.entry].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
        setShowAdd(false);
        setNewSubject("");
      }
    } catch (err) {
      console.error("Failed to add timetable entry", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteTimetableEntry(id);
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete entry", err);
    }
  };

  const todayIndex = new Date().getDay();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold">Weekly Schedule</h4>
        <Button variant="secondary" onClick={() => setShowAdd(!showAdd)} className="px-3 py-1 text-xs">
          {showAdd ? "Cancel" : "Add Entry"}
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className="rounded-lg bg-slate-800 px-2 py-1.5 outline-none"
            >
              {DAYS.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="rounded-lg bg-slate-800 px-2 py-1.5 outline-none"
              required
            />
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="rounded-lg bg-slate-800 px-2 py-1.5 outline-none"
              required
            />
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="rounded-lg bg-slate-800 px-2 py-1.5 outline-none"
              required
            />
          </div>
          <Button type="submit" className="w-full py-1.5 text-xs">Add to Timetable</Button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-muted">Loading schedule...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted">No schedule set. Add classes or study blocks.</p>
        ) : (
          <div className="space-y-4">
            {DAYS.map((dayName, dayIndex) => {
              const dayEntries = entries.filter((e) => e.dayOfWeek === dayIndex);
              if (dayEntries.length === 0) return null;

              const isToday = dayIndex === todayIndex;

              return (
                <div key={dayIndex}>
                  <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${isToday ? "text-blue-400" : "text-slate-400"}`}>
                    {dayName} {isToday && "(Today)"}
                  </p>
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry._id}
                        className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 transition-colors hover:border-white/10"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-200">{entry.subject}</p>
                          <p className="text-xs text-muted">
                            {entry.startTime} - {entry.endTime}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
