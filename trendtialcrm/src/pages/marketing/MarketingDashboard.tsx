/**
 * Marketing Dashboard
 *
 * Central command center for all marketing activities.
 * Displays KPIs, campaign performance, and AI-powered insights
 * derived from REAL leads data via Supabase.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BoltIcon,
  MegaphoneIcon,
  PresentationChartLineIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useLeadsQuery } from '../../hooks/queries/useLeadsQuery';
import { useMarketingMetrics, CampaignMetric } from '../../hooks/useMarketingMetrics';
import { useStoredCampaigns } from '../../hooks/useStoredCampaigns';
import { Lead } from '../../types';

// ── Channel icons ─────────────────────────────────────────────────────────────
const CHANNEL_ICONS: Record<string, string> = {
  'Facebook Ads': '📘', 'Google Ads': '🔍', 'LinkedIn': '💼',
  'Email Marketing': '📧', 'TikTok': '🎵', 'Twitter / X': '🐦',
  'Instagram': '📸', 'Referral': '🤝', 'Organic Search': '🌱',
  'Direct': '🎯', 'WhatsApp': '💬',
};
const channelIcon = (ch: string) => CHANNEL_ICONS[ch] ?? '📊';

// ── Component ─────────────────────────────────────────────────────────────────
const MarketingDashboard: React.FC = () => {
  const { data, isLoading } = useLeadsQuery({ limit: 1000 });
  const leads = (data?.leads ?? []) as Lead[];
  const { campaigns: derivedCampaigns, kpis, insights } = useMarketingMetrics(leads);
  const { campaigns: storedCampaigns } = useStoredCampaigns();

  // Merge: leads-derived channels first, then stored campaigns that don't overlap
  const allCampaigns: CampaignMetric[] = useMemo(() => {
    const derived = derivedCampaigns;
    const extras  = storedCampaigns.filter(s =>
      !derived.some(d => d.channel.toLowerCase() === s.channel.toLowerCase())
    );
    return [...derived, ...extras];
  }, [derivedCampaigns, storedCampaigns]);

  const top5Campaigns = allCampaigns.slice(0, 5);
  const activeCampaignsCount = allCampaigns.length;

  const insightIcon = (type: 'opportunity' | 'warning' | 'success') => {
    if (type === 'opportunity') return <LightBulbIcon className="h-5 w-5 text-blue-500" />;
    if (type === 'warning')     return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
    return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
  };
  const insightBg = (type: 'opportunity' | 'warning' | 'success') => {
    if (type === 'opportunity') return 'bg-blue-50 border-blue-200';
    if (type === 'warning')     return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  // KPI card definitions wired to real metrics
  const kpiCards = [
    {
      title: 'Total Leads',
      value: kpis.totalLeads.toLocaleString(),
      change: kpis.leadsGrowth,
      changeLabel: 'vs last month',
      icon: <UserGroupIcon className="h-6 w-6" />,
      bgGradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Pipeline Value',
      value: `$${kpis.totalPipelineValue.toLocaleString()}`,
      change: kpis.valueGrowth,
      changeLabel: 'vs last month',
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      bgGradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Avg Conversion Rate',
      value: `${kpis.avgConversionRate}%`,
      change: 0,
      changeLabel: 'across all channels',
      icon: <ChartBarIcon className="h-6 w-6" />,
      bgGradient: 'from-violet-500 to-purple-500',
    },
    {
      title: 'Active Channels',
      value: String(activeCampaignsCount),
      change: 0,
      changeLabel: 'lead sources tracked',
      icon: <MegaphoneIcon className="h-6 w-6" />,
      bgGradient: 'from-amber-500 to-orange-500',
    },
  ];

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
            Live metrics from {kpis.totalLeads} leads across {activeCampaignsCount} channels
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

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Loading live marketing data…
        </div>
      )}

      {/* KPI Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <Card key={i} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.value}</p>
                    <div className="mt-2 flex items-center">
                      {kpi.change > 0 && <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />}
                      {kpi.change < 0 && <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />}
                      {kpi.change !== 0 && (
                        <span className={`text-sm font-medium ${kpi.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {kpi.change > 0 ? '+' : ''}{kpi.change}%{' '}
                        </span>
                      )}
                      <span className="text-sm text-gray-400">{kpi.changeLabel}</span>
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
      )}

      {/* Main content grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Performance Table */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MegaphoneIcon className="h-5 w-5 text-primary" />
                    Channel Performance
                  </CardTitle>
                  <Link to="/marketing/campaigns">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {top5Campaigns.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <MegaphoneIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No channel data yet</p>
                    <p className="text-sm mt-1">Add <strong>lead_source</strong> values to your leads to see performance here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Channel</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Leads</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Conv. Rate</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Pipeline Value</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Avg Deal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {top5Campaigns.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 font-medium text-gray-900">
                                <span className="text-lg">{channelIcon(c.channel)}</span>
                                {c.channel}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-800">
                              {c.total_leads}
                              <span className="text-xs text-gray-400 ml-1">({c.closed_won} won)</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${c.conversion_rate >= 15 ? 'text-emerald-600' : c.conversion_rate >= 8 ? 'text-amber-600' : 'text-gray-600'}`}>
                                {c.conversion_rate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-800 font-medium">
                              ${c.total_value.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {c.avg_deal_value > 0 ? `$${c.avg_deal_value.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-indigo-500" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {insights.map(insight => (
                  <div key={insight.id} className={`p-4 rounded-xl border ${insightBg(insight.type)} transition-all hover:shadow-md`}>
                    <div className="flex items-start gap-3">
                      {insightIcon(insight.type)}
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

            {/* This month summary */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
              <CardContent className="pt-5 space-y-3">
                <p className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
                  <BoltIcon className="h-4 w-4" /> This Month
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New leads</span>
                  <span className="font-bold text-indigo-700">{kpis.leadsThisMonth}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pipeline added</span>
                  <span className="font-bold text-indigo-700">${kpis.valueThisMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Closed / Won</span>
                  <span className="font-bold text-indigo-700">{kpis.totalClosedWon}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
              <Link to="/marketing/campaigns">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  <BoltIcon className="h-4 w-4 mr-2" />
                  View Campaigns
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
