const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Groq AI Integration
app.post('/api/ai/tip', async (req, res) => {
  const { groqApiKey } = req.body;
  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are CogniTask AI. Provide a concise, motivational productivity tip for today (max 20 words)." },
        { role: "user", content: "Give me a tip." }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' }
    });
    res.json({ tip: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

app.post('/api/email/reminder', async (req, res) => {
  const { email, taskTitle, time } = req.body;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `CogniTask: ${taskTitle} Reminder`,
    text: `Don't forget: ${taskTitle} is scheduled for ${time}. We remember, so you don't have to.`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Reminder sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`CogniTask Backend running on port ${PORT}`));
