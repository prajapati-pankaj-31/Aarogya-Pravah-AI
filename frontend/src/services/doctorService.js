import apiClient from "./apiClient";
import { mockDoctorPriorityQueue, mockPatientHistory } from "../mocks/mockData";

export const doctorService = {
  getPriorityQueue: async () => {
    try {
      const response = await apiClient.get("/doctor/queue/priority");
      return response.data;
    } catch (error) {
      console.warn("Backend not reached, returning mock doctor priority queue.");
      return { success: true, data: mockDoctorPriorityQueue };
    }
  },

  getPendingQueue: async () => {
    try {
      const response = await apiClient.get("/doctor/queue/pending");
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: mockDoctorPriorityQueue.filter((p) => p.status === "Hold" || p.status === "Pending")
      };
    }
  },

  getPatientDetails: async (patientId) => {
    try {
      const response = await apiClient.get(`/doctor/patients/${patientId}`);
      return response.data;
    } catch (error) {
      return { success: true, data: mockPatientHistory };
    }
  },

  completeAppointment: async (patientId, notes = "") => {
    try {
      const response = await apiClient.post(`/doctor/patients/${patientId}/complete`, { notes });
      return response.data;
    } catch (error) {
      console.warn(`Backend not reached, mock completed appointment: ${patientId}`);
      return {
        success: true,
        message: "Appointment marked complete.",
        patientId
      };
    }
  },

  holdPatientForDoctor: async (patientId, reason = "Awaiting lab reports") => {
    try {
      const response = await apiClient.post(`/doctor/patients/${patientId}/hold`, { reason });
      return response.data;
    } catch (error) {
      console.warn(`Backend not reached, mock moved patient to pending/hold: ${patientId}`);
      return {
        success: true,
        message: "Patient moved to pending queue.",
        patientId,
        reason
      };
    }
  }
};

export default doctorService;
