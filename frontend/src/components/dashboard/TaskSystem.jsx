import { useState, useEffect } from "react";
import { CheckCircle, Circle, Plus, Trash2 } from "lucide-react";
import Button from "../common/Button";
import {
  getTasks,
  createTask,
  markTaskComplete,
  deleteTask,
} from "../../services/taskService";

export default function TaskSystem({ onTaskCompleted }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getTasks();
      if (res.ok) {
        setTasks(res.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await createTask({ title: newTaskTitle });
      if (res.ok) {
        setTasks([res.task, ...tasks]);
        setNewTaskTitle("");
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleComplete = async (id) => {
    try {
      const res = await markTaskComplete(id);
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t._id === id ? { ...t, completed: true } : t))
        );
        if (onTaskCompleted) {
          onTaskCompleted(); // Notify parent to refresh streak
        }
      }
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteTask(id);
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleCreateTask} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task for today..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
        />
        <Button type="submit" disabled={!newTaskTitle.trim()} className="px-3">
          <Plus size={18} />
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {loading ? (
          <p className="text-sm text-muted">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted">No tasks today. Take a break or add one!</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                task.completed
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => !task.completed && handleComplete(task._id)}
              >
                {task.completed ? (
                  <CheckCircle className="text-emerald-400" size={20} />
                ) : (
                  <Circle className="text-muted hover:text-white transition-colors" size={20} />
                )}
                <span
                  className={`text-sm ${
                    task.completed ? "text-muted line-through" : "text-slate-200"
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <button
                onClick={() => handleDelete(task._id)}
                className="ml-2 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
