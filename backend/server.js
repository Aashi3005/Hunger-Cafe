const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

// AssemblyAI API Key
const ASSEMBLY_AI_API_KEY = 'e2f21c3a974744488f5e516a3e3e5005';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Speech to text endpoint
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Received audio file:', req.file.filename);
    const audioFilePath = req.file.path;

    // Step 1: Upload the audio file to AssemblyAI
    const uploadUrl = await uploadToAssemblyAI(audioFilePath);
    console.log('Audio uploaded to AssemblyAI:', uploadUrl);

    // Step 2: Start transcription
    const transcriptionId = await startTranscription(uploadUrl);
    console.log('Transcription started:', transcriptionId);

    // Step 3: Poll for transcription completion
    const transcriptionResult = await pollTranscription(transcriptionId);
    console.log('Transcription completed');

    // Clean up: Delete the temporary file
    fs.unlinkSync(audioFilePath);

    // Return the transcription text
    res.json({
      success: true,
      text: transcriptionResult.text,
      confidence: transcriptionResult.confidence
    });

  } catch (error) {
    console.error('Error in speech-to-text:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Failed to process audio',
      details: error.message
    });
  }
});

// Function to upload audio file to AssemblyAI
async function uploadToAssemblyAI(filePath) {
  const formData = new FormData();
  formData.append('audio', fs.createReadStream(filePath));

  const response = await axios.post('https://api.assemblyai.com/v2/upload', formData, {
    headers: {
      'Authorization': `Bearer ${ASSEMBLY_AI_API_KEY}`,
      ...formData.getHeaders()
    }
  });

  return response.data.upload_url;
}

// Function to start transcription
async function startTranscription(audioUrl) {
  const response = await axios.post('https://api.assemblyai.com/v2/transcript', {
    audio_url: audioUrl,
    language_code: 'en' // You can change this to support other languages
  }, {
    headers: {
      'Authorization': `Bearer ${ASSEMBLY_AI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.id;
}

// Function to poll for transcription completion
async function pollTranscription(transcriptionId) {
  while (true) {
    const response = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptionId}`, {
      headers: {
        'Authorization': `Bearer ${ASSEMBLY_AI_API_KEY}`
      }
    });

    const status = response.data.status;
    
    if (status === 'completed') {
      return response.data;
    } else if (status === 'error') {
      throw new Error(`Transcription failed: ${response.data.error}`);
    }
    
    // Wait for 1 second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

app.listen(port, () => {
  console.log(`🎤 Speech-to-Text server running on http://localhost:${port}`);
  console.log(`📡 AssemblyAI integration ready`);
}); 