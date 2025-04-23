const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

app.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Failed to send email.');
    }
    console.log('Email sent:', info.response);
    res.status(200).send('Email sent successfully.');
  });
});

app.post('/send-reminder', (req, res) => {
  const { to, meetingDate } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Reminder: Upcoming LTI Meeting on ${meetingDate}`,
    text: `Reminder: The LTI Meeting is scheduled for ${meetingDate}. Please ensure PermitVision isolations are updated.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending reminder:', error);
      return res.status(500).send('Failed to send reminder.');
    }
    console.log('Reminder sent:', info.response);
    res.status(200).send('Reminder email sent successfully.');
  });
});

app.listen(PORT, () => {
  console.log(`Meeting backend server running on port ${PORT}`);
});
