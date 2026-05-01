const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Groq = require('groq-sdk');
const admin = require('firebase-admin');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT not set in environment. Auto-finish won't work.");
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

app.post('/api/email/reminder', async (req, res) => {
  const { email, taskTitle, time } = req.body;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `CogniTask: ${taskTitle} Reminder`,
    text: `Don't forget: ${taskTitle} is scheduled for ${time}. We remember, so you don't have to.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Reminder sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Suggest Endpoint
app.post('/api/ai/suggest', async (req, res) => {
  try {
    const { completedThisWeek, missedThisWeek, topCategory } = req.body;
    
    const prompt = `You are a productivity coach. The user completed ${completedThisWeek} tasks this week, missed ${missedThisWeek}, and their top category is ${topCategory}. Give a single, concise motivational tip (max 2 sentences). No markdown.`;
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
    });

    const tip = chatCompletion.choices[0]?.message?.content || 'Keep pushing forward, you are doing great!';
    res.json({ tip });
  } catch (error) {
    console.error("AI Suggest error:", error);
    res.status(500).json({ tip: 'Focus on the small wins today. Every task completed brings you closer to your goal.' });
  }
});

// AI Recap Endpoint
app.post('/api/ai/recap', async (req, res) => {
  try {
    const { sessions, tasks } = req.body;
    
    const prompt = `Based on the following session data and tasks: ${JSON.stringify(sessions)} and ${JSON.stringify(tasks)}, generate a JSON response with the following keys:
    "summary": A short sentence summarizing the week.
    "strengths": A short phrase praising their strongest habit.
    "goal": A short goal for next week.
    Output ONLY valid JSON.`;
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    // Attempt to parse JSON safely
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    const jsonStr = content.slice(firstBrace, lastBrace + 1);
    
    const result = JSON.parse(jsonStr);
    res.json({
      summary: result.summary || "You had a productive week.",
      strengths: result.strengths || "Consistency",
      goal: result.goal || "Keep up the good work next week."
    });
  } catch (error) {
    console.error("AI Recap error:", error);
    res.status(500).json({
      summary: "You had a productive week.",
      strengths: "Consistency",
      goal: "Keep up the good work next week."
    });
  }
});

// Auto-finish Cron Job (every 15 minutes)
cron.schedule('*/15 * * * *', async () => {
  console.log("Running auto-finish cron job...");
  if (!admin.apps.length) return;

  try {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    
    let autoFinishedCount = 0;
    const now = Date.now();

    for (const userDoc of usersSnapshot.docs) {
      const sessionsRef = userDoc.ref.collection('sessions');
      const activeSessions = await sessionsRef.where('status', '==', 'active').get();
      
      for (const sessionDoc of activeSessions.docs) {
        const session = sessionDoc.data();
        if (!session.startedAt || !session.plannedDuration) continue;
        
        const startedAtMs = session.startedAt.toDate().getTime();
        const durationMs = session.plannedDuration * 60 * 1000;
        
        // If it's older than planned duration
        if (now > startedAtMs + durationMs) {
          const actualDuration = session.plannedDuration; // Assuming they finished the whole time if it auto-finished
          
          await sessionDoc.ref.update({
            status: 'auto-finished',
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
            actualDuration: actualDuration,
            finishType: 'auto',
          });
          
          // Award partial XP (+5) for auto-finish
          const userData = userDoc.data();
          let newXP = (userData.xp || 0) + 5;
          let newLevel = userData.level || 1;
          if (newXP >= 1000) {
            newLevel += Math.floor(newXP / 1000);
            newXP = newXP % 1000;
          }
          await userDoc.ref.update({ xp: newXP, level: newLevel });
          autoFinishedCount++;
        }
      }
    }
    console.log(`Auto-finished ${autoFinishedCount} sessions.`);
  } catch (error) {
    console.error("Auto-finish cron error:", error);
  }
});

app.listen(PORT, () => console.log(\`CogniTask Backend running on port \${PORT}\`));
