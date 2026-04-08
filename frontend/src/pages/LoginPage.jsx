import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser, googleLoginUser } from "../services/authService";
import AuthShowcase from "../components/common/AuthShowcase";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      await loginUser({
        email: form.email,
        password: form.password,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      setLoading(true);

      await googleLoginUser(credentialResponse.credential);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Google login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto grid max-w-7xl items-center gap-6 xl:min-h-[calc(100vh-3rem)] xl:grid-cols-[0.92fr_1.08fr]">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-center"
        >
          <div className="glass premium-border w-full max-w-[480px] rounded-[2rem] p-7 md:p-8">
            <div className="mb-8">
              <div className="mb-4 inline-flex rounded-2xl bg-blue-500/10 p-3">
                <LogIn className="text-blue-300" />
              </div>

              <h1 className="text-3xl font-black tracking-[-0.03em]">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-muted">
                Continue your AI-powered learning journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition focus-within:border-blue-400/30 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                  <Mail size={18} className="text-muted" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full bg-transparent outline-none placeholder:text-[var(--muted-2)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Password</label>
                <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition focus-within:border-blue-400/30 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                  <LockKeyhole size={18} className="text-muted" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    placeholder="Enter your password"
                    className="w-full bg-transparent outline-none placeholder:text-[var(--muted-2)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted transition hover:text-[var(--text)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {capsLock ? (
                  <p className="mt-2 text-xs text-yellow-300">Caps Lock is on.</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={handleChange}
                  />
                  Remember session
                </label>

                <Link
                  to="/forgot-password"
                  className="text-blue-300 transition hover:text-blue-200"
                >
                  Forgot password
                </Link>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(79,140,255,0.3)] transition disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </motion.button>

              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">
                <ShieldCheck size={14} />
                Secure account access with saved learning history.
              </div>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.18em] text-muted">
                Continue
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid gap-3">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login failed.")}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="continue_with"
                />
              </div>

              <button
                type="button"
                disabled
                className="glass rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium opacity-60"
              >
                Apple (coming soon)
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted">New here?</span>
              <Link to="/register" className="text-blue-300 hover:text-blue-200">
                Create account
              </Link>
            </div>
          </div>
        </motion.div>

        <AuthShowcase />
      </div>
    </div>
  );
}