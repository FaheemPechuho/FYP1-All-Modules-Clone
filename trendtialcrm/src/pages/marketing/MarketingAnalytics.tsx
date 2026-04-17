/**
 * Marketing Analytics
 * 
 * Comprehensive marketing performance analytics and attribution.
 * 
 * @author Sheryar
 */

import React, { useState, useMemo } from 'react';
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
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { useLeadsQuery } from '../../hooks/queries/useLeadsQuery';
import { useMarketingMetrics } from '../../hooks/useMarketingMetrics';
import { Lead } from '../../types';

const CHANNEL_ICONS: Record<string, string> = {
  'Facebook Ads': '📘', 'Google Ads': '🔍', 'LinkedIn': '💼',
  'Email Marketing': '📧', 'TikTok': '🎵', 'Twitter / X': '🐦',
  'Instagram': '📸', 'Referral': '🤝', 'Organic Search': '🌱',
  'Direct': '🎯', 'WhatsApp': '💬', 'Cold Outreach': '📞', 'SMS': '💬',
};


// =============================================================================
// COMPONENT
// =============================================================================

const MarketingAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const { data, isLoading } = useLeadsQuery({ limit: 1000 });
  const leads = (data?.leads ?? []) as Lead[];
  const { campaigns, kpis, insights } = useMarketingMetrics(leads);

  // Conversion funnel derived from real status_bucket values
  const funnelData = useMemo(() => {
    const total = leads.length;
    if (total === 0) return [];
    const inPipeline = leads.filter(l => l.status_bucket).length;
    const qualified  = leads.filter(l => {
      const s = (l.status_bucket ?? '').toLowerCase();
      return s && !['new', 'p5', 'cold', 'unqualified', ''].some(x => s.includes(x));
    }).length;
    const advanced = leads.filter(l => {
      const s = (l.status_bucket ?? '').toLowerCase();
      return ['p1', 'p2', 'proposal', 'negotiation', 'opportunity', 'hot'].some(x => s.includes(x));
    }).length;
    return [
      { stage: 'Total Leads',    count: total,       widthPct: 100 },
      { stage: 'In Pipeline',     count: inPipeline,  widthPct: Math.round((inPipeline / total) * 100) },
      { stage: 'Qualified',       count: qualified,   widthPct: Math.round((qualified  / total) * 100) },
      { stage: 'Advanced Stage',  count: advanced,    widthPct: Math.round((advanced   / total) * 100) },
      { stage: 'Converted / Won', count: kpis.totalClosedWon, widthPct: Math.round((kpis.totalClosedWon / total) * 100) },
    ];
  }, [leads, kpis]);

  // Last 6 months lead volume + pipeline value
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const ym   = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const ml   = leads.filter(l => l.created_at?.startsWith(ym));
      return {
        month:   date.toLocaleString('default', { month: 'short' }),
        leads:   ml.length,
        revenue: ml.reduce((s, l) => s + (l.deal_value ?? 0), 0),
      };
    });
  }, [leads]);

  const maxBarLeads = Math.max(...monthlyTrend.map(m => m.leads), 1);

  const insightIcon = (type: 'opportunity' | 'warning' | 'success') => {
    if (type === 'opportunity') return <LightBulbIcon className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />;
    if (type === 'warning')     return <ExclamationTriangleIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />;
    return <CheckCircleIcon className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />;
  };

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
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',    value: kpis.totalLeads.toLocaleString(),                        change: kpis.leadsGrowth,  icon: <UserGroupIcon className="h-8 w-8 text-blue-400" />,   gradient: 'from-blue-50 to-indigo-50 border-blue-100',     text: 'text-blue-700',   sub: 'text-blue-600' },
          { label: 'Conversions',    value: kpis.totalClosedWon.toLocaleString(),                    change: 0,                 icon: <FunnelIcon className="h-8 w-8 text-emerald-400" />,  gradient: 'from-emerald-50 to-teal-50 border-emerald-100', text: 'text-emerald-700', sub: 'text-emerald-600' },
          { label: 'Pipeline Value', value: `$${(kpis.totalPipelineValue / 1000).toFixed(0)}K`,     change: kpis.valueGrowth,  icon: <CurrencyDollarIcon className="h-8 w-8 text-violet-400" />, gradient: 'from-violet-50 to-purple-50 border-violet-100', text: 'text-violet-700', sub: 'text-violet-600' },
          { label: 'Avg Conv. Rate', value: `${kpis.avgConversionRate}%`,                           change: 0,                 icon: <ChartBarIcon className="h-8 w-8 text-amber-400" />,   gradient: 'from-amber-50 to-orange-50 border-amber-100',   text: 'text-amber-700',  sub: 'text-amber-600' },
        ].map(c => (
          <Card key={c.label} className={`bg-gradient-to-br ${c.gradient}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${c.sub}`}>{c.label}</p>
                  <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
                  {c.change !== 0 && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${c.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {c.change >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                      {c.change >= 0 ? '+' : ''}{c.change}% vs last month
                    </p>
                  )}
                </div>
                {c.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Attribution — REAL */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                Channel Attribution
                {isLoading && <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {campaigns.length === 0 && !isLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium text-gray-500">No channel data yet</p>
                  <p className="text-sm mt-1">Add leads with a <code className="bg-gray-100 px-1 rounded text-xs">lead_source</code> field to see attribution</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Channel</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Leads</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Converted</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Pipeline Value</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {campaigns.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span>{CHANNEL_ICONS[c.channel] ?? '📊'}</span>
                              <span className="font-medium text-gray-900">{c.channel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{c.total_leads.toLocaleString()}</td>
                          <td className="py-3 px-4">{c.closed_won}</td>
                          <td className="py-3 px-4">{c.total_value > 0 ? `$${c.total_value.toLocaleString()}` : '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${
                              c.conversion_rate >= 20 ? 'text-emerald-600'
                              : c.conversion_rate >= 10 ? 'text-amber-600'
                              : 'text-gray-500'
                            }`}>
                              {c.conversion_rate}%
                            </span>
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

        {/* Conversion Funnel — REAL */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {funnelData.length === 0 ? (
              <div className="text-center py-8">
                <FunnelIcon className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">No leads data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {funnelData.map(stage => (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{stage.stage}</span>
                      <span className="text-gray-500">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="h-9 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center transition-all duration-500"
                        style={{ width: `${Math.max(stage.widthPct, 4)}%` }}
                      >
                        {stage.widthPct > 12 && (
                          <span className="text-white text-xs font-medium">{stage.widthPct}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {kpis.totalLeads > 0 && (
              <div className="mt-5 p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <SparklesIcon className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-800">Overall Conversion</span>
                </div>
                <p className="text-3xl font-bold text-emerald-700">
                  {((kpis.totalClosedWon / kpis.totalLeads) * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-emerald-600 mt-1">Lead to Customer</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend — REAL */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Monthly Lead Volume &amp; Pipeline (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {monthlyTrend.every(m => m.leads === 0) ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="h-10 w-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No historical data yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 justify-around" style={{ height: '160px' }}>
              {monthlyTrend.map(month => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold text-emerald-600 mb-1">${(month.revenue / 1000).toFixed(0)}K</p>
                  <div className="w-full flex justify-center flex-1 items-end">
                    <div
                      className="bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t-lg w-3/4 min-h-1 transition-all hover:from-indigo-600 hover:to-purple-500"
                      style={{ height: `${Math.max((month.leads / maxBarLeads) * 100, 4)}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-700 mt-1">{month.month}</p>
                  <p className="text-xs text-gray-500">{month.leads}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights — REAL */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex-shrink-0">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-3">AI-Powered Insights</h3>
              {insights.length === 0 ? (
                <p className="text-gray-400 text-sm">Add leads with source attribution to unlock real-time insights.</p>
              ) : (
                <ul className="space-y-2.5">
                  {insights.slice(0, 4).map(ins => (
                    <li key={ins.id} className="flex items-start gap-2 text-sm text-gray-300">
                      {insightIcon(ins.type)}
                      <span><strong className="text-white">{ins.title}:</strong> {ins.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingAnalytics;

