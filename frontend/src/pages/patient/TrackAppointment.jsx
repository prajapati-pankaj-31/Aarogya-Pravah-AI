import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import appointmentService from "../../services/appointmentService";
import useSocket from "../../hooks/useSocket";

export const TrackAppointment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchToken = async (tokenToQuery) => {
    if (!tokenToQuery.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await appointmentService.getAppointmentByToken(tokenToQuery);
      if (response.success && response.data) {
        setTokenData(response.data);
      } else {
        setError("Token record not found. Please verify the code on your slip.");
      }
    } catch (err) {
      setError("Unable to retrieve queue status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      searchToken(initialToken);
    }
  }, [initialToken]);

  // Real-time socket event listener for queue updates
  useSocket("queue-updated", (updatedQueue) => {
    if (tokenData && initialToken) {
      searchToken(initialToken);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      searchToken(tokenInput.trim());
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto p-margin-mobile md:p-margin-desktop py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-label-sm mb-3">
            <span className="material-symbols-outlined text-base">radar</span>
            Live Hospital Queue Tracker
          </div>
          <h1 className="font-headline-lg text-display-lg text-primary">Track Your Appointment</h1>
          <p className="font-body-lg text-on-surface-variant max-w-lg mx-auto mt-2">
            Enter your token number to view real-time queue position, triage stage, and estimated wait duration.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-3.5 text-outline">search</span>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. TKN-042 or T-098"
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded font-data-display text-on-surface text-lg uppercase focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-on-primary font-title-md px-8 py-3 rounded hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "Searching..." : "Track Token"}
            </button>
          </div>
          {error && <p className="text-error text-sm font-body-md mt-2">{error}</p>}
        </form>

        {/* Live Token Status Card */}
        {tokenData && (
          <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-lg animate-fade-in-up">
            <div className="bg-primary text-on-primary px-6 py-4 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-label-sm opacity-80">Active Patient Token</span>
                <h2 className="font-data-display text-2xl font-bold">{tokenData.tokenNumber}</h2>
              </div>
              <div className="flex items-center gap-2 bg-primary-container px-3 py-1 rounded-full text-xs font-label-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Status</span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                  <p className="text-xs font-label-sm text-secondary uppercase mb-1">Queue Position</p>
                  <p className="font-display-lg text-display-lg text-primary">{tokenData.queuePosition || "#5"}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                  <p className="text-xs font-label-sm text-secondary uppercase mb-1">Estimated Wait</p>
                  <p className="font-display-lg text-display-lg text-on-surface">{tokenData.estimatedWaitTime || "25 min"}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                  <p className="text-xs font-label-sm text-secondary uppercase mb-1">Department</p>
                  <p className="font-title-md text-title-md text-on-surface font-semibold mt-2">{tokenData.department || "Cardiology"}</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="border-t border-outline-variant pt-6">
                <h3 className="text-label-sm font-label-sm uppercase text-secondary mb-4">Triage Progression</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <div>
                      <p className="font-body-md font-semibold text-on-surface">1. Patient Details Intake</p>
                      <p className="text-xs text-on-surface-variant">Completed & Registered</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center animate-pulse">
                      <span className="material-symbols-outlined text-sm">hourglass_top</span>
                    </div>
                    <div>
                      <p className="font-body-md font-semibold text-primary">2. Clinical Staff Validation & AI Triage</p>
                      <p className="text-xs text-on-surface-variant">Current Status: {tokenData.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">stethoscope</span>
                    </div>
                    <div>
                      <p className="font-body-md font-semibold text-on-surface">3. Doctor Consultation</p>
                      <p className="text-xs text-on-surface-variant">Prioritized by AI urgency score</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant">
                <button
                  onClick={() => navigate(`/token/${tokenData.tokenNumber}`)}
                  className="px-6 py-2 bg-primary text-on-primary rounded font-label-sm text-sm hover:bg-on-primary-fixed-variant transition-colors"
                >
                  Open Full Token Card
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrackAppointment;
