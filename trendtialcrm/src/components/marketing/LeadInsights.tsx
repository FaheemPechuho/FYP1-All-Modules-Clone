/**
 * LeadInsights Component
 * 
 * Displays marketing intelligence for leads including temperature scoring,
 * priority ranking, and recommended actions. Connects to Clara Marketing Agent
 * backend for AI-powered lead analysis.
 * 
 * Features:
 * - Lead temperature classification (hot, warm, cold)
 * - Priority scoring (0-100) based on deal value, recency, and engagement
 * - AI-recommended actions for each lead
 * - Filter by temperature and search functionality
 * - Sortable columns for easy analysis
 * 
 * Lead Scoring Logic (from backend LeadAnalyzer):
 * - Deal Value: High (>$10k) = 25pts, Medium (>$1k) = 15pts, Low = 5pts
 * - Pipeline Stage: Negotiation = 25pts, Proposal = 20pts, etc.
 * - Recency: Today = 20pts, This week = 15pts, This month = 10pts
 * - Lead Score: Weighted contribution (25% of existing score)
 * 
 * Backend: clara-backend/agents/marketing_agent/lead_analyzer.py
 * API Service: src/services/marketingApi.ts
 * 
 * @author Sheryar
 */

import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Import marketing API service
import {
  calculateLocalLeadScore,
  getRecommendedAction,
  getActionReason,
  LeadTemperature,
  LeadPriority
} from '../../services/marketingApi';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface LeadInsightsProps {
  leads: Lead[];
}

/**
 * Sorting options for the leads table
 */
type SortField = 'temperature' | 'priority' | 'name' | 'dealValue';
type SortDirection = 'asc' | 'desc';

/**
 * Extended lead type with calculated insights
 * These values are computed locally using the same algorithm as the backend
 */
interface LeadWithInsights extends Lead {
  temperature: LeadTemperature;
  temperatureScore: number;  // 0-100 score
  priorityScore: number;     // 0-100 priority score
  priority: LeadPriority;
  recommendedAction: string;
  actionReason: string;
  riskFactors: string[];
  nurturingStage: 'awareness' | 'consideration' | 'decision' | 'retention';
}

// =============================================================================
// TEMPERATURE CONFIGURATION
// =============================================================================

/**
 * Temperature display configuration
 * Matches backend LeadAnalyzer thresholds
 */
