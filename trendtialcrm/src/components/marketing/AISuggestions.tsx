// src/components/marketing/AISuggestions.tsx
import React from 'react';
import { Lead } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { SparklesIcon, FireIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface AISuggestionsProps {
  lead: Lead;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ lead }) => {
  // Calculate temperature
  const dealValue = lead.deal_value || 0;
  const isHighValue = dealValue > 50000;
  const isRecent = lead.created_at 
    ? new Date(lead.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : false;
  
  let temperature: 'hot' | 'warm' | 'cold' = 'cold';
  if (isHighValue && isRecent) {
    temperature = 'hot';
  } else if (isHighValue || isRecent) {
    temperature = 'warm';
  }

  // Calculate priority score
  const priorityScore = Math.min(
    (dealValue / 1000) + 
    (lead.status_bucket === 'P1' ? 50 : lead.status_bucket === 'P2' ? 25 : 0) +
    (isRecent ? 20 : 0),
    100
  );

  // Determine recommended action
  let recommendedAction = 'Follow up via email';
  if (temperature === 'hot') {
    recommendedAction = 'Schedule immediate call';
  } else if (temperature === 'warm') {
    recommendedAction = 'Send personalized email';
  } else {
    recommendedAction = 'Add to nurture sequence';
  }

  const getTemperatureDisplay = () => {
    switch (temperature) {
      case 'hot':
        return { icon: '🔥', label: 'Hot', color: 'text-red-600 bg-red-50' };
      case 'warm':
        return { icon: '🌡️', label: 'Warm', color: 'text-orange-600 bg-orange-50' };
      case 'cold':
        return { icon: '❄️', label: 'Cold', color: 'text-blue-600 bg-blue-50' };
    }
  };

  const tempDisplay = getTemperatureDisplay();

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <span>AI Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Temperature */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{tempDisplay.icon}</span>
            <div>
              <div className="text-sm font-medium text-gray-700">Temperature</div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tempDisplay.color} mt-1`}>
                {tempDisplay.label}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Priority Score</div>
            <div className="text-lg font-semibold text-gray-900">{Math.round(priorityScore)}</div>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <LightBulbIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">Recommended Action</div>
              <div className="text-sm text-blue-700 mt-1">{recommendedAction}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Open content generation modal
              alert('Opening content generation...');
            }}
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Open follow-up generation
              alert('Opening follow-up generation...');
            }}
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Write Follow-up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISuggestions;

