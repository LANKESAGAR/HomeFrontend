import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as registerRequest } from "../api/auth";
import PasswordInput from "../components/PasswordInput";

export default function Register() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !username || !password || !confirmPassword || !inviteCode) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerRequest({ username, password, name, inviteCode });
      setSession(data);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.error;
      if (status === 403) {
        setError(serverMessage || "Invalid invite code, or the household has reached its account limit.");
      } else if (status === 409) {
        setError(serverMessage || "That username is already taken.");
      } else if (status === 400) {
        setError(serverMessage || "Please check your details and try again.");
      } else {
        setError("Unable to create your account right now. Please try again.");
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
          <p className="mt-1 text-sm text-clay-600">Create an account to join the family's home-building tracker</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Name</label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Password</label>
              <PasswordInput
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                placeholder="Choose a password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Confirm Password</label>
              <PasswordInput
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                placeholder="Re-enter your password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                placeholder="Household invite code"
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-clay-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-terracotta-600 hover:text-terracotta-700">
              Log in
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
