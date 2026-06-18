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
  generateItinerary: async (destination, startDate, endDate, budget) => {
    const durationDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    const budgetText = budget ? `₹${budget.toLocaleString()}` : 'a standard budget';
    
    const prompt = `Create a beautiful, highly detailed day-by-day travel itinerary for a trip to "${destination}".
Duration: ${durationDays} days.
Dates: from ${startDate} to ${endDate}.
Estimated budget: ${budgetText}.
Return ONLY a JSON array of events, each with "time" (e.g. "09:00 AM"), "title", "desc", and "loc". Do not include markdown formatting or backticks around the JSON.`;

    try {
      const resultText = await generateTripPlan(prompt);
      // Clean up potential markdown formatting block from Gemini response
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // 1. If it is already an array, normalize objects and return
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          time: item.time || 'TBA',
          title: item.title || item.activity || 'Activity',
          desc: item.desc || item.description || '',
          loc: item.loc || item.location || ''
        }));
      }

      // 2. If it is an object with day1, day2, etc. keys
      if (parsed && typeof parsed === 'object') {
        const list = [];
        Object.keys(parsed).forEach(key => {
          if (key.toLowerCase().startsWith('day') && Array.isArray(parsed[key])) {
            const dayNum = key.replace(/\D/g, ''); // Extract digits (e.g. 'day1' -> '1')
            parsed[key].forEach((item, index) => {
              if (typeof item === 'string') {
                list.push({
                  time: `Day ${dayNum}`,
                  title: item || 'Explore Spot',
                  desc: 'Suggested activity',
                  loc: destination || 'Sightseeing'
                });
              } else if (item && typeof item === 'object') {
                list.push({
                  time: item.time || `Day ${dayNum} - ${item.time || 'TBA'}`,
                  title: item.title || item.activity || 'Explore Spot',
                  desc: item.desc || item.description || '',
                  loc: item.loc || item.location || destination || ''
                });
              }
            });
          }
        });

        if (list.length > 0) {
          return list;
        }
      }

      return [];
    } catch (error) {
      console.error('Error in generateItinerary parsing/validation:', error);
      return [];
    }
  },

  chat: async (destination, history = [], userMessage) => {
    const systemPrompt = `You are Atlasia's premium Travel Copilot for "${destination}". `;
    const prompt = `${systemPrompt}\nUser says: ${userMessage}`;
    const responseText = await generateTripPlan(prompt);
    return { text: responseText };
  }
};
