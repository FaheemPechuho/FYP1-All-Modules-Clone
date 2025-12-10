/**
 * AICallPanel - AI-powered inbound call interface with real backend integration
 * 
 * Connects to clara-backend's voice pipeline for real AI sales calls.
 * 
 * Features:
 * - Real-time voice conversation with AI Sales Agent
 * - Live BANT assessment and lead scoring
 * - Automatic CRM updates
 * - Call transcript recording
 * - Session persistence (survives page refresh/remount)
 * 
 * Voice Pipeline:
 * - STT: Groq Whisper (cloud, free)
 * - LLM: Llama 3.3 70B (Groq, free)
 * - TTS: Piper (local, free)
 * 
 * @author Faheem
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PhoneIcon, 
  PhoneXMarkIcon,
  PhoneArrowDownLeftIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  UserCircleIcon,
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { salesCallApi, BANTAssessment, TranscriptMessage } from '../../services/salesCallApi';

type CallStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'completed' | 'failed';
type QualificationStatus = 'unqualified' | 'marketing_qualified' | 'sales_qualified' | 'opportunity';

interface BackendHealth {
  isHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  components: {
    orchestrator: boolean;
    sales_agent: boolean;
    voice_stream: boolean;
  } | null;
}

// Session storage key for persisting active call
const SESSION_STORAGE_KEY = 'clara_active_call_session';

const AICallPanel: React.FC = () => {
  // Call state - initialize from sessionStorage if available
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved).sessionId : null;
  });
  const [callStatus, setCallStatus] = useState<CallStatus>(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved).callStatus : 'idle';
  });
  const [callDuration, setCallDuration] = useState(0);
  const [qualificationStatus, setQualificationStatus] = useState<QualificationStatus>('unqualified');
  const [leadScore, setLeadScore] = useState(0);
  const [bant, setBant] = useState<BANTAssessment>({
    budget: 'unknown',
    authority: 'unknown',
    need: 'unknown',
    timeline: 'unknown',
  });
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Backend health
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({
    isHealthy: false,
    isChecking: true,
    error: null,
    components: null,
  });
  
  // Polling interval ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isResumingRef = useRef(false);

  // Persist session to sessionStorage when it changes
  useEffect(() => {
    if (sessionId && (callStatus === 'active' || callStatus === 'connecting')) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ sessionId, callStatus }));
    } else if (callStatus === 'idle' || callStatus === 'completed' || callStatus === 'failed') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [sessionId, callStatus]);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Timer effect
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Check backend health
  const checkBackendHealth = async () => {
    setBackendHealth(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const health = await salesCallApi.healthCheck();
      
      setBackendHealth({
        isHealthy: health.status === 'healthy',
        isChecking: false,
        error: health.error || null,
        components: health.components,
      });
    } catch (err) {
      setBackendHealth({
        isHealthy: false,
        isChecking: false,
        error: 'Cannot connect to Clara backend',
        components: null,
      });
    }
  };

  // Poll for call status updates
  const startPolling = useCallback((sid: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    console.log('Starting polling for session:', sid);
    let errorCount = 0;
    const MAX_ERRORS = 5;
    
    pollingRef.current = setInterval(async () => {
      try {
        const status = await salesCallApi.getCallStatus(sid);
        
        if (status.success) {
          errorCount = 0; // Reset error count on success
          
          // Only update status if it's a valid transition
          // Don't go from active -> idle (that's a reset, not a status update)
          const currentStatus = status.status as CallStatus;
          
          // Update data regardless of status
          setQualificationStatus(status.qualification_status as QualificationStatus);
          setLeadScore(status.lead_score);
          setBant(status.bant);
          
          // Merge transcripts - keep existing and add new ones
          if (status.transcript && status.transcript.length > 0) {
            setTranscript(prev => {
              // If backend has more messages, use backend's transcript
              if (status.transcript.length > prev.length) {
                return status.transcript;
              }
              // Otherwise keep existing (prevents flickering)
              return prev.length > 0 ? prev : status.transcript;
            });
          }
          
          // Update duration from backend
          if (status.duration !== undefined) {
            setCallDuration(status.duration);
          }
          
          // Only update status for valid transitions (not to idle)
          if (currentStatus !== 'idle') {
            setCallStatus(currentStatus);
          }
          
          // Stop polling if call ended
          if (currentStatus === 'completed' || currentStatus === 'failed') {
            console.log('Call ended with status:', currentStatus);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        } else {
          // Backend returned success: false
          console.warn('Polling returned unsuccessful:', status);
          errorCount++;
        }
      } catch (err) {
        console.error('Polling error:', err);
        errorCount++;
        
        // Don't immediately fail - allow some errors
        if (errorCount >= MAX_ERRORS) {
          console.error('Too many polling errors, stopping polling');
          setError('Lost connection to backend. The call may still be active.');
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    }, 1000); // Poll every second
  }, []);

  // Resume active session on mount (after startPolling is defined)
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved && !isResumingRef.current) {
      const { sessionId: savedSessionId, callStatus: savedStatus } = JSON.parse(saved);
      if (savedSessionId && (savedStatus === 'active' || savedStatus === 'connecting')) {
        console.log('Resuming active call session:', savedSessionId);
        isResumingRef.current = true;
        setSessionId(savedSessionId);
        setCallStatus(savedStatus);
        setStatusMessages(['🔄 Resuming active call session...']);
        // Start polling for the resumed session
        startPolling(savedSessionId);
      }
    }
  }, [startPolling]);

  // Format duration to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start a real call
  const handleStartCall = async () => {
    setError(null);
    setCallStatus('connecting');
    setCallDuration(0);
    setStatusMessages(['🔔 Initializing AI voice assistant...']);
    setTranscript([]);
    setQualificationStatus('unqualified');
    setLeadScore(0);
    setBant({
      budget: 'unknown',
      authority: 'unknown',
      need: 'unknown',
      timeline: 'unknown',
    });
    
    try {
      // Start call via API
      const response = await salesCallApi.startCall();
      
      if (!response.success || !response.session_id) {
        throw new Error(response.message || 'Failed to start call');
      }
      
      setSessionId(response.session_id);
      setStatusMessages(prev => [...prev, '✓ Session created', '🎤 Speak into your microphone...']);
      setCallStatus('active');
      
      // Start polling for updates
      startPolling(response.session_id);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start call';
      setError(errorMsg);
      setCallStatus('failed');
      setStatusMessages(prev => [...prev, `❌ Error: ${errorMsg}`]);
    }
  };

  // End the call
  const handleEndCall = async () => {
    if (!sessionId) return;
    
    setCallStatus('ending');
    setStatusMessages(prev => [...prev, '→ Ending call...']);
    
    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    try {
      const response = await salesCallApi.endCall(sessionId);
      
      if (response.success && response.summary) {
        // Update with final summary
        setCallDuration(response.summary.duration);
        setQualificationStatus(response.summary.qualification_status as QualificationStatus);
        setLeadScore(response.summary.lead_score);
        setBant(response.summary.bant);
        setTranscript(response.summary.transcript);
      }
      
      setCallStatus('completed');
      setStatusMessages(prev => [...prev, '✓ Call completed successfully']);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to end call';
      setError(errorMsg);
      setCallStatus('failed');
    }
  };

  // Reset for new call
  const handleNewCall = () => {
    setSessionId(null);
    setCallStatus('idle');
    setCallDuration(0);
    setQualificationStatus('unqualified');
    setLeadScore(0);
    setBant({
      budget: 'unknown',
      authority: 'unknown',
      need: 'unknown',
      timeline: 'unknown',
    });
    setStatusMessages([]);
    setTranscript([]);
    setError(null);
  };

  // Get status badge color
  const getStatusColor = (status: CallStatus): string => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-600';
      case 'connecting': return 'bg-yellow-100 text-yellow-700 animate-pulse';
      case 'active': return 'bg-green-100 text-green-700';
      case 'ending': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Get qualification badge
  const getQualificationBadge = (status: QualificationStatus) => {
    switch (status) {
      case 'unqualified':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Unqualified</span>;
      case 'marketing_qualified':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">MQL</span>;
      case 'sales_qualified':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">SQL</span>;
      case 'opportunity':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 animate-pulse">🔥 Opportunity</span>;
    }
  };

  // BANT progress indicator
  const getBANTProgress = () => {
    let count = 0;
    if (bant.budget !== 'unknown') count++;
    if (bant.authority !== 'unknown') count++;
    if (bant.need !== 'unknown') count++;
    if (bant.timeline !== 'unknown') count++;
    return count;
  };

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <PhoneArrowDownLeftIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Sales Call</h2>
              <p className="text-sm text-white/80">Real voice conversation with Clara</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(callStatus)}`}>
            {callStatus === 'idle' && '📞 Ready'}
            {callStatus === 'connecting' && '🔔 Connecting...'}
            {callStatus === 'active' && '🟢 Live Call'}
            {callStatus === 'ending' && 'Ending...'}
            {callStatus === 'completed' && '✅ Completed'}
            {callStatus === 'failed' && '❌ Failed'}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Backend Health Warning */}
        {!backendHealth.isHealthy && !backendHealth.isChecking && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">Backend Not Connected</h3>
                <p className="text-sm text-red-700 mt-1">
                  {backendHealth.error || 'Cannot connect to Clara backend'}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Make sure clara-backend is running on port 8001
                </p>
                <button
                  onClick={checkBackendHealth}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Idle State - Start Call */}
        {callStatus === 'idle' && (
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Real AI Voice Call</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Start a real voice conversation with Clara AI Sales Agent.
                    Speak into your microphone and Clara will respond.
                  </p>
                  <div className="text-xs text-blue-600 mt-2 space-y-1">
                    <p>• <strong>STT</strong>: Groq Whisper (cloud)</p>
                    <p>• <strong>LLM</strong>: Llama 3.3 70B</p>
                    <p>• <strong>TTS</strong>: Piper (local)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Backend Status */}
            {backendHealth.isHealthy && backendHealth.components && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Backend Connected</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className={`flex items-center space-x-1 ${backendHealth.components.orchestrator ? 'text-green-600' : 'text-red-600'}`}>
                    {backendHealth.components.orchestrator ? <CheckCircleIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}
                    <span>Orchestrator</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${backendHealth.components.sales_agent ? 'text-green-600' : 'text-red-600'}`}>
                    {backendHealth.components.sales_agent ? <CheckCircleIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}
                    <span>Sales Agent</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${backendHealth.components.voice_stream ? 'text-green-600' : 'text-red-600'}`}>
                    {backendHealth.components.voice_stream ? <CheckCircleIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}
                    <span>Voice Stream</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartCall}
              disabled={!backendHealth.isHealthy || backendHealth.isChecking}
              className={`w-full flex items-center justify-center space-x-3 py-4 rounded-lg font-medium transition-all ${
                backendHealth.isHealthy
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <PlayIcon className="h-6 w-6" />
              <span className="text-lg">Start Voice Call</span>
            </button>

            <p className="text-xs text-center text-gray-500">
              Say "goodbye" to end the call, or press End Call button
            </p>
          </div>
        )}

        {/* Active/Connecting State */}
        {(callStatus === 'connecting' || callStatus === 'active' || callStatus === 'ending') && (
          <div className="space-y-6">
            {/* Call Timer & Status */}
            <div className="text-center">
              <div className="text-5xl font-mono font-bold text-gray-900 mb-2">
                {formatDuration(callDuration)}
              </div>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className="flex items-center text-green-600">
                  <MicrophoneIcon className="h-4 w-4 mr-1" />
                  Listening
                </span>
                <span className="flex items-center text-indigo-600">
                  <SpeakerWaveIcon className="h-4 w-4 mr-1" />
                  AI Active
                </span>
              </div>
              {sessionId && (
                <p className="text-xs text-gray-400 mt-1">Session: {sessionId}</p>
              )}
            </div>

            {/* Real-time Qualification Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Qualification</p>
                  <div className="mt-1">{getQualificationBadge(qualificationStatus)}</div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Lead Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(leadScore)}`}>{leadScore}/100</p>
                </div>
              </div>
            </div>

            {/* BANT Progress */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-indigo-900">BANT Assessment</span>
                <span className="text-sm text-indigo-600 font-medium">{getBANTProgress()}/4 identified</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['budget', 'authority', 'need', 'timeline'] as const).map((key) => (
                  <div 
                    key={key}
                    className={`text-center p-2 rounded transition-all ${bant[key] !== 'unknown' ? 'bg-green-100 scale-105' : 'bg-gray-100'}`}
                  >
                    <div className="text-xs font-medium text-gray-700 capitalize">{key}</div>
                    {bant[key] !== 'unknown' ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto mt-1" />
                        <p className="text-xs text-green-700 mt-1">{bant[key]}</p>
                      </>
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400 mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Transcript */}
            <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="text-xs text-gray-500 mb-2">Live Transcript</div>
              <div className="space-y-3">
                {transcript.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Waiting for conversation...</p>
                )}
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex items-start space-x-2 ${msg.role === 'ai' ? '' : 'flex-row-reverse space-x-reverse'}`}>
                    <div className={`flex-shrink-0 rounded-full p-1 ${msg.role === 'ai' ? 'bg-indigo-600' : 'bg-green-600'}`}>
                      {msg.role === 'ai' ? (
                        <CpuChipIcon className="h-4 w-4 text-white" />
                      ) : (
                        <UserCircleIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg px-3 py-2 max-w-[85%] ${
                      msg.role === 'ai' 
                        ? 'bg-indigo-900 text-indigo-100' 
                        : 'bg-green-900 text-green-100'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {callStatus === 'active' && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs">Listening...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Log */}
            <div className="bg-gray-100 rounded-lg p-3 max-h-24 overflow-y-auto">
              <div className="text-xs text-gray-500 mb-1">Status Log</div>
              <div className="space-y-0.5">
                {statusMessages.map((msg, i) => (
                  <p key={i} className="text-xs text-gray-600 font-mono">{msg}</p>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* End Call Button */}
            {callStatus !== 'ending' && (
              <button
                onClick={handleEndCall}
                className="w-full flex items-center justify-center space-x-2 py-4 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
              >
                <PhoneXMarkIcon className="h-5 w-5" />
                <span>End Call</span>
              </button>
            )}
          </div>
        )}

        {/* Completed State */}
        {callStatus === 'completed' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Call Completed!</h3>
              <p className="text-sm text-gray-500">Duration: {formatDuration(callDuration)}</p>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 mb-4">📊 Call Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Final Qualification</p>
                  <div className="mt-1">{getQualificationBadge(qualificationStatus)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lead Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(leadScore)}`}>{leadScore}/100</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">BANT Progress</p>
                  <p className="text-lg font-semibold text-gray-900">{getBANTProgress()}/4</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Conversation Turns</p>
                  <p className="text-lg font-semibold text-gray-900">{transcript.filter(t => t.role === 'user').length}</p>
                </div>
              </div>
            </div>

            {/* Full Transcript */}
            {transcript.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="text-xs text-gray-500 mb-2">📝 Full Transcript</div>
                <div className="space-y-3">
                  {transcript.map((msg, i) => (
                    <div key={i} className={`flex items-start space-x-2 ${msg.role === 'ai' ? '' : 'flex-row-reverse space-x-reverse'}`}>
                      <div className={`flex-shrink-0 rounded-full p-1 ${msg.role === 'ai' ? 'bg-indigo-600' : 'bg-green-600'}`}>
                        {msg.role === 'ai' ? (
                          <CpuChipIcon className="h-4 w-4 text-white" />
                        ) : (
                          <UserCircleIcon className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className={`rounded-lg px-3 py-2 max-w-[85%] ${
                        msg.role === 'ai' 
                          ? 'bg-indigo-900 text-indigo-100' 
                          : 'bg-green-900 text-green-100'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleNewCall}
                className="w-full flex items-center justify-center space-x-2 py-4 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all"
              >
                <PhoneIcon className="h-5 w-5" />
                <span>Start New Call</span>
              </button>
            </div>
          </div>
        )}

        {/* Failed State */}
        {callStatus === 'failed' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <XCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Call Failed</h3>
              <p className="text-sm text-red-600 mt-2">{error || 'An error occurred'}</p>
            </div>

            <button
              onClick={handleNewCall}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICallPanel;
