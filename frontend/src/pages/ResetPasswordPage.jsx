import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../services/authService";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(token, password);
      setMessage(res?.message || "Password reset successful");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          Create your new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 outline-none"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 outline-none"
          />

          {message ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {message}
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
            {loading ? "Updating..." : "Reset password"}
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