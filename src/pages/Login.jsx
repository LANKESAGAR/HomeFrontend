import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 400) {
        setError("Invalid username or password.");
      } else {
        setError("Unable to sign in right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-3xl">🏠</p>
          <h1 className="mt-2 text-xl font-semibold text-clay-900">The Lanke Family Home</h1>
          <p className="mt-1 text-sm text-clay-600">Log in to track construction expenses</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Password</label>
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-clay-600">
            New to this household?{" "}
            <Link to="/register" className="font-medium text-terracotta-600 hover:text-terracotta-700">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-clay-500">
          Kakinada house build · shared by family
        </p>
      </div>
    </div>
  );
}
