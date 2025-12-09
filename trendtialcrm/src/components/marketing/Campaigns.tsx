/**
 * Campaigns Component
 * 
 * Displays marketing campaign performance metrics and AI-generated insights.
 * Connects to Clara Marketing Agent backend for campaign analytics.
 * 
 * Features:
 * - Campaign performance table with key metrics
 * - Source-based analytics (conversion rates, cost per lead)
 * - AI-generated insights for campaign optimization
 * - Create new campaign functionality
 * - Performance comparison across channels
 * 
 * Backend: clara-backend/agents/marketing_agent/crm_connector.py
 * API Service: src/services/marketingApi.ts
 * 
 * @author Sheryar
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  PlusIcon, 
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

// Import types from marketing API service
// Note: Backend API calls are disabled - using local demo data
// To enable backend: uncomment getCampaignInsights import and update fetchCampaignData
import type {
  CampaignSource
} from '../../services/marketingApi';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Extended campaign type with UI-specific properties
 */
interface Campaign extends CampaignSource {
  id: string;
  costPerLead?: number;
  status?: 'active' | 'paused' | 'completed';
  channel?: string;
}

/**
 * Sort options for campaign table
 */
type SortField = 'name' | 'total_leads' | 'conversion_rate' | 'total_value';
type SortDirection = 'asc' | 'desc';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Channel icons mapping
 */
const CHANNEL_ICONS: Record<string, string> = {
  'Facebook Ads': '📘',
  'Google Ads': '🔍',
  'LinkedIn': '💼',
  'Email Marketing': '📧',
  'TikTok': '🎵',
  'Twitter': '🐦',
  'Instagram': '📸',
  'Referral': '🤝',
  'Organic': '🌱',
  'Direct': '🎯',
  'Unknown': '❓'
};

/**
 * Get channel icon with fallback
 */
