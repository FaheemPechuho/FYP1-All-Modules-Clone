// src/components/marketing/LeadInsights.tsx
import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface LeadInsightsProps {
  leads: Lead[];
}

type Temperature = 'hot' | 'warm' | 'cold';
type SortField = 'temperature' | 'priority' | 'name' | 'dealValue';
type SortDirection = 'asc' | 'desc';

interface LeadWithInsights extends Lead {
  temperature: Temperature;
  priorityScore: number;
  recommendedAction: string;
  why: string;
}

const LeadInsights: React.FC<LeadInsightsProps> = ({ leads }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [temperatureFilter, setTemperatureFilter] = useState<Temperature | 'all'>('all');

  // Calculate insights for each lead
  const leadsWithInsights: LeadWithInsights[] = useMemo(() => {
    return leads.map((lead) => {
      // Calculate temperature based on deal value, status, and recency
      const dealValue = lead.deal_value || 0;
      const isHighValue = dealValue > 50000;
      const isRecent = lead.created_at 
        ? new Date(lead.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : false;
      
      let temperature: Temperature = 'cold';
      if (isHighValue && isRecent) {
        temperature = 'hot';
      } else if (isHighValue || isRecent) {
        temperature = 'warm';
      }

      // Calculate priority score (0-100)
      const priorityScore = Math.min(
        (dealValue / 1000) + 
        (lead.status_bucket === 'P1' ? 50 : lead.status_bucket === 'P2' ? 25 : 0) +
        (isRecent ? 20 : 0),
        100
      );

      // Determine recommended action
      let recommendedAction = 'Follow up via email';
      let why = 'Standard follow-up recommended';
      
      if (temperature === 'hot') {
        recommendedAction = 'Schedule immediate call';
        why = 'High-value lead with recent activity';
      } else if (temperature === 'warm') {
        recommendedAction = 'Send personalized email';
        why = 'Good potential, needs nurturing';
      } else {
        recommendedAction = 'Add to nurture sequence';
        why = 'Low engagement, long-term nurturing needed';
      }

      return {
        ...lead,
        temperature,
        priorityScore: Math.round(priorityScore),
        recommendedAction,
        why
      };
    });
  }, [leads]);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leadsWithInsights.filter((lead) => {
      const matchesSearch = 
        lead.clients?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTemperature = temperatureFilter === 'all' || lead.temperature === temperatureFilter;
      
      return matchesSearch && matchesTemperature;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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
          aValue = a.clients?.client_name || a.contact_person || '';
          bValue = b.clients?.client_name || b.contact_person || '';
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTemperatureIcon = (temp: Temperature) => {
    switch (temp) {
      case 'hot':
        return '🔥';
      case 'warm':
        return '🌡️';
      case 'cold':
        return '❄️';
    }
  };

  const getTemperatureColor = (temp: Temperature) => {
    switch (temp) {
      case 'hot':
        return 'text-red-600 bg-red-50';
      case 'warm':
        return 'text-orange-600 bg-orange-50';
      case 'cold':
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={temperatureFilter}
                onChange={(e) => setTemperatureFilter(e.target.value as Temperature | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="all">All Temperatures</option>
                <option value="hot">🔥 Hot</option>
                <option value="warm">🌡️ Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Lead Name</span>
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <button
                      onClick={() => handleSort('temperature')}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Temperature</span>
                      {sortField === 'temperature' && (
                        sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Priority Score</span>
                      {sortField === 'priority' && (
                        sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Recommended Action
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {lead.clients?.client_name || lead.contact_person || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lead.clients?.company || 'No company'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTemperatureColor(lead.temperature)}`}>
                        {getTemperatureIcon(lead.temperature)} {lead.temperature.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{lead.priorityScore}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${lead.priorityScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">{lead.recommendedAction}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="group relative">
                        <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-lg">
                            {lead.why}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAndSortedLeads.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No leads found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadInsights;

