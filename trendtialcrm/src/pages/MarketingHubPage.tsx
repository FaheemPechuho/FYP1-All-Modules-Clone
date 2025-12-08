/**
 * MarketingHubPage - Main Marketing Hub Dashboard
 * 
 * This page serves as the central hub for all marketing-related activities
 * in the TrendtialCRM system. It connects to the Clara Marketing Agent backend
 * for AI-powered marketing intelligence and content generation.
 * 
 * Features:
 * - Content Studio: AI-powered content generation (emails, SMS, call scripts, ads)
 * - Lead Insights: Temperature scoring and priority analysis for leads
 * - Campaigns: Performance tracking and AI-generated optimization insights
 * 
 * Architecture:
 * - Frontend: React + TypeScript with TanStack Query for data fetching
 * - Backend: Clara Marketing Agent (Python FastAPI)
 * - AI: Google Gemini API for content generation
 * 
 * Related Files:
 * - Backend: clara-backend/agents/marketing_agent/
 * - API Service: src/services/marketingApi.ts
 * - Components: src/components/marketing/
 * 
 * Lead Scoring Algorithm (from Clara LeadAnalyzer):
 * - Deal Value: High (>$10k) = 25pts, Medium (>$1k) = 15pts, Low = 5pts
 * - Pipeline Stage: Negotiation = 25pts, Proposal = 20pts, Contact = 10pts, etc.
 * - Recency: Today = 20pts, This week = 15pts, This month = 10pts
 * - Lead Score: 25% of existing lead_score value
 * 
 * Temperature Classification:
 * - Hot (🔥): Score >= 70 - Ready to convert, immediate action needed
 * - Warm (🌡️): Score 40-69 - Good potential, needs nurturing
 * - Cold (❄️): Score < 40 - Low engagement, long-term nurturing
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { useLeadsQuery } from '../hooks/queries/useLeadsQuery';
import { Lead } from '../types';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TAB COMPONENTS
// =============================================================================

/**
 * ContentStudio - AI-powered content generation
 * Generates personalized emails, SMS, cold call scripts, and ad copy
 * Uses Google Gemini API via Clara Marketing Agent backend
 */
import ContentStudio from '../components/marketing/ContentStudio';

/**
 * LeadInsights - Lead temperature and priority analysis
 * Provides scoring based on deal value, recency, and pipeline stage
 * Uses same algorithm as backend LeadAnalyzer for consistency
 */
import LeadInsights from '../components/marketing/LeadInsights';

/**
 * Campaigns - Marketing campaign performance tracking
 * Shows source analytics, conversion rates, and AI-generated insights
 * Fetches data from Clara Marketing Agent's campaign stats API
 */
import Campaigns from '../components/marketing/Campaigns';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Available tabs in the Marketing Hub
 */
type TabType = 'content-studio' | 'lead-insights' | 'campaigns';

/**
 * Tab configuration with id, label, and icon
 */
interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

/**
 * Tab definitions with labels, icons, and descriptions
 * Icons use Heroicons for consistency with the rest of the app
 */
const TABS: TabConfig[] = [
  {
    id: 'content-studio',
    label: 'Content Studio',
    icon: <SparklesIcon className="h-5 w-5" />,
    description: 'Generate AI-powered marketing content'
  },
  {
    id: 'lead-insights',
    label: 'Lead Insights',
    icon: <ChartBarIcon className="h-5 w-5" />,
    description: 'Analyze lead temperature and priority'
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: <MegaphoneIcon className="h-5 w-5" />,
    description: 'Track campaign performance'
  }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const MarketingHubPage: React.FC = () => {
  // Track currently active tab
  const [activeTab, setActiveTab] = useState<TabType>('content-studio');
  
  /**
   * Fetch leads data using TanStack Query
   * This data is passed to child components for:
   * - ContentStudio: Lead selection for content personalization
   * - LeadInsights: Lead scoring and temperature analysis
   */
  const { data: leadsResponse, isLoading: isLoadingLeads } = useLeadsQuery({});
  const leads: Lead[] = leadsResponse?.leads || [];

  /**
   * Render tab navigation buttons
   * Active tab gets highlighted with primary color border
   */
  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Marketing Hub Tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              transition-colors duration-200
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {/* Tab Icon */}
            <span className={`mr-2 transition-colors ${
              activeTab === tab.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
            }`}>
              {tab.icon}
            </span>
            {/* Tab Label */}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  /**
   * Render active tab content
   * Each tab component receives leads data for various operations
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'content-studio':
        // ContentStudio: Uses leads for content personalization
        // Connects to /api/marketing/generate-* endpoints
        return <ContentStudio leads={leads} />;
        
      case 'lead-insights':
        // LeadInsights: Analyzes leads with temperature scoring
        // Uses local scoring algorithm matching backend LeadAnalyzer
        return <LeadInsights leads={leads} />;
        
      case 'campaigns':
        // Campaigns: Shows performance metrics and AI insights
        // Fetches from /api/marketing/campaign-insights
        return <Campaigns />;
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Marketing Hub</h1>
          <p className="mt-2 text-sm text-gray-600">
            Everything marketing in one place
            <span className="ml-2 text-xs text-gray-400">
              • {leads.length} leads loaded
              {isLoadingLeads && ' (refreshing...)'}
            </span>
          </p>
        </div>

        {/* Tab Navigation */}
        {renderTabs()}

        {/* Tab Content Area */}
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MarketingHubPage;
