import { io } from "socket.io-client";

let socket = null;
const eventListeners = new Map();

export const socketService = {
  connectSocket: () => {
    if (socket && socket.connected) {
      return socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    try {
      socket = io(socketUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ["websocket", "polling"]
      });

      socket.on("connect", () => {
        console.log("[SmartQueue Socket] Connected to real-time server:", socket.id);
      });

      socket.on("disconnect", (reason) => {
        console.log("[SmartQueue Socket] Disconnected:", reason);
      });

      socket.on("connect_error", (error) => {
        console.warn("[SmartQueue Socket] Connection failed (running in offline/mock mode):", error.message);
      });

      // Register standard broadcast forwarders
      const events = [
        "appointment-created",
        "appointment-validated",
        "appointment-rejected",
        "patient-on-hold",
        "ai-analysis-completed",
        "priority-updated",
        "queue-updated",
        "patient-completed"
      ];

      events.forEach((eventName) => {
        socket.on(eventName, (data) => {
          socketService.triggerLocal(eventName, data);
        });
      });
    } catch (err) {
      console.warn("[SmartQueue Socket] Initialization error:", err);
    }

    return socket;
  },

  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  subscribe: (eventName, callback) => {
    if (!eventListeners.has(eventName)) {
      eventListeners.set(eventName, new Set());
    }
    eventListeners.get(eventName).add(callback);

    // Return cleanup unsubscribe function
    return () => {
      if (eventListeners.has(eventName)) {
        eventListeners.get(eventName).delete(callback);
      }
    };
  },

  triggerLocal: (eventName, data) => {
    if (eventListeners.has(eventName)) {
      eventListeners.get(eventName).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${eventName}:`, e);
        }
      });
    }
  },

  emit: (eventName, data) => {
    if (socket && socket.connected) {
      socket.emit(eventName, data);
    } else {
      // If socket isn't connected to real backend, simulate local event for prototype demonstration
      socketService.triggerLocal(eventName, data);
    }
  }
};

export default socketService;
