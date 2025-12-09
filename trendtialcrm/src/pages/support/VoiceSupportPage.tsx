// src/pages/support/VoiceSupportPage.tsx
// Voice AI Support - Record voice, get AI response with voice + transcript
import React, { useState, useRef, useEffect } from 'react';
import { useCreateTicketMutation, useAISuggestResponseMutation } from '../../hooks/queries/useSupportQuery';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  PhoneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  SignalIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// Simulated AI Voice Response
const SUPPORT_API_URL = import.meta.env.VITE_SUPPORT_API_URL || 'http://localhost:8001';

const VoiceSupportPage: React.FC = () => {
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  
  // Results
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<any>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const createTicketMutation = useCreateTicketMutation();

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Process voice with AI
  const processWithAI = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    setTranscript(null);
    setAiResponse(null);
    setTicketCreated(null);
    
    try {
      // Step 1: Transcribe
      setProcessingStep('Transcribing your voice...');
      await new Promise(r => setTimeout(r, 1500));
      
      // Simulated transcript (in real app, use Whisper API)
      const simulatedTranscript = "I'm having trouble with my account login. It keeps showing an error message when I try to sign in with my email and password.";
      setTranscript(simulatedTranscript);
      
      // Step 2: Create ticket
      setProcessingStep('Creating support ticket...');
      await new Promise(r => setTimeout(r, 1000));
      
      const ticket = await createTicketMutation.mutateAsync({
        customer_email: 'voice-user@example.com',
        subject: 'Voice Support Request: Login Issue',
        description: simulatedTranscript,
        channel: 'voice',
        priority: 'high',
      });
      setTicketCreated(ticket);
      
      // Step 3: Get AI response
      setProcessingStep('Generating AI response...');
      await new Promise(r => setTimeout(r, 2000));
      
      // Simulated AI response
      const simulatedResponse = "I understand you're experiencing login issues. Let me help you with that. First, please try resetting your password by clicking the 'Forgot Password' link on the login page. If that doesn't work, please clear your browser cache and cookies, then try logging in again. If you continue to have issues, I'll escalate this to our technical team for further investigation.";
      setAiResponse(simulatedResponse);
      
      // Step 4: Generate voice response
      setProcessingStep('Generating voice response...');
      await new Promise(r => setTimeout(r, 1500));
      
      // In real app, use text-to-speech API
      setAiAudioUrl('/sample-response.mp3');
      
      setProcessingStep('');
      
    } catch (error) {
      console.error('Error processing voice:', error);
      setProcessingStep('Error processing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Play AI response
  const playAIResponse = () => {
    if (aiResponse) {
      // Use browser's speech synthesis
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsPlayingResponse(true);
      utterance.onend = () => setIsPlayingResponse(false);
      speechSynthesis.speak(utterance);
    }
  };
  
  const stopAIResponse = () => {
    speechSynthesis.cancel();
    setIsPlayingResponse(false);
  };
  
  // Reset
  const resetAll = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript(null);
    setAiResponse(null);
    setAiAudioUrl(null);
    setTicketCreated(null);
    setRecordingTime(0);
    setIsProcessing(false);
    setProcessingStep('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mb-6 shadow-lg">
          <PhoneIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Voice AI Support</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Speak your question and get an instant AI-powered response with voice and transcript
        </p>
      </div>

      {/* Recording Card */}
      <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="p-8">
          <div className="text-center">
            {/* Recording Visualizer */}
            <div className={`relative inline-flex items-center justify-center mb-6 ${isRecording ? 'animate-pulse' : ''}`}>
              <div className={`absolute inset-0 rounded-full ${isRecording ? 'bg-red-500/20 animate-ping' : ''}`}></div>
              <div className={`h-32 w-32 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30' 
                  : audioBlob 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                {isRecording ? (
                  <div className="flex flex-col items-center text-white">
                    <SignalIcon className="h-10 w-10 animate-pulse" />
                    <span className="text-xl font-bold mt-2">{formatTime(recordingTime)}</span>
                  </div>
                ) : audioBlob ? (
                  <CheckCircleIcon className="h-12 w-12 text-white" />
                ) : (
                  <MicrophoneIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {!isRecording && !audioBlob && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-8"
                >
                  <MicrophoneIcon className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              )}
              
              {isRecording && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="px-8"
                >
                  <StopIcon className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              {audioBlob && !isProcessing && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={resetAll}
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Record Again
                  </Button>
                  <Button
                    size="lg"
                    onClick={processWithAI}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-8"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Process with AI
                  </Button>
                </>
              )}
            </div>

            {/* Audio Playback */}
            {audioUrl && !isProcessing && (
              <div className="bg-gray-100 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-2">Your recording:</p>
                <audio src={audioUrl} controls className="w-full" />
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="text-lg font-medium text-purple-600">{processingStep}</p>
                <div className="flex gap-2">
                  {['Transcribing', 'Creating ticket', 'AI Response', 'Voice output'].map((step, idx) => (
                    <div
                      key={step}
                      className={`h-2 w-16 rounded-full ${
                        processingStep.toLowerCase().includes(step.toLowerCase().split(' ')[0])
                          ? 'bg-purple-600 animate-pulse'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(transcript || aiResponse) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Transcript */}
          {transcript && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  Your Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{transcript}</p>
              </CardContent>
            </Card>
          )}

          {/* AI Response */}
          {aiResponse && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  AI Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-4">{aiResponse}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPlayingResponse ? stopAIResponse : playAIResponse}
                  className="w-full"
                >
                  {isPlayingResponse ? (
                    <>
                      <PauseIcon className="h-4 w-4 mr-2" />
                      Stop Voice
                    </>
                  ) : (
                    <>
                      <SpeakerWaveIcon className="h-4 w-4 mr-2" />
                      Play Voice Response
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ticket Created */}
      {ticketCreated && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-1">Support Ticket Created</h3>
                <p className="text-green-700 text-sm mb-2">
                  Your voice query has been converted to a support ticket and processed by AI.
                </p>
                <div className="flex items-center gap-4 text-sm text-green-600">
                  <span className="font-mono bg-green-100 px-2 py-1 rounded">{ticketCreated.ticket_number}</span>
                  <span className="capitalize">Status: {ticketCreated.status}</span>
                  <span className="capitalize">Priority: {ticketCreated.priority}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MicrophoneIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Voice Recognition</h3>
          <p className="text-sm text-muted-foreground">Advanced speech-to-text powered by AI for accurate transcription</p>
        </Card>
        
        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Response</h3>
          <p className="text-sm text-muted-foreground">Intelligent response generation using RAG and LLM technology</p>
        </Card>
        
        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Voice Output</h3>
          <p className="text-sm text-muted-foreground">Natural text-to-speech for a complete voice conversation experience</p>
        </Card>
      </div>
    </div>
  );
};

export default VoiceSupportPage;
