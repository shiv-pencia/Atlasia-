import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function generateTripPlan(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
You are an expert travel planner.

Generate a trip itinerary in JSON format based on the following request:
"${prompt}"

Return a JSON object matching this structure:

{
  "day1": [],
  "day2": [],
  "day3": [],
  "estimatedBudget": {},
  "packingList": []
}
`
  });

  return response.text;
}

// Keep compatibility with existing endpoints
export const geminiService = {
  chat: async (destination, history = [], userMessage) => {
    try {
      const contents = [];
      const systemInstruction = `You are Atlasia's premium Travel Copilot. Provide helpful, concise, and engaging travel advice, suggestions, and answers about "${destination}". Answer in human-friendly markdown format (not JSON). Do not output JSON code blocks.`;

      (history || []).forEach(msg => {
        const role = msg.sender === 'user' ? 'user' : 'model';
        contents.push({
          role: role,
          parts: [{ text: msg.text }]
        });
      });

      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction
        }
      });

      return { text: response.text };
    } catch (error) {
      console.error('Error in geminiService.chat:', error);
      return { 
        text: `I'm your travel guide for ${destination || 'your destination'}. (API Preview Mode) You asked: "${userMessage}". Let me know if you need packing tips, hotel suggestions, or custom landmarks to visit!` 
      };
    }
  }
};
