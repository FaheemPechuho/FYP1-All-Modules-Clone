/**
 * Marketing Dashboard
 * 
 * Central command center for all marketing activities.
 * Displays KPIs, campaign performance, and AI-powered insights.
 * 
 * @author Sheryar
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ChartBarIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CalendarDaysIcon,
  ClockIcon,
  BoltIcon,
  MegaphoneIcon,
  PresentationChartLineIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface KPICard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}

interface CampaignPerformance {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  leads: number;
  conversions: number;
  conversionRate: number;
  spend: number;
  revenue: number;
  roi: number;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  action?: string;
  actionLink?: string;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const kpiCards: KPICard[] = [
  {
    title: 'Total Leads Generated',
    value: '2,847',
    change: 12.5,
    changeLabel: 'vs last month',
    icon: <UserGroupIcon className="h-6 w-6" />,
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Email Open Rate',
    value: '28.4%',
    change: 3.2,
    changeLabel: 'vs last month',
    icon: <EnvelopeIcon className="h-6 w-6" />,
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Campaign ROI',
    value: '324%',
    change: 18.7,
    changeLabel: 'vs last month',
    icon: <CurrencyDollarIcon className="h-6 w-6" />,
    color: 'text-violet-600',
    bgGradient: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Active Campaigns',
    value: '12',
    change: -2,
    changeLabel: 'vs last month',
    icon: <MegaphoneIcon className="h-6 w-6" />,
    color: 'text-amber-600',
    bgGradient: 'from-amber-500 to-orange-500',
  },
];

const campaignPerformance: CampaignPerformance[] = [
  { id: '1', name: 'Summer Product Launch', status: 'active', leads: 456, conversions: 89, conversionRate: 19.5, spend: 2500, revenue: 12400, roi: 396 },
  { id: '2', name: 'LinkedIn B2B Outreach', status: 'active', leads: 234, conversions: 45, conversionRate: 19.2, spend: 1800, revenue: 8900, roi: 394 },
  { id: '3', name: 'Email Newsletter Q4', status: 'active', leads: 567, conversions: 112, conversionRate: 19.8, spend: 500, revenue: 15600, roi: 3020 },
  { id: '4', name: 'Google Ads - Services', status: 'paused', leads: 189, conversions: 23, conversionRate: 12.2, spend: 3200, revenue: 4500, roi: 41 },
  { id: '5', name: 'Retargeting Campaign', status: 'active', leads: 345, conversions: 78, conversionRate: 22.6, spend: 1200, revenue: 9800, roi: 717 },
];

const aiInsights: AIInsight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'High-Converting Segment Identified',
    description: 'Leads from the "Enterprise Tech" segment show 34% higher conversion rates. Consider increasing ad spend for this segment.',
    action: 'Create Targeted Campaign',
    actionLink: '/marketing/campaigns',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Email Engagement Declining',
    description: 'Your "Product Updates" email sequence has seen a 15% drop in open rates over the last 2 weeks. Consider refreshing subject lines.',
    action: 'Review Sequence',
    actionLink: '/marketing/email/sequences',
  },
  {
    id: '3',
    type: 'success',
    title: 'Best Performing Content',
    description: 'Your "Industry Trends 2024" blog post has generated 127 leads this month, 3x your average.',
    action: 'Create Similar Content',
    actionLink: '/marketing/content-studio',
  },
];

const upcomingTasks = [
  { id: '1', title: 'Send weekly newsletter', time: 'Today, 10:00 AM', type: 'email' },
  { id: '2', title: 'LinkedIn post scheduled', time: 'Today, 2:00 PM', type: 'social' },
  { id: '3', title: 'Review A/B test results', time: 'Tomorrow, 9:00 AM', type: 'task' },
  { id: '4', title: 'Campaign review meeting', time: 'Tomorrow, 3:00 PM', type: 'meeting' },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return <LightBulbIcon className="h-5 w-5 text-blue-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
    }
  };

  const getInsightBg = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'success': return 'bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
              <PresentationChartLineIcon className="h-6 w-6" />
            </div>
            Marketing Dashboard
          </h1>
          <p className="mt-1 text-gray-500">
            Monitor your marketing performance and AI-powered insights
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/marketing/analytics">
            <Button variant="outline" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
          <Link to="/marketing/campaigns">
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              <RocketLaunchIcon className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.value}</p>
                  <div className="mt-2 flex items-center">
                    {kpi.change >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${kpi.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-sm text-gray-400 ml-1">{kpi.changeLabel}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.bgGradient} text-white shadow-lg`}>
                  {kpi.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Performance Table */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MegaphoneIcon className="h-5 w-5 text-primary" />
                  Campaign Performance
                </CardTitle>
                <Link to="/marketing/campaigns">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Campaign</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Leads</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Conv. Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {campaignPerformance.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${campaign.status === 'paused' ? 'bg-amber-100 text-amber-700' : ''}
                            ${campaign.status === 'completed' ? 'bg-gray-100 text-gray-700' : ''}
                          `}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{campaign.leads}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${campaign.conversionRate >= 15 ? 'text-emerald-600' : 'text-gray-700'}`}>
                            {campaign.conversionRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${campaign.roi >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {campaign.roi}%
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

        {/* AI Insights Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {aiInsights.map((insight) => (
                <div 
                  key={insight.id} 
                  className={`p-4 rounded-xl border ${getInsightBg(insight.type)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      {insight.action && (
                        <Link to={insight.actionLink || '#'}>
                          <Button variant="ghost" size="sm" className="mt-2 text-xs h-7 px-2">
                            {insight.action} →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDaysIcon className="h-5 w-5 text-primary" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      task.type === 'email' ? 'bg-blue-100 text-blue-600' :
                      task.type === 'social' ? 'bg-purple-100 text-purple-600' :
                      task.type === 'task' ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {task.type === 'email' && <EnvelopeIcon className="h-4 w-4" />}
                      {task.type === 'social' && <MegaphoneIcon className="h-4 w-4" />}
                      {task.type === 'task' && <BoltIcon className="h-4 w-4" />}
                      {task.type === 'meeting' && <CalendarDaysIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {task.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-center md:text-left">
              <h3 className="text-xl font-bold">Ready to boost your marketing?</h3>
              <p className="text-gray-300 mt-1">Use AI to generate high-converting content in seconds</p>
            </div>
            <div className="flex gap-3">
              <Link to="/marketing/content-studio">
                <Button className="bg-white text-gray-900 hover:bg-gray-100">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Content Studio
                </Button>
              </Link>
              <Link to="/marketing/automation">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  <BoltIcon className="h-4 w-4 mr-2" />
                  Automation
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingDashboard;