const getChannelIcon = (source: string): string => {
  // Check for exact match first
  if (CHANNEL_ICONS[source]) return CHANNEL_ICONS[source];
  
  // Check for partial matches
  const lowerSource = source.toLowerCase();
  if (lowerSource.includes('facebook')) return '📘';
  if (lowerSource.includes('google')) return '🔍';
  if (lowerSource.includes('linkedin')) return '💼';
  if (lowerSource.includes('email')) return '📧';
  if (lowerSource.includes('tiktok')) return '🎵';
  if (lowerSource.includes('twitter')) return '🐦';
  if (lowerSource.includes('instagram')) return '📸';
  if (lowerSource.includes('referral')) return '🤝';
  if (lowerSource.includes('organic')) return '🌱';
  if (lowerSource.includes('direct')) return '🎯';
  
  return '📊';
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Campaigns: React.FC = () => {
  // Data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPipelineValue, setTotalPipelineValue] = useState(0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('total_leads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);

  /**
   * Load campaign data (using local data since backend may not be available)
   * In production, this would fetch from the Clara backend
   */
  const fetchCampaignData = async () => {
    setIsLoading(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use demo data (in production, this would call the backend API)
    setFallbackData();
    setIsLoading(false);
  };

  /**
   * Set fallback demo data when API is unavailable
   */
  const setFallbackData = () => {
    const fallbackCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Summer Sale 2024',
        total_leads: 245,
        total_value: 3800,
        closed_won: 31,
        conversion_rate: 12.5,
        costPerLead: 15.50,
        status: 'active',
        channel: 'Facebook Ads'
    },
    {
      id: '2',
      name: 'Product Launch Campaign',
        total_leads: 189,
        total_value: 4300,
        closed_won: 16,
        conversion_rate: 8.3,
        costPerLead: 22.75,
        status: 'active',
        channel: 'Google Ads'
    },
    {
      id: '3',
      name: 'Email Newsletter',
        total_leads: 156,
        total_value: 810,
        closed_won: 24,
        conversion_rate: 15.2,
        costPerLead: 5.20,
        status: 'active',
        channel: 'Email Marketing'
    },
    {
      id: '4',
      name: 'LinkedIn Outreach',
        total_leads: 98,
        total_value: 1200,
        closed_won: 18,
        conversion_rate: 18.7,
        costPerLead: 12.30,
        status: 'active',
        channel: 'LinkedIn'
      }
    ];
    
    setCampaigns(fallbackCampaigns);
    setInsights([
      'LinkedIn Outreach has the highest conversion rate (18.7%) - consider increasing budget',
      'Email Newsletter has lowest cost per lead ($5.20) - great ROI channel'
    ]);
    setTotalLeads(688);
    setTotalPipelineValue(10110);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchCampaignData();
  }, []);

  /**
   * Sort campaigns based on current sort settings
   */
  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'total_leads':
          aValue = a.total_leads;
          bValue = b.total_leads;
          break;
        case 'conversion_rate':
          aValue = a.conversion_rate;
          bValue = b.conversion_rate;
          break;
        case 'total_value':
          aValue = a.total_value;
          bValue = b.total_value;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [campaigns, sortField, sortDirection]);

  /**
   * Handle sort column click
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  /**
   * Render sort indicator
   */
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ArrowUpIcon className="h-4 w-4 ml-1" />
      : <ArrowDownIcon className="h-4 w-4 ml-1" />;
  };

  /**
   * Get performance badge color based on conversion rate
   */
  const getPerformanceBadge = (rate: number) => {
    if (rate >= 15) return 'bg-green-100 text-green-800 border-green-200';
    if (rate >= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage your marketing campaigns • {totalLeads} total leads • ${totalPipelineValue.toLocaleString()} pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchCampaignData}
            disabled={isLoading}
            className="flex items-center"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowNewCampaignModal(true)}
          >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Campaign
        </Button>
      </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Campaigns</p>
                <p className="text-2xl font-bold text-blue-700">{campaigns.length}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-green-700">{totalLeads.toLocaleString()}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Conversions</p>
                <p className="text-2xl font-bold text-purple-700">
                  {campaigns.reduce((sum, c) => sum + c.closed_won, 0)}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg. Conv. Rate</p>
                <p className="text-2xl font-bold text-orange-700">
                  {campaigns.length > 0 
                    ? (campaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / campaigns.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <span className="text-3xl">📈</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-purple-50 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <SparklesIcon className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Info Banner - Demo Mode */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-center text-blue-700">
            <SparklesIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">Demo Mode</span>
            <span className="text-sm text-blue-600 ml-2">
              - Showing sample campaign data. Connect Clara backend for live data.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-500">Loading campaigns...</span>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                      <button 
                        onClick={() => handleSort('name')}
                        className="flex items-center hover:text-primary transition-colors"
                      >
                    Campaign Name
                        {renderSortIndicator('name')}
                      </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                      <button 
                        onClick={() => handleSort('total_leads')}
                        className="flex items-center hover:text-primary transition-colors"
                      >
                    Leads Count
                        {renderSortIndicator('total_leads')}
                      </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                      <button 
                        onClick={() => handleSort('conversion_rate')}
                        className="flex items-center hover:text-primary transition-colors"
                      >
                    Conversion Rate
                        {renderSortIndicator('conversion_rate')}
                      </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Cost per Lead
                  </th>
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="mr-2 text-lg">{getChannelIcon(campaign.channel || campaign.name)}</span>
                          {campaign.channel || campaign.name}
                        </div>
                    </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">{campaign.total_leads}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({campaign.closed_won} won)
                        </span>
                    </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${getPerformanceBadge(campaign.conversion_rate)}`}>
                          {campaign.conversion_rate}%
                        </span>
                    </td>
                      <td className="py-4 px-4">
                      <span className="text-sm text-gray-700">
                          ${campaign.costPerLead?.toFixed(2) || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              
              {/* Empty State */}
              {campaigns.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No campaigns found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Create your first campaign to start tracking performance
                  </p>
                  <Button 
                    className="mt-4 bg-primary hover:bg-primary/90"
                    onClick={() => setShowNewCampaignModal(true)}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Campaign
                  </Button>
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      {/* AI Attribution Footer */}
      <div className="flex items-center justify-center text-xs text-gray-500">
        <SparklesIcon className="h-3.5 w-3.5 mr-1" />
        Campaign analytics powered by Clara Marketing Intelligence
      </div>

      {/* New Campaign Modal Placeholder */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                Campaign creation functionality coming soon! This will allow you to:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Set up tracking for different marketing channels</li>
                <li>Configure UTM parameters automatically</li>
                <li>Set budget and conversion goals</li>
                <li>Get AI recommendations for targeting</li>
              </ul>
              <div className="flex justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewCampaignModal(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
