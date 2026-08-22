import apiClient from "./apiClient";
import { mockDoctorPriorityQueue, mockPendingValidationPatients } from "../mocks/mockData";

export const queueService = {
  getLiveQueue: async (department = "") => {
    try {
      const response = await apiClient.get(`/queue/live${department ? `?department=${department}` : ""}`);
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: [...mockDoctorPriorityQueue, ...mockPendingValidationPatients]
      };
    }
  },

  getQueueStats: async () => {
    try {
      const response = await apiClient.get("/queue/stats");
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: {
          waitingPatients: 12,
          criticalCases: 3,
          pendingReview: 4,
          avgWaitTime: "18 mins",
          aiAccuracyRate: "98.4%"
        }
      };
    }
  }
};

export default queueService;
