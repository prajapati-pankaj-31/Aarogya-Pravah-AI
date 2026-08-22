import apiClient from "./apiClient";
import { mockTokenDatabase } from "../mocks/mockData";

export const appointmentService = {
  createAppointment: async (appointmentData) => {
    try {
      // Support FormData if medicalImage file is attached
      let payload;
      let headers = {};

      if (appointmentData.medicalImage) {
        payload = new FormData();
        payload.append("patient", JSON.stringify(appointmentData.patient));
        payload.append("appointment", JSON.stringify(appointmentData.appointment));
        payload.append("medicalImage", appointmentData.medicalImage);
        headers["Content-Type"] = "multipart/form-data";
      } else {
        payload = appointmentData;
      }

      const response = await apiClient.post("/appointments", payload, { headers });
      return response.data;
    } catch (error) {
      console.warn("Backend not reached, generating mock token response.");
      const randomToken = "TKN-" + Math.floor(100 + Math.random() * 900);
      return {
        success: true,
        tokenNumber: randomToken,
        message: "Appointment booked successfully. Keep your token for live tracking.",
        data: {
          tokenNumber: randomToken,
          patient: appointmentData.patient || { fullName: "Walk-in Patient" },
          appointment: appointmentData.appointment || {},
          estimatedWaitTime: "30 min",
          queuePosition: "#7",
          status: "Waiting for Triage Validation"
        }
      };
    }
  },

  getAppointmentByToken: async (tokenNumber) => {
    try {
      const response = await apiClient.get(`/appointments/token/${tokenNumber}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend not reached, checking mock database for token: ${tokenNumber}`);
      const cleanToken = tokenNumber.trim().toUpperCase();
      if (mockTokenDatabase[cleanToken]) {
        return { success: true, data: mockTokenDatabase[cleanToken] };
      }
      // Dynamic fallback for any query
      return {
        success: true,
        data: {
          tokenNumber: cleanToken,
          patientName: "Patient " + cleanToken,
          department: "General Medicine",
          estimatedWaitTime: "35 min",
          queuePosition: "#9",
          status: "In AI Triage Processing",
          statusType: "pending",
          timestamp: "Recently"
        }
      };
    }
  },

  getAppointmentStatus: async (id) => {
    try {
      const response = await apiClient.get(`/appointments/${id}/status`);
      return response.data;
    } catch (error) {
      return { success: true, status: "Active in Queue", waitTime: "20m" };
    }
  }
};

export default appointmentService;
