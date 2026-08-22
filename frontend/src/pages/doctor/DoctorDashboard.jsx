import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import doctorService from "../../services/doctorService";
import socketService from "../../services/socketService";
import useSocket from "../../hooks/useSocket";

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [activeTab, setActiveTab] = useState("priority"); // 'priority' or 'pending'
  const [stats, setStats] = useState({
    waiting: 12,
    critical: 3,
    pending: 4
  });
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState("");

  const fetchQueue = async () => {
    try {
      const res = await doctorService.getPriorityQueue();
      if (res.success && res.data) {
        setQueue(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Real-time socket event listener for AI triage validations & appointments
  useSocket("appointment-validated", () => {
    fetchQueue();
    setActionAlert("New patient validated & added to AI Priority Queue!");
    setTimeout(() => setActionAlert(""), 4000);
  });

  useSocket("priority-updated", () => {
    fetchQueue();
  });

  const handleConsult = (patient) => {
    navigate(`/doctor/patient/${patient.id || patient.tokenNumber}`);
  };

  const handleHold = async (patientId) => {
    try {
      await doctorService.holdPatientForDoctor(patientId, "Moved to pending queue");
      socketService.emit("patient-on-hold", { patientId });
      setQueue((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, status: "Hold" } : p))
      );
      setActionAlert("Patient placed on hold in pending queue.");
      setTimeout(() => setActionAlert(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (patientId) => {
    try {
      await doctorService.completeAppointment(patientId, "Consultation completed");
      socketService.emit("patient-completed", { patientId });
      setQueue((prev) => prev.filter((p) => p.id !== patientId));
      setActionAlert("Patient consultation marked complete.");
      setTimeout(() => setActionAlert(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQueue =
    activeTab === "pending"
      ? queue.filter((p) => p.status === "Hold" || p.status === "Pending")
      : queue.filter((p) => p.status !== "Hold");

  return (
    <div className="antialiased min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <Sidebar activeSection="doctor_queue" />

      {/* Mobile Top Bar */}
      <header className="md:hidden flex justify-between items-center bg-surface border-b border-outline-variant px-margin-mobile py-4 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <span
            className="material-symbols-outlined text-3xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_hospital
          </span>
          <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface">SmartQueue AI</h1>
        </div>
        <Link to="/staff/profile" className="text-on-surface-variant p-1">
          <span className="material-symbols-outlined">account_circle</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-margin-mobile md:p-gutter max-w-container-max mx-auto w-full pb-24 md:pb-8">
        {actionAlert && (
          <div className="mb-4 p-3 bg-primary-container text-on-primary-container rounded-lg text-sm flex items-center justify-between shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              <span>{actionAlert}</span>
            </div>
            <button onClick={() => setActionAlert("")} className="text-on-primary-container">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        <header className="mb-8 hidden md:flex justify-between items-end">
          <div>
            <h2 className="text-display-lg font-display-lg text-on-surface">Doctor Dashboard</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant mt-1">
              Smart Priority Queue - Authenticated Clinical View
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-surface-container-high px-4 py-2 rounded-full flex items-center space-x-2 text-on-surface">
              <span className="material-symbols-outlined text-emerald-500 text-sm animate-ping">circle</span>
              <span className="text-label-sm font-label-sm font-semibold">Live AI Updates</span>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
          <div
            onClick={() => setActiveTab("priority")}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              activeTab === "priority"
                ? "bg-surface border-primary shadow-sm"
                : "bg-surface border-outline-variant hover:border-primary"
            } flex items-center justify-between`}
          >
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant">Waiting Patients</p>
              <p className="text-display-lg font-display-lg text-on-surface mt-1">{queue.length}</p>
            </div>
            <div className="bg-primary-container p-3 rounded-full text-on-primary-container">
              <span className="material-symbols-outlined">groups</span>
            </div>
          </div>

          <div className="bg-error-container p-5 rounded-xl border border-error/20 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-label-sm font-label-sm text-on-error-container">Critical Cases (Score &gt; 80)</p>
              <p className="text-display-lg font-display-lg text-on-error-container mt-1">
                {queue.filter((q) => (q.aiScoreBreakdown?.totalScore || 0) >= 80).length || stats.critical}
              </p>
            </div>
            <div className="bg-error p-3 rounded-full text-on-error">
              <span className="material-symbols-outlined">emergency</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab(activeTab === "pending" ? "priority" : "pending")}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              activeTab === "pending"
                ? "bg-surface border-secondary shadow-sm"
                : "bg-surface border-outline-variant hover:border-secondary"
            } flex items-center justify-between`}
          >
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant">Pending Review / On Hold</p>
              <p className="text-display-lg font-display-lg text-on-surface mt-1">
                {queue.filter((q) => q.status === "Hold").length}
              </p>
            </div>
            <div className="bg-surface-container-highest p-3 rounded-full text-on-surface">
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
          </div>
        </div>

        {/* Priority Queue List */}
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-title-md font-title-md text-on-surface font-semibold">
                {activeTab === "pending" ? "Pending / On-Hold Queue" : "Smart Priority Queue"}
              </h3>
              <span className="text-xs px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed font-bold rounded-full font-label-sm">
                {filteredQueue.length} Active
              </span>
            </div>
            <div className="flex items-center space-x-2 text-label-sm font-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">sort</span>
              <span>Sorted by AI Priority Score</span>
            </div>
          </div>

          <div className="divide-y divide-outline-variant">
            {filteredQueue.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">check_circle</span>
                <p>No patients currently in this queue.</p>
              </div>
            ) : (
              filteredQueue.map((patient) => {
                const totalScore = patient.aiScoreBreakdown?.totalScore || 70;
                const isCritical = totalScore >= 80;
                const isHold = patient.status === "Hold";

                return (
                  <div
                    key={patient.id || patient.tokenNumber}
                    className={`p-6 transition-colors ${
                      isHold
                        ? "bg-surface-container-low/60 opacity-85"
                        : isCritical
                        ? "bg-error-container/10 hover:bg-error-container/20"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Identity & Urgent Chip */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-label-sm font-label-sm font-bold flex items-center gap-1 text-xs ${
                              isHold
                                ? "bg-secondary text-white"
                                : isCritical
                                ? "bg-error text-on-error"
                                : "bg-surface-container-high text-on-surface"
                            }`}
                          >
                            {isHold ? (
                              <>
                                <span className="material-symbols-outlined text-xs">pause</span> ON HOLD
                              </>
                            ) : isCritical ? (
                              <>
                                <span className="material-symbols-outlined text-xs">warning</span> HIGH URGENCY
                              </>
                            ) : (
                              "MEDIUM URGENCY"
                            )}
                          </span>
                          <span className="text-label-sm font-label-sm text-on-surface-variant font-bold">
                            {patient.tokenNumber}
                          </span>
                        </div>
                        <h4 className="text-title-md font-title-md text-on-surface font-semibold">
                          {patient.fullName}, {patient.age}
                        </h4>
                        <p className="text-body-md text-xs text-on-surface-variant mt-0.5">
                          {patient.department} • {patient.waitTimeText}
                        </p>
                      </div>

                      {/* AI Summary & Findings */}
                      <div className="flex-1 bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/60">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="material-symbols-outlined text-primary mt-0.5 text-base">psychology</span>
                            <div>
                              <p className="text-label-sm font-label-sm text-primary text-xs font-semibold mb-0.5">
                                AI Risk Summary (Groq)
                              </p>
                              <p className="text-body-md text-xs text-on-surface">{patient.aiSummary}</p>
                            </div>
                          </div>

                          {patient.xraySummary && (
                            <div className="flex items-start space-x-2 border-t border-outline-variant/40 pt-2">
                              <span className="material-symbols-outlined text-secondary mt-0.5 text-base">
                                radiology
                              </span>
                              <div>
                                <p className="text-label-sm font-label-sm text-secondary text-xs font-semibold mb-0.5">
                                  X-Ray Analysis (PyTorch)
                                </p>
                                <p className="text-body-md text-xs text-on-surface">{patient.xraySummary}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Priority Score Gauge & Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 lg:w-auto w-full mt-4 lg:mt-0">
                        {/* Circular AI Score Gauge */}
                        <div className="tooltip relative flex flex-col items-center cursor-help">
                          <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-outline-variant"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></path>
                              <path
                                className={isCritical ? "text-error" : "text-primary"}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray={`${totalScore}, 100`}
                                strokeWidth="4"
                              ></path>
                            </svg>
                            <div
                              className={`absolute inset-0 flex items-center justify-center text-data-display font-data-display font-bold ${
                                isCritical ? "text-error" : "text-primary"
                              }`}
                            >
                              {totalScore}
                            </div>
                          </div>
                          <span className="text-label-sm font-label-sm text-on-surface-variant text-xs mt-1">
                            AI Score
                          </span>

                          {/* Hover Tooltip Breakdown */}
                          <div className="tooltip-text absolute bottom-full mb-2 w-48 p-3 bg-inverse-surface text-inverse-on-surface text-xs rounded shadow-xl z-20 text-left pointer-events-none font-label-sm">
                            <p>AI Score: {patient.aiScoreBreakdown?.aiScore || 40}</p>
                            <p>Image Score: {patient.aiScoreBreakdown?.imageScore || 0}</p>
                            <p>Severity Wt: {patient.aiScoreBreakdown?.severityWeight || 20}</p>
                            <p>Waiting Time: +{patient.aiScoreBreakdown?.waitTimeBonus || 4}</p>
                            <p className="font-bold border-t border-outline/50 mt-1 pt-1 text-white">
                              Total: {totalScore}/100
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleConsult(patient)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-primary text-on-primary rounded font-medium text-body-md text-sm hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
                          >
                            Consult
                          </button>
                          <button
                            onClick={() => handleHold(patient.id)}
                            className="p-2 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-low transition-colors"
                            title="Hold / Move to Pending"
                          >
                            <span className="material-symbols-outlined text-lg">pause</span>
                          </button>
                          <button
                            onClick={() => handleComplete(patient.id)}
                            className="p-2 border border-outline-variant text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                            title="Mark Complete"
                          >
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-surface border-t border-outline-variant rounded-t-xl shadow-lg">
        <Link to="/doctor/dashboard" className="flex flex-col items-center justify-center text-primary font-bold">
          <span className="material-symbols-outlined">queue</span>
          <span className="text-label-sm font-label-sm text-xs mt-1">Queue</span>
        </Link>
        <Link to="/patient-history" className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">history</span>
          <span className="text-label-sm font-label-sm text-xs mt-1">History</span>
        </Link>
        <Link to="/staff/profile" className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm font-label-sm text-xs mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default DoctorDashboard;
