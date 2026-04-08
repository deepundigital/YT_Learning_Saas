import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { registerUser } from "../services/authService";
import AuthShowcase from "../components/common/AuthShowcase";

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: "Weak", width: "33%", tone: "bg-rose-500" };
  if (score <= 4) return { label: "Medium", width: "66%", tone: "bg-yellow-500" };
  return { label: "Strong", width: "100%", tone: "bg-emerald-500" };
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const passwordsMatch =
    form.confirmPassword.length === 0 || form.password === form.confirmPassword;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim()
    ) {
      return "All fields are required.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    if (!form.agree) {
      return "Please accept the terms to continue.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSuccess("Account created successfully.");
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Registration failed."
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
                <Sparkles className="text-blue-300" />
              </div>

              <h1 className="text-3xl font-black tracking-[-0.03em]">
                Create account
              </h1>

              <p className="mt-2 text-sm text-muted">
                Start your interactive AI learning setup.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>
                <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition focus-within:border-blue-400/30 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                  <User size={18} className="text-muted" />
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full bg-transparent outline-none placeholder:text-[var(--muted-2)]"
                  />
                </div>
              </div>

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
                    placeholder="Create a password"
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

                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-2 rounded-full ${strength.tone}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted">Password strength</span>
                    <span className="text-blue-300">{strength.label}</span>
                  </div>
                </div>

                {capsLock ? (
                  <p className="mt-2 text-xs text-yellow-300">Caps Lock is on.</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Confirm Password
                </label>
                <div
                  className={`glass flex items-center gap-3 rounded-2xl border px-4 py-3 transition focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] ${
                    passwordsMatch
                      ? "border-white/10 focus-within:border-blue-400/30"
                      : "border-rose-500/30"
                  }`}
                >
                  <LockKeyhole size={18} className="text-muted" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full bg-transparent outline-none placeholder:text-[var(--muted-2)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="text-muted transition hover:text-[var(--text)]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {form.confirmPassword && !passwordsMatch ? (
                  <p className="mt-2 text-xs text-rose-300">
                    Passwords do not match.
                  </p>
                ) : form.confirmPassword && passwordsMatch ? (
                  <p className="mt-2 text-xs text-emerald-300">
                    Passwords match.
                  </p>
                ) : null}
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  I agree to create an account and save my learning activity and quiz history.
                </span>
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {success}
                </div>
              ) : null}

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(79,140,255,0.3)] transition disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Register"}
              </motion.button>

              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">
                <ShieldCheck size={14} />
                Session-based auth and account-linked learning flow.
              </div>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.18em] text-muted">
                Continue
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="glass rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/10">
                Google
              </button>
              <button className="glass rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/10">
                Apple
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted">Already registered?</span>
              <Link to="/login" className="text-blue-300 hover:text-blue-200">
                Login here
              </Link>
            </div>
          </div>
        </motion.div>

        <AuthShowcase />
      </div>
    </div>
  );
}