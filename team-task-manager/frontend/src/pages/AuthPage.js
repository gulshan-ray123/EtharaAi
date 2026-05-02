import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/* =========================
   Reusable Input Field
========================= */
const Field = ({
  label,
  type = "text",
  name,
  placeholder,
  form,
  setForm,
  errors,
  setErrors,
}) => (
  <div>
    <label className="block text-sm text-surface-200/70 mb-1.5 font-medium">
      {label}
    </label>

    <input
      type={type}
      value={form[name]}
      onChange={(e) => {
        setForm((f) => ({ ...f, [name]: e.target.value }));
        setErrors((er) => ({ ...er, [name]: "" }));
      }}
      placeholder={placeholder}
      className={`w-full bg-white/5 border ${
        errors[name] ? "border-red-500" : "border-white/10"
      } rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors`}
    />

    {errors[name] && (
      <p className="text-red-400 text-xs mt-1">{errors[name]}</p>
    )}
  </div>
);

/* =========================
   Auth Page
========================= */
const AuthPage = () => {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });

  const [errors, setErrors] = useState({});

  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  /* =========================
     Validation
  ========================= */
  const validate = () => {
    const errs = {};

    if (mode === "signup" && !form.name.trim()) {
      errs.name = "Name is required";
    }

    if (!form.email.match(/^\S+@\S+\.\S+$/)) {
      errs.email = "Valid email required";
    }

    if (form.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* =========================
     Submit Handler
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back!");
      } else {
        await signup(form.name, form.email, form.password, form.role);
        toast.success("Account created!");
      }

      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 font-sans">
      {/* Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="text-white text-2xl font-semibold">TaskFlow</h1>
          <p className="text-surface-200/50 text-sm mt-1">
            {mode === "login"
              ? "Sign in to your workspace"
              : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-900 border border-white/5 rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setErrors({});
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                  mode === m
                    ? "bg-brand-600 text-white"
                    : "text-surface-200/50 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label="Full Name"
                name="name"
                placeholder="John Doe"
                form={form}
                setForm={setForm}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            <Field
              label="Email"
              type="email"
              name="email"
              placeholder="you@company.com"
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
            />

            <Field
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
            />

            {/* Role */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm text-surface-200/70 mb-1.5 font-medium">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;