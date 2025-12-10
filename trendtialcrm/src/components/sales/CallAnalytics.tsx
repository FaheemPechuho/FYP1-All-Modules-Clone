/**
 * CallAnalytics - Sales call analytics and charts
 * 
 * Displays analytics including:
 * - BANT completion rates
 * - Outcome distribution
 * - Calls over time
 * - Performance metrics
 * 
 * @author Faheem
 */

import React from 'react';
import { 
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { CallAnalyticsProps, BANTStats } from '../../types/sales';

// Progress bar component
interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max, color }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Outcome card component
interface OutcomeCardProps {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

const OutcomeCard: React.FC<OutcomeCardProps> = ({ label, count, total, color, icon }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{count}</p>
          <p className="text-xs opacity-70">{percentage}% of total</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
};

const CallAnalytics: React.FC<CallAnalyticsProps> = ({ 
  stats, 
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default values
  const totalCalls = stats?.totalCalls || 0;
  const outcomes = stats?.outcomes || {};
  const qualificationBreakdown = stats?.qualificationBreakdown || {
    unqualified: 0,
    marketing_qualified: 0,
    sales_qualified: 0,
    opportunity: 0,
  };

  // Calculate BANT stats from qualification breakdown
  const bantStats: BANTStats = {
    budgetIdentified: Math.round(totalCalls * 0.72), // Mock data
    authorityConfirmed: Math.round(totalCalls * 0.58),
    needAssessed: Math.round(totalCalls * 0.91),
    timelineEstablished: Math.round(totalCalls * 0.45),
    total: totalCalls,
  };

  return (
    <div className="space-y-6">
      {/* BANT Assessment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <ChartBarIcon className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">BANT Assessment Rates</h3>
        </div>
        
        <div className="space-y-4">
          <ProgressBar
            label="Budget Identified"
            value={bantStats.budgetIdentified}
            max={bantStats.total}
            color="bg-green-500"
          />
          <ProgressBar
            label="Authority Confirmed"
            value={bantStats.authorityConfirmed}
            max={bantStats.total}
            color="bg-blue-500"
          />
          <ProgressBar
            label="Need Assessed"
            value={bantStats.needAssessed}
            max={bantStats.total}
            color="bg-purple-500"
          />
          <ProgressBar
            label="Timeline Established"
            value={bantStats.timelineEstablished}
            max={bantStats.total}
            color="bg-orange-500"
          />
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Full BANT Completion</span>
            <span className="font-semibold text-indigo-600">
              {Math.round((bantStats.budgetIdentified + bantStats.authorityConfirmed + bantStats.needAssessed + bantStats.timelineEstablished) / (bantStats.total * 4) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Outcome Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Call Outcomes</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <OutcomeCard
            label="Completed"
            count={outcomes['completed'] || 0}
            total={totalCalls}
            color="bg-green-50 text-green-700"
            icon={<CheckCircleIcon className="h-8 w-8" />}
          />
          <OutcomeCard
            label="Qualified"
            count={outcomes['qualified'] || 0}
            total={totalCalls}
            color="bg-blue-50 text-blue-700"
            icon={<CheckCircleIcon className="h-8 w-8" />}
          />
          <OutcomeCard
            label="No Answer"
            count={outcomes['no_answer'] || 0}
            total={totalCalls}
            color="bg-yellow-50 text-yellow-700"
            icon={<XCircleIcon className="h-8 w-8" />}
          />
          <OutcomeCard
            label="Failed"
            count={outcomes['failed'] || 0}
            total={totalCalls}
            color="bg-red-50 text-red-700"
            icon={<XCircleIcon className="h-8 w-8" />}
          />
        </div>
      </div>

      {/* Qualification Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Qualification Funnel</h3>
        
        <div className="space-y-3">
          {/* Unqualified */}
          <div className="relative">
            <div 
              className="h-10 bg-gray-100 rounded-lg flex items-center px-4"
              style={{ width: '100%' }}
            >
              <span className="text-sm font-medium text-gray-600">Unqualified</span>
              <span className="ml-auto text-sm font-bold text-gray-900">
                {qualificationBreakdown.unqualified}
              </span>
            </div>
          </div>
          
          {/* MQL */}
          <div className="relative">
            <div 
              className="h-10 bg-yellow-100 rounded-lg flex items-center px-4"
              style={{ width: totalCalls > 0 
                ? `${Math.max(40, ((qualificationBreakdown.marketing_qualified + qualificationBreakdown.sales_qualified + qualificationBreakdown.opportunity) / totalCalls) * 100)}%` 
                : '40%' 
              }}
            >
              <span className="text-sm font-medium text-yellow-700">MQL</span>
              <span className="ml-auto text-sm font-bold text-yellow-900">
                {qualificationBreakdown.marketing_qualified}
              </span>
            </div>
          </div>
          
          {/* SQL */}
          <div className="relative">
            <div 
              className="h-10 bg-blue-100 rounded-lg flex items-center px-4"
              style={{ width: totalCalls > 0 
                ? `${Math.max(30, ((qualificationBreakdown.sales_qualified + qualificationBreakdown.opportunity) / totalCalls) * 100)}%` 
                : '30%' 
              }}
            >
              <span className="text-sm font-medium text-blue-700">SQL</span>
              <span className="ml-auto text-sm font-bold text-blue-900">
                {qualificationBreakdown.sales_qualified}
              </span>
            </div>
          </div>
          
          {/* Opportunity */}
          <div className="relative">
            <div 
              className="h-10 bg-green-100 rounded-lg flex items-center px-4"
              style={{ width: totalCalls > 0 
                ? `${Math.max(20, (qualificationBreakdown.opportunity / totalCalls) * 100)}%` 
                : '20%' 
              }}
            >
              <span className="text-sm font-medium text-green-700">Opportunity</span>
              <span className="ml-auto text-sm font-bold text-green-900">
                {qualificationBreakdown.opportunity}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Conversion rate: <span className="font-medium text-gray-700">
              {totalCalls > 0 
                ? Math.round((qualificationBreakdown.opportunity / totalCalls) * 100) 
                : 0}%
            </span> to Opportunity
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">AI Performance Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold">{totalCalls}</p>
            <p className="text-sm opacity-80">Total AI Calls</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {totalCalls > 0 
                ? Math.round(((outcomes['completed'] || 0) + (outcomes['qualified'] || 0)) / totalCalls * 100) 
                : 0}%
            </p>
            <p className="text-sm opacity-80">Success Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {stats?.averageDurationSeconds 
                ? `${Math.floor(stats.averageDurationSeconds / 60)}:${String(Math.round(stats.averageDurationSeconds % 60)).padStart(2, '0')}`
                : '0:00'}
            </p>
            <p className="text-sm opacity-80">Avg Duration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallAnalytics;

