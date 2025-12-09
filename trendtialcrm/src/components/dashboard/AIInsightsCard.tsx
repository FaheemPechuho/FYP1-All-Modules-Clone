// src/components/dashboard/AIInsightsCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SparklesIcon, FireIcon, CloudIcon } from '@heroicons/react/24/outline';
import { Lead } from '../../types';

interface AIInsightsCardProps {
  leads: Lead[];
}

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ leads }) => {
  // Calculate insights
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const hotLeads = leads.filter(lead => {
    const dealValue = lead.deal_value || 0;
    const isHighValue = dealValue > 50000;
    const isRecent = lead.created_at 
      ? new Date(lead.created_at).getTime() > thirtyDaysAgo
      : false;
    return isHighValue && isRecent;
  }).length;

  const coldLeads = leads.filter(lead => {
    const lastActivity = lead.updated_at || lead.created_at;
    if (!lastActivity) return false;
    const lastActivityTime = new Date(lastActivity).getTime();
    return lastActivityTime < thirtyDaysAgo;
  }).length;

  const insights = [
    {
      id: 1,
      text: `${hotLeads} hot leads need attention`,
      icon: <FireIcon className="h-4 w-4 text-red-500" />,
      priority: 'high'
    },
    {
      id: 2,
      text: `${coldLeads} leads going cold`,
      icon: <CloudIcon className="h-4 w-4 text-blue-500" />,
      priority: 'medium'
    },
    {
      id: 3,
      text: 'Review pipeline for optimization opportunities',
      icon: <SparklesIcon className="h-4 w-4 text-purple-500" />,
      priority: 'low'
    }
  ].slice(0, 3); // Top 3 actionable items

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <span>AI Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="mt-0.5">{insight.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {insight.text}
                </p>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No insights available at this time
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsightsCard;

