import apiClient from "./apiClient";
import { mockPendingValidationPatients, mockNotifications, mockStaffProfile } from "../mocks/mockData";

export const staffService = {
  getPendingPatients: async () => {
    try {
      const response = await apiClient.get("/staff/pending-patients");
      return response.data;
    } catch (error) {
      console.warn("Backend not reached, returning mock pending validation patients.");
      return { success: true, data: mockPendingValidationPatients };
    }
  },

  validatePatient: async (patientId, payload = {}) => {
    try {
      const response = await apiClient.post(`/staff/patients/${patientId}/validate`, payload);
      return response.data;
    } catch (error) {
      console.warn(`Backend not reached, mock validating patient: ${patientId}`);
      return {
        success: true,
        message: "Patient validated successfully and dispatched to AI Triage Layer.",
        patientId
      };
    }
  },

  rejectPatient: async (patientId, reason = "Incomplete Information") => {
    try {
      const response = await apiClient.post(`/staff/patients/${patientId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.warn(`Backend not reached, mock rejecting patient: ${patientId}`);
      return {
        success: true,
        message: "Patient rejected.",
        patientId,
        reason
      };
    }
  },

  holdPatient: async (patientId, note = "Needs additional clinical lab work") => {
    try {
      const response = await apiClient.post(`/staff/patients/${patientId}/hold`, { note });
      return response.data;
    } catch (error) {
      console.warn(`Backend not reached, mock holding patient: ${patientId}`);
      return {
        success: true,
        message: "Patient placed on temporary hold.",
        patientId,
        note
      };
    }
  },

  getNotifications: async () => {
    try {
      const response = await apiClient.get("/staff/notifications");
      return response.data;
    } catch (error) {
      return { success: true, data: mockNotifications };
    }
  },

  getStaffProfile: async () => {
    try {
      const response = await apiClient.get("/staff/profile");
      return response.data;
    } catch (error) {
      return { success: true, data: mockStaffProfile };
    }
  }
};

export default staffService;
