# 🎤 Speech-to-Text Setup Guide

This guide will help you set up the speech-to-text functionality in your HungerQuest app using AssemblyAI.

## 🚀 Quick Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
cd backend
npm run dev
```

The server will run on `http://localhost:3001`

### 3. Start Your React Native App
```bash
# In the root directory
npm start
```

## 📱 How to Use

1. **Open Recipe Generator**: Navigate to the recipe generator screen
2. **Find the Mic Icon**: Look for the microphone icon (🎤) next to the ingredients text input
3. **Start Recording**: Tap the microphone icon to start recording
4. **Recording Status**: The icon will change to red (🔴) while recording
5. **Stop Recording**: Tap the red icon to stop recording
6. **Transcription**: The app will show a loading icon (⏳) while transcribing
7. **Result**: The transcribed text will be automatically added to your ingredients

## 🔧 Technical Details

### Backend Architecture
- **Express.js** server handling multipart file uploads
- **AssemblyAI** integration for speech recognition
- **CORS** enabled for React Native communication
- **File cleanup** after transcription

### Frontend Integration
- **Expo AV** for audio recording
- **File System** for temporary file management
- **FormData** for file uploads
- **Real-time UI** updates during recording/transcription

## 🛠️ Configuration

### Backend Server URL
If you're running on a device, update the backend URL in:
```javascript
// services/speechToTextService.js
const BACKEND_URL = 'http://YOUR_IP_ADDRESS:3001';
```

### AssemblyAI API Key
The API key is already configured in the backend server:
```javascript
// backend/server.js
const ASSEMBLY_AI_API_KEY = 'e2f21c3a974744488f5e516a3e3e5005';
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure microphone permissions are granted
2. **Connection Error**: Check if backend server is running
3. **Transcription Failed**: Verify AssemblyAI API key is valid
4. **Audio Not Recording**: Ensure device has microphone access

### Network Issues
- Use your computer's IP address instead of `localhost` for device testing
- Make sure both devices are on the same network
- Check firewall settings

## 🎯 Features

- ✅ **Real-time Recording**: Visual feedback during recording
- ✅ **Automatic Transcription**: Powered by AssemblyAI
- ✅ **Seamless Integration**: Works with existing ingredients input
- ✅ **Error Handling**: Graceful failure handling
- ✅ **File Cleanup**: Automatic temporary file removal

## 🔄 Workflow

1. User taps microphone icon
2. App requests audio permissions
3. Recording starts (red icon)
4. User speaks ingredients
5. User taps to stop recording
6. Audio file is sent to backend
7. Backend uploads to AssemblyAI
8. AssemblyAI transcribes audio
9. Backend returns text to app
10. Text is added to ingredients input
11. Temporary files are cleaned up

## 📋 Dependencies

### Backend
- `express` - Web framework
- `multer` - File upload handling
- `axios` - HTTP requests
- `form-data` - FormData for file uploads
- `cors` - Cross-origin resource sharing

### Frontend
- `expo-av` - Audio recording
- `expo-file-system` - File management
- React Native's `fetch` - HTTP requests

## 🎉 That's It!

Your speech-to-text functionality is now ready! Users can speak their ingredients instead of typing them, making the app more accessible and user-friendly. 