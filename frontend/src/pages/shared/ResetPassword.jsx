import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";

export const ResetPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter a valid hospital email or ID.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await authService.resetPassword(identifier.trim());
      setMessage(res.message || `A password recovery link has been dispatched to ${identifier}.`);
    } catch (err) {
      setError("Unable to dispatch password reset. Please contact IT support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen antialiased flex overflow-hidden bg-background">
      <main className="flex w-full h-screen">
        {/* Left Panel: Branding & Trust */}
        <section className="hidden lg:flex w-1/2 relative bg-surface-container-high flex-col justify-between p-margin-desktop overflow-hidden border-r border-outline-variant">
          <div className="absolute inset-0 z-0">
            <div
              className="bg-cover bg-center w-full h-full opacity-20 mix-blend-multiply"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDTB5SSQ3y9-qct1UlUSZHUg4J9A4gdg3t5hS-L3i56CBJmEkoT1JonTVdHxTM4VxX_8K1DoZGsCgq6OVPvvDULAMgbSd7E2kXjdTJHzPD55NOIyE5157oWZ5U6dDRV17WX5IjjnX6FAmaxxO1odTqS-fymJW26WoAuFB7DNF5H2A3OAyPXb86RWbOhwK5qOxjfibUFF9gYcHJFI8DDz_zJ7ZNACYA1JsRZTPVOjNrNwYi1-SZ3E-MN')"
              }}
            ></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-primary-container text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_hospital
              </span>
              <h1 className="font-display-lg text-display-lg text-primary font-bold tracking-tight">
                City General Hospital
              </h1>
            </div>

            {/* Trust Messaging */}
            <div className="mt-auto max-w-lg mb-12">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-primary-fixed rounded-full border border-primary-fixed-dim">
                <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                <span className="font-label-sm text-label-sm text-primary uppercase">Secure Recovery Portal</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Account Access Protocol</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                For the protection of sensitive patient records and hospital systems, SmartQueue Clinical AI requires verified staff credentials for all password resets. Follow the secure recovery steps to regain access to your clinical dashboard.
              </p>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-2 pt-6 border-t border-outline-variant/30">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">System Online & Secure</span>
            </div>
          </div>
        </section>

        {/* Right Panel: Functional Form */}
        <section className="w-full lg:w-1/2 flex items-center justify-center bg-surface relative z-10">
          <div className="w-full max-w-md px-6 md:px-8 py-12 flex flex-col justify-center h-full">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
              <span
                className="material-symbols-outlined text-primary-container text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_hospital
              </span>
              <span className="font-title-md text-title-md text-primary font-bold">SmartQueue AI</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface mb-2 font-bold">
                Forgot Password
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Enter your credentials to initiate a secure password reset sequence.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded border border-error/20">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 text-xs rounded border border-emerald-300">
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-2 uppercase" htmlFor="identifier">
                  Hospital Email or Staff ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`material-symbols-outlined ${isFocused ? "text-primary" : "text-outline"}`}>
                      badge
                    </span>
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="e.g. staff.name@citygeneral.org"
                    className="clinical-input block w-full pl-10 pr-3 py-3 font-body-md text-body-md text-on-surface"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex justify-center items-center py-3 px-4 font-body-lg text-body-lg font-semibold shadow-sm"
                >
                  {loading ? (
                    "Sending Reset Link..."
                  ) : (
                    <>
                      Send Reset Link
                      <span className="material-symbols-outlined ml-2 text-on-primary text-xl">arrow_forward</span>
                    </>
                  )}
                </button>
                <Link
                  to="/login"
                  className="btn-secondary w-full flex justify-center items-center py-3 px-4 font-body-lg text-body-lg font-semibold"
                >
                  <span className="material-symbols-outlined mr-2 text-xl">arrow_back</span>
                  Back to Login
                </Link>
              </div>
            </form>

            {/* Support Footer */}
            <div className="mt-12 pt-6 border-t border-outline-variant text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Need immediate assistance?{" "}
                <a href="#" className="text-primary hover:text-primary-container font-medium transition-colors">
                  Contact IT Support
                </a>
              </p>
              <p className="font-label-sm text-label-sm text-outline mt-2 uppercase">SmartQueue Clinical AI v2.4.1</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResetPassword;
