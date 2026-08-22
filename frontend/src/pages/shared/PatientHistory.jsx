import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import ImageModal from "../../components/ImageModal";
import { mockPatientHistory } from "../../mocks/mockData";

export const PatientHistory = () => {
  const [historyData, setHistoryData] = useState(mockPatientHistory);
  const [modalImage, setModalImage] = useState(null);
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [patientVitals, setPatientVitals] = useState({
    bp: "120/80 mmHg",
    hr: "76 bpm",
    spo2: "99%",
    temp: "37.0 °C"
  });

  const { patient, timeline } = historyData;

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex h-screen overflow-hidden">
      {/* SideNavBar */}
      <Sidebar activeSection="history" />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden relative">
        {/* TopAppBar */}
        <header className="bg-surface border-b border-outline-variant h-16 flex justify-between items-center px-margin-mobile md:px-margin-desktop flex-shrink-0">
          <div className="flex items-center space-x-8">
            <h1 className="text-title-md font-headline-lg font-bold text-primary truncate">SmartQueue AI</h1>
            <nav className="hidden md:flex space-x-6 h-full items-center text-label-sm font-label-sm">
              <span className="text-primary border-b-2 border-primary font-bold px-2 py-4">Patient File & History</span>
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <span className="bg-error text-on-error px-3 py-1 rounded font-label-sm text-xs font-semibold hidden sm:flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">warning</span> Emergency Triage
            </span>
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full space-y-6 pb-24 md:pb-8">
          {/* Patient Summary Header */}
          <section className="bg-surface rounded-xl border border-outline-variant p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-title-md font-title-md font-bold shadow-sm">
                MT
              </div>
              <div>
                <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg font-bold text-on-surface">
                  {patient.fullName}
                </h2>
                <div className="flex flex-wrap gap-2 md:gap-4 mt-1 text-body-md text-xs sm:text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">cake</span>
                    {patient.age} yrs (DOB: {patient.dob})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">water_drop</span>
                    {patient.bloodGroup}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">medical_services</span>
                    {patient.primaryDoctor}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingVitals(!isEditingVitals)}
                className="bg-surface text-primary border border-primary px-4 py-2 rounded text-label-sm font-label-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {isEditingVitals ? "Close Vitals" : "Edit Vitals"}
              </button>
              <button
                onClick={() => alert("New clinical entry opened.")}
                className="bg-primary text-on-primary px-4 py-2 rounded text-label-sm font-label-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Entry
              </button>
            </div>
          </section>

          {/* Vitals Quick Edit Panel */}
          {isEditingVitals && (
            <div className="bg-surface-container-low border border-primary/30 rounded-xl p-5 shadow-sm animate-fade-in-up">
              <h3 className="text-label-sm font-label-sm uppercase text-primary font-bold mb-3">Live Clinical Vitals</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-outline block mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={patientVitals.bp}
                    onChange={(e) => setPatientVitals({ ...patientVitals, bp: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-outline block mb-1">Heart Rate</label>
                  <input
                    type="text"
                    value={patientVitals.hr}
                    onChange={(e) => setPatientVitals({ ...patientVitals, hr: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-outline block mb-1">SpO2</label>
                  <input
                    type="text"
                    value={patientVitals.spo2}
                    onChange={(e) => setPatientVitals({ ...patientVitals, spo2: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-outline block mb-1">Body Temperature</label>
                  <input
                    type="text"
                    value={patientVitals.temp}
                    onChange={(e) => setPatientVitals({ ...patientVitals, temp: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Layout Grid: Timeline + Side Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Main Timeline Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-title-md font-title-md text-on-surface font-bold border-b border-outline-variant pb-2">
                Visit History
              </h3>
              <div className="relative pl-4 md:pl-0">
                {/* Vertical Line */}
                <div className="absolute left-[23px] top-4 bottom-0 w-0.5 bg-outline-variant hidden md:block"></div>

                {timeline.map((entry) => (
                  <div key={entry.id} className="relative flex flex-col md:flex-row gap-4 mb-8">
                    {/* Desktop Date Indicator */}
                    <div className="md:w-32 flex-shrink-0 pt-1 text-right hidden md:block">
                      <p className="text-label-sm font-label-sm text-on-surface-variant text-xs">{entry.date}</p>
                      <p className={`text-label-sm font-label-sm font-bold text-xs ${entry.isCritical ? "text-primary" : "text-secondary"}`}>
                        {entry.department}
                      </p>
                    </div>
                    <div
                      className={`absolute left-[-16px] md:left-[17px] top-2 w-3.5 h-3.5 rounded-full border-2 border-surface z-10 hidden md:block ${
                        entry.isCritical ? "bg-primary" : "bg-secondary"
                      }`}
                    ></div>

                    {/* Mobile Date Header */}
                    <div className="md:hidden flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${entry.isCritical ? "bg-primary" : "bg-secondary"}`}></div>
                      <p className="text-label-sm font-label-sm font-bold text-primary text-xs">
                        {entry.date} • {entry.department}
                      </p>
                    </div>

                    {/* Entry Card */}
                    <div className="flex-1 bg-surface border border-outline-variant rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div
                        className={`absolute top-0 right-0 w-1.5 h-full ${
                          entry.isCritical ? "bg-error" : "bg-secondary-fixed-dim"
                        }`}
                      ></div>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-data-display font-data-display text-on-surface text-base font-bold">
                          {entry.conditionTitle}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm font-bold text-xs ${
                            entry.isCritical ? "bg-error-container text-on-error-container" : "bg-surface-container-highest text-on-surface"
                          }`}
                        >
                          AI Priority: {entry.aiPriority}
                          {entry.isCritical && (
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                          )}
                        </span>
                      </div>

                      <div className="bg-surface-container-low p-3 rounded mb-4 text-body-md text-sm text-on-surface-variant">
                        <strong className="text-on-surface font-semibold">Diagnosis: </strong>
                        {entry.diagnosis}
                      </div>

                      {/* Attachments Row */}
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {entry.attachments?.map((att, idx) => (
                          <React.Fragment key={idx}>
                            {att.type === "icon" ? (
                              <div className="w-14 h-14 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-primary transition-colors">
                                <span className="material-symbols-outlined text-secondary">{att.icon}</span>
                              </div>
                            ) : (
                              <div
                                onClick={() => setModalImage(att.thumbnail)}
                                className="relative w-14 h-14 rounded bg-surface-container-high border border-outline-variant flex-shrink-0 cursor-pointer overflow-hidden hover:border-primary group shadow-sm"
                              >
                                <img src={att.thumbnail} alt="Scan" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center bg-inverse-surface/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="material-symbols-outlined text-white text-sm">visibility</span>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Panel Stats (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-title-md font-title-md text-on-surface font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span> Overview
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container-low p-3 rounded-lg text-center border border-outline-variant/60">
                    <p className="text-display-lg font-display-lg text-primary">{patient.totalVisits}</p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant text-xs">Total Visits (3y)</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg text-center border border-outline-variant/60">
                    <p className="text-display-lg font-display-lg text-error">{patient.maxAiRisk}</p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant text-xs">Max AI Risk</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-label-sm font-label-sm text-on-surface-variant text-xs mb-1 font-semibold">
                    Most Frequent Departments
                  </p>
                  {patient.frequentDepartments.map((dept, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-body-md text-xs">
                        <span>{dept.name}</span>
                        <span className="font-bold">{dept.visits} visits</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${i === 0 ? "bg-primary" : "bg-secondary"}`}
                          style={{ width: `${dept.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Trend Sparkline Card */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm bg-pattern relative overflow-hidden">
                <div className="absolute inset-0 bg-[#F0F7FF]/50 z-0"></div>
                <div className="relative z-10">
                  <h3 className="text-title-md font-title-md text-on-surface font-bold mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">timeline</span> AI Risk Trend
                  </h3>
                  <p className="text-label-sm font-label-sm text-on-surface-variant text-xs mb-4">
                    Historical triage score volatility.
                  </p>
                  <div className="h-24 w-full bg-surface-container-lowest rounded border border-outline-variant/40 flex items-end px-3 pt-4 pb-1 gap-2">
                    {patient.trendData.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t group relative transition-all ${
                          item.isCritical ? "bg-error opacity-90" : "bg-primary-fixed-dim hover:bg-primary"
                        }`}
                        style={{ height: `${item.score}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-data-display pointer-events-none">
                          Score: {item.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Lightbox Scan Modal */}
      <ImageModal
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
        imageUrl={modalImage}
        title="Historical Radiology Scan"
      />
    </div>
  );
};

export default PatientHistory;
