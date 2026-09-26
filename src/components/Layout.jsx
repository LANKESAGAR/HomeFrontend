import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";
import CurrencyToggle from "./CurrencyToggle";

const navItems = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "/expenses", label: "Expenses", icon: ReceiptIcon },
  { to: "/budget", label: "Budget", icon: PiggyBankIcon },
  { to: "/funding", label: "Funding", icon: FundingIcon },
  { to: "/plans", label: "Plans", icon: PlansIcon },
  { to: "/help", label: "Help", icon: HelpIcon },
];

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReceiptIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" />
    </svg>
  );
}

function PiggyBankIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M4 12a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1a2 2 0 0 1-2 2h-1l-1 3h-2l-.5-2h-4L9 20H7l-.5-2H5a1 1 0 0 1-1-1v-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8V6M9 9h.01" strokeLinecap="round" />
    </svg>
  );
}

function FundingIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6V5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlansIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="16.7" r="0.1" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Layout() {
  const { name, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-sand-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-clay-900 text-sand-100">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-lg font-semibold tracking-tight text-white">🏠 The Lanke Family Home</p>
          <p className="text-xs text-sand-300 mt-0.5">Construction budget tracker</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-terracotta-600 text-white shadow-sm"
                    : "text-sand-200 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-sand-300 mb-2">Show amounts in</p>
          <CurrencyToggle />
          <p className="text-xs text-sand-300 mt-4">Signed in as</p>
          <p className="text-sm font-medium text-white truncate">{name || "User"}</p>
          <button
            onClick={() => setShowChangePassword(true)}
            className="mt-3 w-full text-sm font-medium rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Change Password
          </button>
          <button
            onClick={logout}
            className="mt-2 w-full text-sm font-medium rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Log out
          </button>
          <p className="mt-4 text-[11px] text-sand-400 text-center">v{__APP_VERSION__}</p>
        </div>
      </aside>

      {/* Mobile/tablet top bar */}
      <header className="lg:hidden flex items-center justify-between gap-2 px-4 py-3 bg-clay-900 text-white sticky top-0 z-20 shadow-sm">
        <div className="min-w-0">
          <p className="text-base font-semibold">🏠 The Lanke Family Home</p>
          <p className="text-[11px] text-sand-300 -mt-0.5 truncate">Welcome, {name || "User"}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CurrencyToggle compact />
          <button
            onClick={() => setShowChangePassword(true)}
            className="text-xs font-medium rounded-md px-3 py-2.5 min-h-[40px] bg-white/10 hover:bg-white/20"
          >
            Password
          </button>
          <button
            onClick={logout}
            className="text-xs font-medium rounded-md px-3 py-2.5 min-h-[40px] bg-white/10 hover:bg-white/20"
          >
            Log out
          </button>
        </div>
      </header>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-8 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile/tablet bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-sand-200 grid grid-cols-6 py-1 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 min-h-[48px] rounded-lg text-[11px] sm:text-xs font-medium truncate ${
                isActive ? "text-terracotta-600" : "text-clay-500"
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
