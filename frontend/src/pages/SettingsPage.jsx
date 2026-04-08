import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import ThemeToggle from "../components/common/ThemeToggle";
import Card from "../components/common/Card";
import { logoutUser } from "../services/authService";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const user = useMemo(() => getStoredUser(), []);

  const clearQuizHistory = () => {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("quizAttempts:")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    setMessage("Quiz history cleared successfully.");
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted">
          Theme, local preferences, account details, and session controls.
        </p>
      </div>

      <Card className="flex items-center justify-between gap-4 p-5">
        <div>
          <h3 className="font-semibold">Theme</h3>
          <p className="mt-1 text-sm text-muted">
            Switch between light and dark mode.
          </p>
        </div>
        <ThemeToggle />
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Account</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-muted">Name</p>
            <p className="mt-2 font-medium">{user?.name || "Not available"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-muted">Email</p>
            <p className="mt-2 font-medium">{user?.email || "Not available"}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Local Data</h3>
        <p className="mt-2 text-sm text-muted">
          Clear browser-saved quiz history for this device.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={clearQuizHistory}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:border-rose-500/30"
          >
            Clear Quiz History
          </button>

          {message ? (
            <span className="text-sm text-emerald-300">{message}</span>
          ) : null}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Session</h3>
        <p className="mt-2 text-sm text-muted">
          Log out from the current account on this device.
        </p>

        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:border-amber-500/30"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </Card>
    </div>
  );
}