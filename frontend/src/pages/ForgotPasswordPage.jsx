import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { forgotPassword } from "../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setDevResetUrl("");

    try {
      setLoading(true);
      const res = await forgotPassword(email);
      setMessage(res?.message || "Reset link sent.");
      if (res?.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-2xl bg-blue-500/10 p-3">
            <Mail className="text-blue-300" size={18} />
          </div>
          <h1 className="text-2xl font-bold">Forgot password</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your email to receive a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 outline-none"
          />

          {message ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          ) : null}

          {devResetUrl ? (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200 break-all">
              Dev reset link: {devResetUrl}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-3 text-white"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-300">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}