/**
 * LeadAICalls - Display AI calls for a specific lead
 * 
 * Shows AI call history with transcripts and outcomes
 * for the selected lead in the Lead Drawer.
 * 
 * @author Faheem
 */

import React, { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Lead } from '../../types';
import { salesCallApi, CRMCallRecord } from '../../services/salesCallApi';

interface LeadAICallsProps {
  lead: Lead;
}

// Format duration to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get outcome badge
const getOutcomeBadge = (outcome: string) => {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    completed: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircleIcon className="h-3 w-3 mr-1" /> },
    qualified: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <CheckCircleIcon className="h-3 w-3 mr-1" /> },
    not_interested: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <XCircleIcon className="h-3 w-3 mr-1" /> },
    no_answer: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: null },
    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircleIcon className="h-3 w-3 mr-1" /> },
    in_progress: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: null },
    follow_up_scheduled: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <CheckCircleIcon className="h-3 w-3 mr-1" /> },
  };
  
  const style = styles[outcome] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: null };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.icon}
      {outcome?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
    </span>
  );
};

// BANT Badge Component
const BANTBadge: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const getColor = (value: string) => {
    if (value === 'unknown') return 'bg-gray-100 text-gray-600';
    if (['high', 'yes', 'immediate', 'urgent'].includes(value)) return 'bg-green-100 text-green-700';
    if (['medium', 'influencer', 'this_quarter'].includes(value)) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };
  
  return (
    <div className={`px-2 py-1 rounded text-xs ${getColor(value)}`}>
      <span className="font-medium">{label}:</span> {value.replace(/_/g, ' ')}
    </div>
  );
};

export const LeadAICalls: React.FC<LeadAICallsProps> = ({ lead }) => {
  const [calls, setCalls] = useState<CRMCallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  // Fetch calls for this lead
  useEffect(() => {
    const fetchLeadCalls = async () => {
      setIsLoading(true);
      try {
        const response = await salesCallApi.getCallHistory(100);
        if (response.success) {
          // Filter calls for this specific lead
          const leadCalls = response.calls.filter(call => call.lead_id === lead.id);
          setCalls(leadCalls);
        }
      } catch (error) {
        console.error('Failed to fetch lead calls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (lead.id) {
      fetchLeadCalls();
    }
  }, [lead.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <PhoneIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Calls Yet</h3>
        <p className="text-gray-500 mb-4">
          Start an AI-powered sales call with this lead from the Sales Hub.
        </p>
        <a 
          href="/sales" 
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <SparklesIcon className="h-4 w-4 mr-2" />
          Go to AI Call Center
        </a>
      </div>
    );
  }

  // Calculate summary stats
  const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
  const avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;
  const qualifiedCalls = calls.filter(c => ['qualified', 'completed'].includes(c.outcome)).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{calls.length}</div>
          <div className="text-indigo-100 text-sm">Total AI Calls</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
          <div className="text-green-100 text-sm">Avg Duration</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{qualifiedCalls}</div>
          <div className="text-blue-100 text-sm">Qualified Calls</div>
        </div>
      </div>

      {/* Calls List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Call History
        </h3>
        
        {calls.map(call => (
          <div 
            key={call.id} 
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Call Header */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    call.outcome === 'completed' || call.outcome === 'qualified'
                      ? 'bg-green-100'
                      : call.outcome === 'failed'
                      ? 'bg-red-100'
                      : 'bg-gray-100'
                  }`}>
                    <PhoneIcon className={`h-5 w-5 ${
                      call.outcome === 'completed' || call.outcome === 'qualified'
                        ? 'text-green-600'
                        : call.outcome === 'failed'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {format(new Date(call.call_start_time), 'MMM d, yyyy h:mm a')}
                      </span>
                      {getOutcomeBadge(call.outcome)}
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatDuration(call.duration || 0)}
                      </span>
                      {call.lead_score_after !== null && (
                        <span>Score: {call.lead_score_after}/100</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {expandedCall === call.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedCall === call.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                {/* BANT Assessment */}
                {call.bant_assessment && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">BANT Assessment</h4>
                    <div className="flex flex-wrap gap-2">
                      <BANTBadge label="Budget" value={call.bant_assessment.budget || 'unknown'} />
                      <BANTBadge label="Authority" value={call.bant_assessment.authority || 'unknown'} />
                      <BANTBadge label="Need" value={call.bant_assessment.need || 'unknown'} />
                      <BANTBadge label="Timeline" value={call.bant_assessment.timeline || 'unknown'} />
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {call.transcript && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Transcript</h4>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 max-h-60 overflow-y-auto">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
                        {call.transcript}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {call.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-white rounded-lg border border-gray-200 p-3">
                      {call.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadAICalls;

