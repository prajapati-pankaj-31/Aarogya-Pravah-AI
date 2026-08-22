import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path) => location.pathname === path;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/track-appointment?token=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-50 w-full">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-16 flex items-center justify-between">
        {/* Brand & Nav */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_hospital
            </span>
            <div className="flex flex-col">
              <span className="text-title-md font-headline-lg font-bold text-primary leading-tight">SmartQueue AI</span>
              <span className="text-[10px] font-label-sm text-secondary -mt-0.5 hidden sm:inline">Clinical Triage Platform</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex space-x-4 h-full items-center">
            <Link
              to="/"
              className={`text-label-sm font-label-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/") ? "text-primary font-bold border-b-2 border-primary bg-surface-container-low" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Patient Portal
            </Link>
            <Link
              to="/triage-queue"
              className={`text-label-sm font-label-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/triage-queue") ? "text-primary font-bold border-b-2 border-primary bg-surface-container-low" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Live Queue
            </Link>
            <Link
              to="/staff/validation"
              className={`text-label-sm font-label-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/staff/validation") || isActive("/staff/dashboard") ? "text-primary font-bold border-b-2 border-primary bg-surface-container-low" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Staff Portal
            </Link>
            <Link
              to="/doctor/dashboard"
              className={`text-label-sm font-label-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/doctor/dashboard") ? "text-primary font-bold border-b-2 border-primary bg-surface-container-low" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Doctor Queue
            </Link>
            <Link
              to="/patient-history"
              className={`text-label-sm font-label-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/patient-history") ? "text-primary font-bold border-b-2 border-primary bg-surface-container-low" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Patient History
            </Link>
            <Link
              to="/ai-insights"
              className={`text-label-sm font-label-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/ai-insights") ? "text-primary font-bold border-b-2 border-primary bg-surface-container-low" : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              AI Insights
            </Link>
          </nav>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-48 xl:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token (TKN-042)..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 pl-8 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all font-body-md"
            />
            <span className="material-symbols-outlined absolute left-2 top-2 text-on-surface-variant text-base">
              search
            </span>
          </form>

          {/* Emergency Triage Badge */}
          <Link
            to="/appointment/new?emergency=true"
            className="text-error bg-error-container hover:bg-error hover:text-on-error px-3 py-1.5 rounded font-label-sm text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span className="hidden sm:inline">Emergency Triage</span>
          </Link>

          {/* User / Auth State */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container-low transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs border border-outline-variant">
                  {user?.role === "doctor" ? "DR" : "ST"}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-surface rounded-lg border border-outline-variant shadow-xl py-2 z-50 animate-fade-in-up">
                  <div className="px-4 py-2 border-b border-outline-variant/60">
                    <p className="font-body-md font-semibold text-on-surface text-sm">{user?.name || user?.email}</p>
                    <p className="font-label-sm text-xs text-secondary capitalize">{user?.role || "Staff"}</p>
                  </div>
                  <Link
                    to="/staff/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body-md text-sm text-on-surface hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">person</span>
                    Profile & Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-body-md text-sm text-error hover:bg-error-container/20 text-left"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-on-primary px-3 py-1.5 rounded font-label-sm text-xs font-medium hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              Staff Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
