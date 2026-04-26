const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

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

app.listen(PORT, () => console.log(`CogniTask Backend running on port ${PORT}`));
