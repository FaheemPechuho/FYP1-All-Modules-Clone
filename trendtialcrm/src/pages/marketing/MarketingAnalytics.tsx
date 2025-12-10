/**
 * Marketing Analytics
 * 
 * Comprehensive marketing performance analytics and attribution.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  FunnelIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// DEMO DATA
// =============================================================================

const channelPerformance = [
  { channel: 'Email Marketing', leads: 2450, conversions: 456, revenue: 125000, cpa: 8.50, roi: 425 },
  { channel: 'Paid Search', leads: 1890, conversions: 312, revenue: 98000, cpa: 24.80, roi: 285 },
  { channel: 'Social Media', leads: 3240, conversions: 289, revenue: 67000, cpa: 12.40, roi: 180 },
  { channel: 'Content Marketing', leads: 1560, conversions: 234, revenue: 89000, cpa: 5.20, roi: 520 },
  { channel: 'Referral', leads: 890, conversions: 178, revenue: 56000, cpa: 0, roi: 1200 },
  { channel: 'Direct', leads: 1240, conversions: 198, revenue: 72000, cpa: 0, roi: 890 },
];

const funnelData = [
  { stage: 'Visitors', count: 45600, conversion: 100 },
  { stage: 'Leads', count: 11270, conversion: 24.7 },
  { stage: 'MQLs', count: 3892, conversion: 34.5 },
  { stage: 'SQLs', count: 1456, conversion: 37.4 },
  { stage: 'Opportunities', count: 567, conversion: 38.9 },
  { stage: 'Customers', count: 234, conversion: 41.3 },
];

const monthlyTrend = [
  { month: 'Jul', leads: 2100, revenue: 78000 },
  { month: 'Aug', leads: 2340, revenue: 89000 },
  { month: 'Sep', leads: 2560, revenue: 102000 },
  { month: 'Oct', leads: 2890, revenue: 118000 },
  { month: 'Nov', leads: 3120, revenue: 134000 },
  { month: 'Dec', leads: 3450, revenue: 156000 },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  const totalLeads = channelPerformance.reduce((acc, c) => acc + c.leads, 0);
  const totalConversions = channelPerformance.reduce((acc, c) => acc + c.conversions, 0);
  const totalRevenue = channelPerformance.reduce((acc, c) => acc + c.revenue, 0);
  const avgROI = channelPerformance.reduce((acc, c) => acc + c.roi, 0) / channelPerformance.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            Marketing Analytics
          </h1>
          <p className="mt-1 text-gray-500">
            Track performance, attribution, and ROI across all channels
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '12m'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '12 Months'}
            </Button>
          ))}
          <Button variant="outline" size="sm">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-blue-700">{totalLeads.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +12.5%
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Conversions</p>
                <p className="text-2xl font-bold text-emerald-700">{totalConversions.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +8.3%
                </p>
              </div>
              <FunnelIcon className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Revenue</p>
                <p className="text-2xl font-bold text-violet-700">${(totalRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +18.7%
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Avg ROI</p>
                <p className="text-2xl font-bold text-amber-700">{avgROI.toFixed(0)}%</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +5.2%
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Attribution */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Channel Attribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Channel</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Leads</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Conversions</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Revenue</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">CPA</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {channelPerformance.map((channel) => (
                      <tr key={channel.channel} className="hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{channel.channel}</td>
                        <td className="py-4 px-4">{channel.leads.toLocaleString()}</td>
                        <td className="py-4 px-4">{channel.conversions}</td>
                        <td className="py-4 px-4">${channel.revenue.toLocaleString()}</td>
                        <td className="py-4 px-4">{channel.cpa > 0 ? `$${channel.cpa.toFixed(2)}` : 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className={`font-bold ${channel.roi >= 300 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {channel.roi}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {funnelData.map((stage, index) => {
                const width = 100 - (index * 15);
                return (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{stage.stage}</span>
                      <span className="text-gray-500">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="relative">
                      <div 
                        className="h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center transition-all"
                        style={{ width: `${width}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {index > 0 ? `${stage.conversion}%` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">Overall Conversion</span>
              </div>
              <p className="text-3xl font-bold text-emerald-700">
                {((234 / 45600) * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                Visitor to Customer
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Monthly Performance Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-6 gap-4">
            {monthlyTrend.map((month) => (
              <div key={month.month} className="text-center">
                <div className="mb-3">
                  <div 
                    className="bg-gradient-to-t from-indigo-500 to-purple-400 rounded-lg mx-auto transition-all hover:from-indigo-600 hover:to-purple-500"
                    style={{ 
                      height: `${(month.leads / 4000) * 120}px`,
                      width: '40px'
                    }}
                  />
                </div>
                <p className="font-medium text-gray-900">{month.month}</p>
                <p className="text-sm text-gray-500">{month.leads} leads</p>
                <p className="text-xs text-emerald-600">${(month.revenue / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">AI-Generated Insights</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• <strong className="text-white">Content Marketing</strong> shows the highest ROI (520%) - consider increasing budget allocation</li>
                <li>• <strong className="text-white">Email</strong> conversion rate improved by 15% after implementing personalization</li>
                <li>• <strong className="text-white">Social Media</strong> CPL decreased by 22% with video content - recommend more video ads</li>
                <li>• <strong className="text-white">Opportunity:</strong> Referral channel has unlimited ROI potential - implement referral program</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingAnalytics;

