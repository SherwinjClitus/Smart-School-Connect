
import api from "../../../services/api";

const conversationService = {
  // Create a new conversation
  createConversation: async (data) => {
    const response = await api.post("/conversations", data);
    return response.data;
  },

  // Get conversations for logged-in parent or teacher
  getMyConversations: async () => {
    const response = await api.get("/conversations");
    return response.data;
  },

  // Get all messages inside a conversation
  getConversationMessages: async (conversationId) => {
    const response = await api.get(
      `/conversations/${conversationId}/messages`
    );
    return response.data;
  },

  // Send a reply
  sendReply: async (conversationId, content) => {
    const response = await api.post(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },

  // Update conversation status
  updateStatus: async (conversationId, status) => {
    const response = await api.patch(
      `/conversations/${conversationId}/status`,
      { status }
    );
    return response.data;
  },
};

export default conversationService;