const TEMPERATURE_CONFIG = {
  hot: {
    icon: '🔥',
    label: 'HOT',
    color: 'text-red-600 bg-red-50 border-red-200',
    bgGradient: 'from-red-50 to-orange-50',
    threshold: 70  // Score >= 70
  },
  warm: {
    icon: '🌡️',
    label: 'WARM',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    bgGradient: 'from-orange-50 to-yellow-50',
    threshold: 40  // Score >= 40 and < 70
  },
  cold: {
    icon: '❄️',
    label: 'COLD',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    bgGradient: 'from-blue-50 to-cyan-50',
    threshold: 0   // Score < 40
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate nurturing stage based on pipeline position
 * Mirrors backend _get_nurturing_stage logic
 */
function getNurturingStage(lead: Lead): 'awareness' | 'consideration' | 'decision' | 'retention' {
  const stage = lead.status_bucket || 'P3';
  
  // Map status buckets to nurturing stages
  if (stage === 'P1') return 'decision';  // High priority = decision stage
  if (stage === 'P2') return 'consideration';  // Medium = consideration
  return 'awareness';  // P3 = awareness stage
}

/**
 * Identify risk factors for a lead
 * Mirrors backend _identify_risks logic
 */
function identifyRisks(lead: Lead): string[] {
  const risks: string[] = [];
  
  // Check for stale leads
  if (lead.updated_at) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 30) {
      risks.push(`No activity in ${daysSinceUpdate} days - risk of going cold`);
    } else if (daysSinceUpdate > 14) {
      risks.push('Follow-up overdue - needs attention');
    }
  }
  
  // High value in early stage
  const dealValue = lead.deal_value || 0;
  if (dealValue > 10000 && lead.status_bucket === 'P3') {
    risks.push('High-value lead stuck in early stage');
  }
  
  // Missing contact info
  if (!lead.email && !lead.phone) {
    risks.push('Missing contact information');
  }
  
  // Missing industry
  if (!lead.industry) {
    risks.push('Industry unknown - harder to personalize');
  }
  
  return risks;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const LeadInsights: React.FC<LeadInsightsProps> = ({ leads }) => {
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<LeadTemperature | 'all'>('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  

  /**
   * Calculate insights for each lead using local scoring algorithm
   * This mirrors the backend LeadAnalyzer logic for instant results
   * In production, you could optionally fetch from backend for more accuracy
   */
  const leadsWithInsights: LeadWithInsights[] = useMemo(() => {
    return leads.map((lead) => {
      // Calculate temperature score using the same algorithm as backend
      const { score, temperature, priority } = calculateLocalLeadScore({
        deal_value: lead.deal_value,
        status_bucket: lead.status_bucket,
        created_at: lead.created_at,
        lead_score: lead.lead_score
      });
      
      // Get recommended action based on temperature
      const recommendedAction = getRecommendedAction(temperature);
      
      // Get action reason
      const actionReason = getActionReason(temperature, score, lead.deal_value || 0);
      
      // Identify risk factors
      const riskFactors = identifyRisks(lead);
      
      // Determine nurturing stage
      const nurturingStage = getNurturingStage(lead);

      return {
        ...lead,
        temperature,
        temperatureScore: score,
        priorityScore: score,  // Using same score for priority ranking
        priority,
        recommendedAction,
        actionReason,
        riskFactors,
        nurturingStage
      };
    });
  }, [leads]);

  /**
   * Filter and sort leads based on current filters
   */
  const filteredAndSortedLeads = useMemo(() => {
    // First, filter by search and temperature
    let filtered = leadsWithInsights.filter((lead) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (lead.clients?.client_name?.toLowerCase().includes(searchLower)) ||
        (lead.contact_person?.toLowerCase().includes(searchLower)) ||
        (lead.clients?.company?.toLowerCase().includes(searchLower)) ||
        (lead.industry?.toLowerCase().includes(searchLower));
      
      // Temperature filter
      const matchesTemperature = temperatureFilter === 'all' || lead.temperature === temperatureFilter;
      
      return matchesSearch && matchesTemperature;
    });

    // Then sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'temperature':
          const tempOrder = { hot: 3, warm: 2, cold: 1 };
          aValue = tempOrder[a.temperature];
          bValue = tempOrder[b.temperature];
          break;
        case 'priority':
          aValue = a.priorityScore;
          bValue = b.priorityScore;
          break;
        case 'name':
          aValue = (a.clients?.client_name || a.contact_person || '').toLowerCase();
          bValue = (b.clients?.client_name || b.contact_person || '').toLowerCase();
          break;
        case 'dealValue':
          aValue = a.deal_value || 0;
          bValue = b.deal_value || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [leadsWithInsights, searchTerm, temperatureFilter, sortField, sortDirection]);

  /**
   * Calculate summary statistics
   */
  const stats = useMemo(() => {
    const hot = leadsWithInsights.filter(l => l.temperature === 'hot').length;
    const warm = leadsWithInsights.filter(l => l.temperature === 'warm').length;
    const cold = leadsWithInsights.filter(l => l.temperature === 'cold').length;
    const totalValue = leadsWithInsights.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    
    return { hot, warm, cold, total: leadsWithInsights.length, totalValue };
  }, [leadsWithInsights]);

  /**
   * Handle column sort toggle
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Hot Leads */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Hot Leads</p>
                <p className="text-2xl font-bold text-red-700">{stats.hot}</p>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
          </CardContent>
        </Card>
        
        {/* Warm Leads */}
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Warm Leads</p>
                <p className="text-2xl font-bold text-orange-700">{stats.warm}</p>
              </div>
              <div className="text-3xl">🌡️</div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cold Leads */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Cold Leads</p>
                <p className="text-2xl font-bold text-blue-700">{stats.cold}</p>
              </div>
              <div className="text-3xl">❄️</div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Pipeline Value */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Pipeline Value</p>
                <p className="text-2xl font-bold text-green-700">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads by name, company, or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            
            {/* Temperature Filter */}
            <div className="flex gap-2">
              <select
                value={temperatureFilter}
                onChange={(e) => setTemperatureFilter(e.target.value as LeadTemperature | 'all')}
                className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white
                  focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="all">All Temperatures</option>
                <option value="hot">🔥 Hot Leads</option>
                <option value="warm">🌡️ Warm Leads</option>
                <option value="cold">❄️ Cold Leads</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <SparklesIcon className="h-5 w-5 mr-2 text-primary" />
              Lead Insights
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredAndSortedLeads.length} leads)
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {/* Lead Name Column */}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Lead Name
                      {renderSortIndicator('name')}
                    </button>
                  </th>
                  
                  {/* Temperature Column */}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <button
                      onClick={() => handleSort('temperature')}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Temperature
                      {renderSortIndicator('temperature')}
                    </button>
                  </th>
                  
                  {/* Priority Score Column */}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Priority Score
                      {renderSortIndicator('priority')}
                    </button>
                  </th>
                  
                  {/* Recommended Action Column */}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Recommended Action
                  </th>
                  
                  {/* Why Column */}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedLeads.map((lead) => {
                  const tempConfig = TEMPERATURE_CONFIG[lead.temperature];
                  
                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Lead Name */}
                      <td className="py-4 px-4">
                        <div>
                      <div className="font-medium text-gray-900">
                        {lead.clients?.client_name || lead.contact_person || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                            {lead.clients?.company || lead.industry || 'No company info'}
                          </div>
                      </div>
                    </td>
                      
                      {/* Temperature Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${tempConfig.color}`}>
                          <span className="mr-1.5">{tempConfig.icon}</span>
                          {tempConfig.label}
                      </span>
                    </td>
                      
                      {/* Priority Score with Progress Bar */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-900 w-8">
                            {lead.priorityScore}
                          </span>
                          <div className="flex-1 max-w-[100px]">
                            <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  lead.temperature === 'hot' ? 'bg-red-500' :
                                  lead.temperature === 'warm' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${lead.priorityScore}%` }}
                          />
                            </div>
                        </div>
                      </div>
                    </td>
                      
                      {/* Recommended Action */}
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <span className={`mr-2 p-1 rounded ${
                            lead.recommendedAction.includes('call') ? 'bg-green-100 text-green-600' :
                            lead.recommendedAction.includes('email') ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {lead.recommendedAction.includes('call') ? <PhoneIcon className="h-4 w-4" /> :
                             lead.recommendedAction.includes('email') ? <EnvelopeIcon className="h-4 w-4" /> :
                             <ClockIcon className="h-4 w-4" />}
                          </span>
                          {lead.recommendedAction}
                        </div>
                    </td>
                      
                      {/* Why (Tooltip) */}
                      <td className="py-4 px-4">
                      <div className="group relative">
                          <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                          
                          {/* Tooltip */}
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-20">
                          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-lg">
                              <p className="font-medium mb-1">{lead.actionReason}</p>
                              
                              {/* Risk factors */}
                              {lead.riskFactors.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                  <p className="text-yellow-400 font-medium text-xs mb-1">Risk Factors:</p>
                                  <ul className="text-xs space-y-0.5">
                                    {lead.riskFactors.map((risk, idx) => (
                                      <li key={idx} className="flex items-start">
                                        <ExclamationTriangleIcon className="h-3 w-3 mr-1 mt-0.5 text-yellow-400 flex-shrink-0" />
                                        {risk}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Scoring details */}
                              <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
                                <p>Score: {lead.temperatureScore}/100</p>
                                <p>Stage: {lead.nurturingStage}</p>
                                <p>Deal: ${(lead.deal_value || 0).toLocaleString()}</p>
                              </div>
                              
                              {/* Arrow */}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Empty State */}
            {filteredAndSortedLeads.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No leads found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Badge */}
      <div className="flex items-center justify-center text-xs text-gray-500">
        <SparklesIcon className="h-3.5 w-3.5 mr-1" />
        Lead scoring powered by Clara Marketing Intelligence
      </div>
    </div>
  );
};

export default LeadInsights;
