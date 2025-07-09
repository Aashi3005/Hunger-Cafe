import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const BACKEND_URL = 'http://localhost:3001'; // Change this to your backend URL

export class SpeechToTextService {
  constructor() {
    this.recording = null;
    this.isRecording = false;
  }

  // Request audio permissions
  async requestPermissions() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Start recording
  async startRecording() {
    try {
      if (this.isRecording) {
        console.log('Already recording');
        return;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio permission required for recording');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      console.log('Recording started');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop recording
  async stopRecording() {
    try {
      if (!this.isRecording || !this.recording) {
        console.log('Not recording');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;
      
      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  // Send audio to backend for transcription
  async transcribeAudio(audioUri) {
    try {
      if (!audioUri) {
        throw new Error('No audio URI provided');
      }

      // Create FormData
      const formData = new FormData();
      
      // For mobile platforms, we need to handle file upload differently
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a', // or 'audio/mp3' depending on your recording format
        name: 'audio.m4a',
      };

      formData.append('audio', audioFile);

      // Send to backend
      const response = await fetch(`${BACKEND_URL}/speech-to-text`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  // Complete recording and transcription process
  async recordAndTranscribe() {
    try {
      // Start recording
      await this.startRecording();
      
      // Return a function to stop recording and get transcription
      return async () => {
        try {
          // Stop recording
          const audioUri = await this.stopRecording();
          
          if (!audioUri) {
            throw new Error('No audio recorded');
          }

          // Transcribe audio
          const transcriptionResult = await this.transcribeAudio(audioUri);
          
          // Clean up the audio file
          await FileSystem.deleteAsync(audioUri, { idempotent: true });
          
          return transcriptionResult;
        } catch (error) {
          console.error('Error in recordAndTranscribe completion:', error);
          throw error;
        }
      };
    } catch (error) {
      console.error('Error in recordAndTranscribe:', error);
      throw error;
    }
  }

  // Get recording status
  getRecordingStatus() {
    return this.isRecording;
  }

  // Cancel recording
  async cancelRecording() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;
        console.log('Recording cancelled');
      }
    } catch (error) {
      console.error('Error cancelling recording:', error);
    }
  }
}

// Export a singleton instance
export const speechToTextService = new SpeechToTextService(); 