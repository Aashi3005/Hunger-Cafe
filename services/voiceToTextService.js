import Voice from '@react-native-voice/voice';

export class VoiceToTextService {
  constructor() {
    this.isListening = false;
    this.recognizedText = '';
    this.partialResults = [];
    this.callbacks = {
      onSpeechStart: null,
      onSpeechEnd: null,
      onSpeechResult: null,
      onSpeechError: null,
      onSpeechPartialResults: null
    };
    
    this.initializeVoice();
  }

  initializeVoice() {
    // Set up voice recognition event handlers
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged;
  }

  onSpeechStart = (event) => {
    console.log('Speech recognition started:', event);
    this.isListening = true;
    this.callbacks.onSpeechStart && this.callbacks.onSpeechStart();
  };

  onSpeechRecognized = (event) => {
    console.log('Speech recognized:', event);
  };

  onSpeechEnd = (event) => {
    console.log('Speech recognition ended:', event);
    this.isListening = false;
    this.callbacks.onSpeechEnd && this.callbacks.onSpeechEnd();
  };

  onSpeechError = (event) => {
    console.error('Speech recognition error:', event);
    this.isListening = false;
    this.callbacks.onSpeechError && this.callbacks.onSpeechError(event.error);
  };

  onSpeechResults = (event) => {
    console.log('Speech results:', event);
    if (event.value && event.value.length > 0) {
      this.recognizedText = event.value[0];
      this.callbacks.onSpeechResult && this.callbacks.onSpeechResult(event.value[0]);
    }
  };

  onSpeechPartialResults = (event) => {
    console.log('Partial results:', event);
    this.partialResults = event.value || [];
    this.callbacks.onSpeechPartialResults && this.callbacks.onSpeechPartialResults(event.value);
  };

  onSpeechVolumeChanged = (event) => {
    console.log('Volume changed:', event.value);
  };

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Start voice recognition with improved options
  async startListening(options = {}) {
    try {
      if (this.isListening) {
        console.log('Already listening');
        return;
      }

      // Clear previous results
      this.recognizedText = '';
      this.partialResults = [];

      // Check if speech recognition is available
      const available = await Voice.isAvailable();
      if (!available) {
        throw new Error('Speech recognition not available on this device');
      }

      // Configure recognition options
      const recognitionOptions = {
        locale: options.locale || 'en-US',
        ...options
      };

      // Start listening with improved configuration
      await Voice.start(recognitionOptions.locale);
      this.isListening = true;
      console.log('Started listening for speech with options:', recognitionOptions);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.isListening = false;
      throw error;
    }
  }

  // Stop voice recognition
  async stopListening() {
    try {
      if (!this.isListening) {
        console.log('Not currently listening');
        return;
      }

      await Voice.stop();
      this.isListening = false;
      console.log('Stopped listening for speech');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      throw error;
    }
  }

  // Cancel voice recognition
  async cancelListening() {
    try {
      await Voice.cancel();
      this.isListening = false;
      this.recognizedText = '';
      this.partialResults = [];
      console.log('Cancelled speech recognition');
    } catch (error) {
      console.error('Error cancelling voice recognition:', error);
    }
  }

  // Check if currently listening
  getListeningStatus() {
    return this.isListening;
  }

  // Get the last recognized text
  getRecognizedText() {
    return this.recognizedText;
  }

  // Get partial results
  getPartialResults() {
    return this.partialResults;
  }

  // Clean up resources
  destroy() {
    Voice.destroy().then(() => {
      Voice.removeAllListeners();
    });
  }
}

// Export a singleton instance
export const voiceToTextService = new VoiceToTextService(); 