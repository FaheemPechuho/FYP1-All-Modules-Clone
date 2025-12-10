/**
 * CallDashboard - Sales call statistics overview
 * 
 * Displays key metrics for AI-powered sales calls:
 * - Total calls
 * - Average duration
 * - Qualification rate
 * - Success rate
 * 
 * @author Faheem
 */

import React from 'react';
import { 
  PhoneIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { CallDashboardProps } from '../../types/sales';

// Stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center text-sm">
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-gray-500 ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className={`rounded-full p-3 ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Format seconds to MM:SS or HH:MM:SS
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `0:${seconds.toString().padStart(2, '0')}`;
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const CallDashboard: React.FC<CallDashboardProps> = ({ 
  stats, 
  isLoading,
  onRefresh 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-gray-50 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  // Default values if no stats
  const totalCalls = stats?.totalCalls || 0;
  const avgDuration = stats?.averageDurationSeconds || 0;
  const qualificationRate = stats?.qualificationRate || 0;
  const successRate = stats?.successRate || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Call Overview</h2>
          <p className="text-sm text-gray-500">AI-powered sales call metrics</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Calls"
          value={totalCalls}
          subtitle="All AI calls"
          icon={<PhoneIcon className="h-6 w-6" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        
        <StatCard
          title="Avg Duration"
          value={formatDuration(Math.round(avgDuration))}
          subtitle="Per call"
          icon={<ClockIcon className="h-6 w-6" />}
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
        
        <StatCard
          title="Qualified"
          value={`${Math.round(qualificationRate)}%`}
          subtitle="Lead qualification rate"
          icon={<CheckCircleIcon className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        
        <StatCard
          title="Success Rate"
          value={`${Math.round(successRate)}%`}
          subtitle="Completed calls"
          icon={<ChartBarIcon className="h-6 w-6" />}
          trend={{ value: 3, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Qualification Breakdown */}
      {stats?.qualificationBreakdown && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Qualification Breakdown</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {stats.qualificationBreakdown.unqualified}
              </div>
              <div className="text-xs text-gray-500">Unqualified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {stats.qualificationBreakdown.marketing_qualified}
              </div>
              <div className="text-xs text-gray-500">MQL</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.qualificationBreakdown.sales_qualified}
              </div>
              <div className="text-xs text-gray-500">SQL</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.qualificationBreakdown.opportunity}
              </div>
              <div className="text-xs text-gray-500">Opportunity</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallDashboard;

