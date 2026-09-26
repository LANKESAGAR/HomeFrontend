import { useState } from "react";
import { changePassword } from "../api/auth";
import PasswordInput from "./PasswordInput";

export default function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const data = await changePassword({ currentPassword, newPassword });
      setSuccess(data?.message || "Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.error;
      if (status === 401) {
        setError(serverMessage || "Current password is incorrect.");
      } else if (status === 400) {
        setError(serverMessage || "New password is too short.");
      } else {
        setError("Unable to update your password right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-clay-900/50 px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-sand-200 p-6 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-clay-900">Change Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-clay-500 hover:text-clay-700 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">Current Password</label>
            <PasswordInput
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">New Password</label>
            <PasswordInput
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">Confirm New Password</label>
            <PasswordInput
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full rounded-lg border border-sand-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              placeholder="Re-enter new password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-sand-100 hover:bg-sand-200 text-clay-700 font-medium py-2.5 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
