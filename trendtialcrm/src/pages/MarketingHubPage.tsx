// src/pages/MarketingHubPage.tsx
import React, { useState } from 'react';
import { useLeadsQuery } from '../hooks/queries/useLeadsQuery';
import { Lead } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  MegaphoneIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Tab components
import ContentStudio from '../components/marketing/ContentStudio';
import LeadInsights from '../components/marketing/LeadInsights';
import Campaigns from '../components/marketing/Campaigns';

type TabType = 'content-studio' | 'lead-insights' | 'campaigns';

const MarketingHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('content-studio');
  const { data: leadsResponse } = useLeadsQuery({});
  const leads: Lead[] = leadsResponse?.leads || [];

  const tabs = [
    {
      id: 'content-studio' as TabType,
      label: 'Content Studio',
      icon: <SparklesIcon className="h-5 w-5" />
    },
    {
      id: 'lead-insights' as TabType,
      label: 'Lead Insights',
      icon: <ChartBarIcon className="h-5 w-5" />
    },
    {
      id: 'campaigns' as TabType,
      label: 'Campaigns',
      icon: <MegaphoneIcon className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Marketing Hub</h1>
          <p className="mt-2 text-sm text-gray-600">
            Everything marketing in one place
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'content-studio' && <ContentStudio leads={leads} />}
          {activeTab === 'lead-insights' && <LeadInsights leads={leads} />}
          {activeTab === 'campaigns' && <Campaigns />}
        </div>
      </div>
    </div>
  );
};

export default MarketingHubPage;

