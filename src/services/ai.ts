import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your preferred Env loader or keep in .env
// For now, removing the hardcoded key to unblock GIT PUSH
const GROQ_API_KEY = ''; 

export const AIService = {
  getDailyTip: async (): Promise<string> => {
    try {
      // Check cache first
      const cached = await AsyncStorage.getItem('DAILY_TIP');
      const lastFetch = await AsyncStorage.getItem('DAILY_TIP_DATE');
      const today = new Date().toISOString().split('T')[0];

      if (cached && lastFetch === today) {
        return cached;
      }

      // Fetch from Groq via proxy (or direct if allowed)
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are CogniTask AI. Provide a concise, motivational productivity tip for today (max 20 words)." },
          { role: "user", content: "Give me a tip." }
        ]
      }, {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
      });

      const tip = response.data.choices[0].message.content;
      
      // Cache it
      await AsyncStorage.setItem('DAILY_TIP', tip);
      await AsyncStorage.setItem('DAILY_TIP_DATE', today);

      return tip;
    } catch (error) {
      console.error('AI Service Error:', error);
      return "Focus on the small wins today. Every task completed brings you closer to your goal.";
    }
  }
};
