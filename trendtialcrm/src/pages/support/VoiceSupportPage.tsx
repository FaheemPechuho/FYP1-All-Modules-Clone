// src/pages/support/VoiceSupportPage.tsx
// Voice AI Support - Real STT via Web Speech API → ticket creation → AI response
import React, { useState, useCallback } from 'react';
import { useCreateTicketMutation, useAISuggestResponseMutation } from '../../hooks/queries/useSupportQuery';
import { sendEmail, buildTicketEmailHtml } from '../../lib/emailService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  PhoneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// ── Processing steps shown in the pipeline ────────────────────────────────────
const STEPS = ['Transcribed', 'Ticket created', 'AI response', 'Voice ready'] as const;
type Step = typeof STEPS[number];


// ── Main component ─────────────────────────────────────────────────────────────
const VoiceSupportPage: React.FC = () => {
  const [transcript, setTranscript]               = useState<string | null>(null);
  const [isProcessing, setIsProcessing]           = useState(false);
  const [completedSteps, setCompletedSteps]       = useState<Step[]>([]);
  const [processingLabel, setProcessingLabel]     = useState('');
  const [aiResponse, setAiResponse]               = useState<string | null>(null);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [ticketCreated, setTicketCreated]         = useState<any>(null);
  const [errorMsg, setErrorMsg]                   = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail]       = useState(false);
  const [emailSentMsg, setEmailSentMsg]           = useState<string | null>(null);

  const createTicketMutation = useCreateTicketMutation();
  const aiAnswerMutation     = useAISuggestResponseMutation();

  // ── Called automatically when the browser finishes transcribing ──────────────
  const handleTranscript = useCallback(async (text: string) => {
    setTranscript(text);
    setIsProcessing(true);
    setCompletedSteps([]);
    setAiResponse(null);
    setTicketCreated(null);
    setErrorMsg(null);

    try {
      setCompletedSteps(['Transcribed']);

      // Step 1 — Create support ticket from the voice transcript
      setProcessingLabel('Creating support ticket…');
      const ticket = await createTicketMutation.mutateAsync({
        customer_email: 'voice-user@example.com',
        subject: text.substring(0, 120),
        description: text,
        channel: 'voice',
      });
      setTicketCreated(ticket);
      setCompletedSteps(prev => [...prev, 'Ticket created']);

      // Step 2 — Get AI answer (RAG + LLM) for the ticket
      setProcessingLabel('Generating AI response…');
      let answer = '';
      try {
        const result = await aiAnswerMutation.mutateAsync(ticket.id);
        answer = result.answer;
      } catch {
        answer = `Thank you for contacting support. I've created ticket **${ticket.ticket_number}** (${ticket.priority} priority) for your request.\n\nCategory: ${ticket.category || 'General'}\n\nA support agent will review your case shortly.`;
      }
      setAiResponse(answer);
      setCompletedSteps(prev => [...prev, 'AI response']);

      // Step 3 — Auto-play the AI response via browser TTS
      setProcessingLabel('Preparing voice response…');
      const utterance = new SpeechSynthesisUtterance(answer.replace(/\*\*/g, ''));
      utterance.rate  = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsPlayingResponse(true);
      utterance.onend   = () => setIsPlayingResponse(false);
      speechSynthesis.speak(utterance);

      setCompletedSteps(prev => [...prev, 'Voice ready']);
      setProcessingLabel('');
    } catch (err) {
      console.error('[Voice Support] Pipeline error:', err);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [createTicketMutation, aiAnswerMutation]);

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    onTranscript: handleTranscript,
    lang: 'en-US',
  });

  const playAIResponse = () => {
    if (!aiResponse) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(aiResponse.replace(/\*\*/g, ''));
    utterance.rate  = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsPlayingResponse(true);
    utterance.onend   = () => setIsPlayingResponse(false);
    speechSynthesis.speak(utterance);
  };

  const stopAIResponse = () => {
    speechSynthesis.cancel();
    setIsPlayingResponse(false);
  };

  const handleSendTicketEmail = async () => {
    if (!ticketCreated) return;
    setIsSendingEmail(true);
    setEmailSentMsg(null);
    try {
      const html = buildTicketEmailHtml({
        ticketNumber: ticketCreated.ticket_number,
        subject: ticketCreated.subject || 'Voice Support Request',
        status: ticketCreated.status,
        priority: ticketCreated.priority,
        customerName: 'Customer',
        description: transcript || undefined,
        category: ticketCreated.category,
        agentReply: aiResponse || undefined,
        createdAt: ticketCreated.created_at,
      });
      await sendEmail({
        to: ticketCreated.customer_email || 'husnainn.akram@gmail.com',
        subject: `[${ticketCreated.ticket_number}] Voice Support Request`,
        html,
      });
      setEmailSentMsg(`Email sent to ${ticketCreated.customer_email || 'husnainn.akram@gmail.com'}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send email';
      setEmailSentMsg(`Error: ${msg}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const resetAll = () => {
    stopListening();
    speechSynthesis.cancel();
    setTranscript(null);
    setAiResponse(null);
    setTicketCreated(null);
    setIsProcessing(false);
    setCompletedSteps([]);
    setProcessingLabel('');
    setErrorMsg(null);
    setIsPlayingResponse(false);
    setIsSendingEmail(false);
    setEmailSentMsg(null);
  };

  // ── Mic button state ─────────────────────────────────────────────────────────
  const micIdle      = !isListening && !isProcessing;
  const canReset     = !!transcript && !isListening && !isProcessing;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">

      {/* ── Header ── */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mb-6 shadow-lg">
          <PhoneIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Voice AI Support</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Speak your question — your voice is transcribed, a ticket is created, and AI responds instantly.
        </p>
        {!isSupported && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            Speech recognition is not supported in this browser. Please use Chrome or Edge.
          </div>
        )}
      </div>

      {/* ── Voice Input Card ── */}
      <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="p-10">
          <div className="flex flex-col items-center gap-6">

            {/* Animated visualizer */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing rings when listening */}
              {isListening && (
                <>
                  <div className="absolute h-48 w-48 rounded-full bg-red-400/15 animate-ping" />
                  <div className="absolute h-40 w-40 rounded-full bg-red-400/20 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={!isSupported || isProcessing}
                className={`relative h-36 w-36 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-xl focus:outline-none ${
                  isListening
                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : isProcessing
                    ? 'bg-gradient-to-br from-purple-400 to-indigo-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                } disabled:opacity-50`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <>
                    {/* Waveform bars */}
                    <span className="flex items-end gap-[3px] h-8">
                      {[...Array(7)].map((_, i) => (
                        <span
                          key={i}
                          className="stt-bar inline-block w-[4px] rounded-full bg-white"
                          style={{ height: '100%', transformOrigin: 'center bottom' }}
                        />
                      ))}
                    </span>
                    <StopIcon className="h-5 w-5 text-white/80" />
                  </>
                ) : isProcessing ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
                ) : (
                  <MicrophoneIcon className="h-14 w-14 text-white" />
                )}
              </button>
            </div>

            {/* Status text */}
            <div className="text-center">
              {isListening && (
                <p className="text-lg font-semibold text-red-600 animate-pulse">
                  🎙 Listening… speak clearly, then pause
                </p>
              )}
              {isProcessing && processingLabel && (
                <p className="text-base font-medium text-purple-600">{processingLabel}</p>
              )}
              {micIdle && !transcript && (
                <p className="text-base text-muted-foreground">
                  {isSupported ? 'Click the mic to start speaking' : 'Use Chrome or Edge for voice input'}
                </p>
              )}
            </div>

            {/* Pipeline progress bar */}
            {(isProcessing || completedSteps.length > 0) && (
              <div className="w-full max-w-md">
                <div className="flex justify-between mb-2">
                  {STEPS.map(step => (
                    <span
                      key={step}
                      className={`text-xs font-medium ${
                        completedSteps.includes(step)
                          ? 'text-purple-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {completedSteps.includes(step) ? '✓ ' : ''}{step}
                    </span>
                  ))}
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Reset button */}
            {canReset && (
              <Button variant="outline" onClick={resetAll}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Start New Voice Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Results Grid ── */}
      {(transcript || aiResponse) && (
        <div className="grid md:grid-cols-2 gap-6">

          {/* Transcript */}
          {transcript && (
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  Your Voice Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed italic">"{transcript}"</p>
              </CardContent>
            </Card>
          )}

          {/* AI Response */}
          {aiResponse && (
            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  AI Response
                  <span className="ml-auto text-xs font-normal text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full">
                    Llama 3.1 + RAG
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{aiResponse}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPlayingResponse ? stopAIResponse : playAIResponse}
                  className="w-full"
                >
                  {isPlayingResponse ? (
                    <>
                      <PauseIcon className="h-4 w-4 mr-2" />
                      Stop Voice Playback
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

      {/* ── Ticket Created Banner ── */}
      {ticketCreated && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800 mb-1 text-lg">Support Ticket Created Successfully</h3>
                <p className="text-green-700 text-sm mb-3">
                  Your voice query was transcribed, classified by AI, and a ticket was automatically generated.
                </p>
                {emailSentMsg && (
                  <div className={`mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                    emailSentMsg.startsWith('Error')
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                    {emailSentMsg}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-lg font-semibold shadow-sm">
                    {ticketCreated.ticket_number}
                  </span>
                  <span className="px-3 py-1 bg-white border border-green-200 text-green-700 rounded-lg capitalize">
                    Status: <strong>{ticketCreated.status}</strong>
                  </span>
                  <span className="px-3 py-1 bg-white border border-green-200 text-green-700 rounded-lg capitalize">
                    Priority: <strong>{ticketCreated.priority}</strong>
                  </span>
                  {ticketCreated.category && (
                    <span className="px-3 py-1 bg-white border border-green-200 text-green-700 rounded-lg capitalize">
                      Category: <strong>{ticketCreated.category.replace('_', ' ')}</strong>
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSendTicketEmail}
                  disabled={isSendingEmail}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Send Ticket Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Feature Info Cards ── */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MicrophoneIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Browser Speech-to-Text</h3>
          <p className="text-sm text-muted-foreground">
            Uses the Web Speech API built into Chrome and Edge — no additional setup required
          </p>
        </Card>

        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Response</h3>
          <p className="text-sm text-muted-foreground">
            Llama 3.1 with RAG over the knowledge base generates accurate, context-aware answers
          </p>
        </Card>

        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Voice Output</h3>
          <p className="text-sm text-muted-foreground">
            Browser text-to-speech reads the AI response aloud for a hands-free experience
          </p>
        </Card>
      </div>
    </div>
  );
};

export default VoiceSupportPage;
