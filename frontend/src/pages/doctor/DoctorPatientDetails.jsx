import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import ImageModal from "../../components/ImageModal";
import doctorService from "../../services/doctorService";

export const DoctorPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [consultNotes, setConsultNotes] = useState("");
  const [rxPrescription, setRxPrescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await doctorService.getPatientDetails(patientId);
        if (res.success && res.data) {
          setPatientData(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [patientId]);

  const handleFinishConsult = async () => {
    await doctorService.completeAppointment(patientId, consultNotes);
    setIsCompleted(true);
    setTimeout(() => {
      navigate("/doctor/dashboard");
    }, 1500);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex h-screen overflow-hidden">
      <Sidebar activeSection="doctor_queue" />

      <main className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-surface border-b border-outline-variant h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="text-title-md font-headline-lg font-bold text-on-surface">
              Patient Consultation & Clinical File
            </h1>
          </div>
          <span className="font-data-display text-primary font-bold text-base">ID: {patientId || "PT-9043"}</span>
        </header>

        {isCompleted && (
          <div className="bg-emerald-600 text-white p-3 text-center text-sm font-semibold animate-fade-in-up">
            Consultation notes recorded and appointment finalized. Redirecting to priority queue...
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Card Banner */}
          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xl shadow-sm">
                MT
              </div>
              <div>
                <h2 className="text-headline-lg font-headline-lg text-on-surface text-2xl font-bold">
                  {patientData?.patient?.fullName || "Marcus Thorne"}
                </h2>
                <div className="flex flex-wrap gap-4 text-xs font-body-md text-on-surface-variant mt-1">
                  <span>Age: {patientData?.patient?.age || 42} (DOB: {patientData?.patient?.dob || "12/05/1981"})</span>
                  <span>• Blood: {patientData?.patient?.bloodGroup || "O+"}</span>
                  <span>• Primary Physician: {patientData?.patient?.primaryDoctor || "Dr. Sarah Jenkins"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-label-sm text-secondary uppercase">AI Urgency</span>
                <p className="font-data-display text-2xl font-bold text-error">92/100</p>
              </div>
              <span className="p-3 bg-error-container text-error rounded-xl">
                <span className="material-symbols-outlined text-2xl">emergency</span>
              </span>
            </div>
          </div>

          {/* Grid Layout: History + Prescription Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Clinical Summary & Timeline (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* AI Diagnostic Summary */}
              <div className="bg-surface-container-low border border-primary/20 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-lg">psychology</span>
                  <span>AI Clinical Insights & Image Analysis</span>
                </div>
                <p className="text-body-md text-sm text-on-surface">
                  Patient presented with acute radiating chest discomfort and tachycardia. AI triage engine flagged high myocardial risk. PyTorch image analyzer verified clear bilateral lung fields with minor costochondral inflammation.
                </p>
              </div>

              {/* Visit Timeline */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-title-md text-title-md text-on-surface font-semibold">Prior Hospital Visits</h3>
                {patientData?.timeline?.map((item) => (
                  <div key={item.id} className="border-l-2 border-primary pl-4 py-1 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-primary font-label-sm">{item.date} • {item.department}</span>
                      <span className="font-bold text-error font-data-display">AI Priority: {item.aiPriority}</span>
                    </div>
                    <h4 className="font-body-md font-semibold text-sm text-on-surface">{item.conditionTitle}</h4>
                    <p className="text-xs text-on-surface-variant">{item.diagnosis}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Consultation Actions & Prescription Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  Clinical Notes & Rx
                </h3>

                <div>
                  <label className="block text-xs font-label-sm text-secondary uppercase mb-1">Doctor Observations</label>
                  <textarea
                    rows={4}
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    placeholder="Enter diagnostic assessment, clinical findings, and recommended care plan..."
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-label-sm text-secondary uppercase mb-1">Prescription (Rx)</label>
                  <textarea
                    rows={3}
                    value={rxPrescription}
                    onChange={(e) => setRxPrescription(e.target.value)}
                    placeholder="e.g. Metoprolol 25mg PO BID, Rest, Follow-up in 7 days..."
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => navigate("/doctor/dashboard")}
                    className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded font-label-sm text-sm hover:bg-surface-container-low"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinishConsult}
                    className="flex-1 py-2.5 bg-primary text-on-primary rounded font-label-sm text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Complete Visit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ImageModal
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
        imageUrl={modalImage}
        title="Diagnostic Scan"
      />
    </div>
  );
};

export default DoctorPatientDetails;
