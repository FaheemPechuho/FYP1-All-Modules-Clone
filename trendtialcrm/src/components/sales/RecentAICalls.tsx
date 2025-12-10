/**
 * RecentAICalls - Display recent AI-handled calls
 * 
 * Shows a list of recent calls with:
 * - Lead information
 * - Call duration
 * - Outcome and qualification status
 * - Quick actions
 * 
 * @author Faheem
 */

import React from 'react';
import { 
  PhoneIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

// Using existing Call type from the project
interface Call {
  id: string;
  lead_id: string;
  duration: number;
  call_type: 'inbound' | 'outbound' | 'callback' | 'voicemail';
  outcome: string;
  notes: string | null;
  call_start_time: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
  // Extended for lead info
  lead?: {
    company_name?: string;
    contact_person?: string | null;
    lead_score?: number | null;
  };
}

interface RecentAICallsProps {
  calls: Call[];
  isLoading: boolean;
  onCallSelect?: (call: Call) => void;
  onViewAll?: () => void;
  limit?: number;
}

// Format duration to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get outcome badge
const getOutcomeBadge = (outcome: string) => {
  switch (outcome) {
    case 'completed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    case 'qualified':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Qualified
        </span>
      );
    case 'not_interested':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Not Interested
        </span>
      );
    case 'no_answer':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          No Answer
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {outcome}
        </span>
      );
  }
};

// Get score color
const getScoreColor = (score: number | null | undefined): string => {
  if (!score) return 'text-gray-400';
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

const RecentAICalls: React.FC<RecentAICallsProps> = ({
  calls,
  isLoading,
  onCallSelect,
  onViewAll,
  limit = 5,
}) => {
  const displayCalls = calls.slice(0, limit);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent AI Calls</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent AI Calls</h3>
          <p className="text-sm text-gray-500">{calls.length} total calls</p>
        </div>
        {onViewAll && calls.length > limit && (
          <button
            onClick={onViewAll}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
          >
            View All
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>

      {/* Calls List */}
      {displayCalls.length === 0 ? (
        <div className="p-8 text-center">
          <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <PhoneIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900">No calls yet</h4>
          <p className="text-sm text-gray-500 mt-1">
            Start your first AI sales call to see it here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {displayCalls.map((call) => (
            <div
              key={call.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onCallSelect?.(call)}
            >
              <div className="flex items-center space-x-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
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

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {call.lead?.contact_person || call.lead?.company_name || 'Unknown Lead'}
                    </p>
                    {call.lead?.lead_score !== undefined && call.lead?.lead_score !== null && (
                      <span className={`text-xs font-medium ${getScoreColor(call.lead.lead_score)}`}>
                        {call.lead.lead_score}/100
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {formatDuration(call.duration)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(call.call_start_time), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Outcome Badge */}
                <div className="flex-shrink-0">
                  {getOutcomeBadge(call.outcome)}
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  <button
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCallSelect?.(call);
                    }}
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notes Preview */}
              {call.notes && (
                <p className="mt-2 ml-14 text-xs text-gray-500 line-clamp-1">
                  {call.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentAICalls;

