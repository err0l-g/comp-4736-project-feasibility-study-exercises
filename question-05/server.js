const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8005;

// Initialize Twilio and Google Speech clients
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const googleClient = new speech.SpeechClient({
  keyFilename: path.join(__dirname, 'credentials.json'),
});

const upload = multer({ dest: 'uploads/' }); 

// Limits each IP to 10 requests per 15-minute window
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Question 5: Twilio SMS API

app.get('/comp-4537/project-exercises/question_five', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'question_five.html'));
});

app.post('/comp-4537/project-exercises/question_five', apiLimiter, (req, res) => {
  const { phone, message } = req.body;

  twilioClient.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })
    .then((message) => res.send(`Message sent! ID: ${message.sid}`))
    .catch((error) => res.status(500).send(`Error: ${error.message}`));
});

// Question 6: Voice Recognition API 

app.get('/comp-4537/project-exercises/question_six', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'question_six.html'));
});

app.post('/comp-4537/project-exercises/question_six/transcribe', apiLimiter, upload.single('audio'), async (req, res) => {
  if (!req.file) {
      return res.status(400).send('No audio file uploaded.');
  }

  const audioFile = req.file.path;

  try {
      const audioBytes = fs.readFileSync(audioFile).toString('base64');

      const request = {
        audio: { content: audioBytes },
        config: {
          encoding: 'WEBM_OPUS', 
          sampleRateHertz: 48000, 
          languageCode: 'en-US',
        },
      };

      const apiResponse = await googleClient.recognize(request);
      
      const results = Array.isArray(apiResponse) ? apiResponse[0].results : apiResponse.results;

      if (!results || results.length === 0) {
          return res.json({ transcription: 'No speech detected.' });
      }

      const transcription = results
        .map((result) => result.alternatives[0].transcript)
        .join('\n');
      
      res.json({ transcription });

  } catch (error) {
      console.error("Transcription Error:", error);
      res.status(500).send(`Error: ${error.message}`);
  } finally {
      if (fs.existsSync(audioFile)) {
          fs.unlinkSync(audioFile);
      }
  }
});

app.listen(port, () => {
  console.log(`Server running at ${process.env.DOMAIN || 'http://localhost'}:${port}`);
});