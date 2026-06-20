import axiosInstance from '../services/axios';

export const aiApi = {

  /**
   * Sends a user query to the backend Gemini AI travel copilot chat
   * @param {string} tripId - The current trip ID (used to supply destination context)
   * @param {string} message - User text query
   * @param {Array} history - Previous conversation items [{ sender: 'user'|'bot', text: '...' }]
   * @returns {Promise<Object>} - The AI reply { text: '...' }
   */
  chat: async (tripId, message, history) => {
    const response = await axiosInstance.post('/ai/chat', { tripId, message, history });
    return response.data;
  },

  /**
   * Generates a trip plan from a prompt
   * @param {string} prompt - The generation prompt
   * @returns {Promise<Object>} - The AI generated plan { success: true, data: '...' }
   */
  generateTripPlan: async (prompt) => {
    const response = await axiosInstance.post('/ai/generate', { prompt });
    return response.data;
  }
};

export default aiApi;
