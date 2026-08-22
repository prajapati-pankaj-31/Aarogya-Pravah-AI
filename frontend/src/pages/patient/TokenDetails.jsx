import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import appointmentService from "../../services/appointmentService";
import useSocket from "../../hooks/useSocket";

export const TokenDetails = () => {
  const { tokenNumber } = useParams();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    if (!tokenNumber) return;
    try {
      const response = await appointmentService.getAppointmentByToken(tokenNumber);
      if (response.success && response.data) {
        setTokenData(response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [tokenNumber]);

  useSocket("queue-updated", () => {
    fetchDetails();
  });

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto p-margin-mobile md:p-margin-desktop py-12">
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-xl">
          {/* Header Ticket Banner */}
          <div className="bg-primary text-on-primary p-8 text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-label-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Queue Ticket
            </div>
            <p className="font-label-sm text-xs uppercase tracking-widest opacity-80 mb-2">City General Hospital</p>
            <h1 className="font-data-display text-4xl sm:text-5xl font-bold tracking-tight mb-2">
              {tokenNumber || "TKN-042"}
            </h1>
            <p className="font-body-md text-sm opacity-90">
              Department: <span className="font-semibold">{tokenData?.department || "Cardiology"}</span>
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b border-outline-variant pb-6">
              <div>
                <p className="text-xs font-label-sm text-secondary uppercase">Estimated Wait</p>
                <p className="font-display-lg text-display-lg text-primary">{tokenData?.estimatedWaitTime || "35 min"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-label-sm text-secondary uppercase">Queue Position</p>
                <p className="font-display-lg text-display-lg text-on-surface">{tokenData?.queuePosition || "#6"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-label-sm text-secondary uppercase mb-2">Triage Status</p>
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl animate-spin">
                  sync
                </span>
                <div>
                  <p className="font-body-md font-semibold text-on-surface">
                    {tokenData?.status || "Waiting for Triage Validation"}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Please remain seated in the waiting area. You will be alerted when called.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary-container/40 p-4 rounded-lg text-xs font-body-md text-on-secondary-container">
              <p className="font-semibold mb-1">Notice for Emergency Patients:</p>
              <p>
                If your condition worsens rapidly (severe pain, sudden dizziness, breathing difficulty), please notify the front desk immediately.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-outline-variant">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded font-label-sm text-sm hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Print Slip
              </button>
              <Link
                to="/"
                className="flex-1 py-2.5 bg-primary text-on-primary rounded font-label-sm text-sm hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2 text-center"
              >
                <span className="material-symbols-outlined text-base">home</span>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TokenDetails;
