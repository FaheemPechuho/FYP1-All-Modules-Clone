// src/hooks/useMarketingMetrics.ts
// Derives all marketing KPIs, per-channel campaign metrics, and AI insights
// directly from the real leads data stored in Supabase.

import { useMemo } from 'react';
import { Lead } from '../types';

// ── Source normalisation ──────────────────────────────────────────────────────
function normalizeSource(raw: string | null | undefined): string {
  if (!raw || raw.trim() === '') return 'Direct';
  const s = raw.toLowerCase().trim();
  if (s.includes('facebook') || s === 'fb') return 'Facebook Ads';
  if (s.includes('google') || s.includes('gads') || s.includes('adwords')) return 'Google Ads';
  if (s.includes('linkedin')) return 'LinkedIn';
  if (s.includes('email') || s.includes('newsletter')) return 'Email Marketing';
  if (s.includes('tiktok')) return 'TikTok';
  if (s.includes('twitter') || s.includes('x.com')) return 'Twitter / X';
  if (s.includes('instagram') || s === 'ig') return 'Instagram';
  if (s.includes('referral') || s.includes('refer')) return 'Referral';
  if (s.includes('organic') || s.includes('seo')) return 'Organic Search';
  if (s.includes('whatsapp')) return 'WhatsApp';
  if (s.includes('direct')) return 'Direct';
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1);
}

// ── Exported types ────────────────────────────────────────────────────────────
export interface CampaignMetric {
  id: string;
  name: string;
  channel: string;
  total_leads: number;
  closed_won: number;
  total_value: number;
  conversion_rate: number;
  avg_deal_value: number;
  status: 'active' | 'paused' | 'completed';
}

export interface MarketingKPIs {
  totalLeads: number;
  totalPipelineValue: number;
  totalClosedWon: number;
  avgConversionRate: number;
  activeCampaigns: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  leadsGrowth: number;
  valueThisMonth: number;
  valueLastMonth: number;
  valueGrowth: number;
}

export interface MarketingInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  action?: string;
  actionLink?: string;
}

export interface MarketingMetrics {
  campaigns: CampaignMetric[];
  kpis: MarketingKPIs;
  insights: MarketingInsight[];
  recentLeads: Lead[];
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useMarketingMetrics(leads: Lead[]): MarketingMetrics {
  return useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ── Group by normalised lead_source ─────────────────────────────────────
    const sourceMap = new Map<string, Lead[]>();
    leads.forEach(lead => {
      const src = normalizeSource(
        lead.lead_source ?? lead.utm_source ?? lead.utm_campaign ?? null
      );
      if (!sourceMap.has(src)) sourceMap.set(src, []);
      sourceMap.get(src)!.push(lead);
    });

    // ── Per-channel campaign metrics ─────────────────────────────────────────
    const campaigns: CampaignMetric[] = Array.from(sourceMap.entries())
      .map(([channel, srcLeads], idx) => {
        const closedWon = srcLeads.filter(
          l => l.qualification_status === 'opportunity' || l.status_bucket === 'P1'
        ).length;
        const totalValue   = srcLeads.reduce((s, l) => s + (l.deal_value ?? 0), 0);
        const conversionRate =
          srcLeads.length > 0
            ? Math.round((closedWon / srcLeads.length) * 1000) / 10
            : 0;
        return {
          id: `ch-${idx + 1}`,
          name: `${channel} Campaign`,
          channel,
          total_leads:    srcLeads.length,
          closed_won:     closedWon,
          total_value:    totalValue,
          conversion_rate: conversionRate,
          avg_deal_value: closedWon > 0 ? Math.round(totalValue / closedWon) : 0,
          status: 'active' as const,
        };
      })
      .filter(c => c.total_leads > 0)
      .sort((a, b) => b.total_leads - a.total_leads);

    // ── Overall KPIs ─────────────────────────────────────────────────────────
    const totalLeads        = leads.length;
    const totalPipelineValue = leads.reduce((s, l) => s + (l.deal_value ?? 0), 0);
    const totalClosedWon    = campaigns.reduce((s, c) => s + c.closed_won, 0);
    const avgConversionRate =
      campaigns.length > 0
        ? Math.round((campaigns.reduce((s, c) => s + c.conversion_rate, 0) / campaigns.length) * 10) / 10
        : 0;

    // ── Month-over-month growth ──────────────────────────────────────────────
    const leadsThisMonth = leads.filter(l => new Date(l.created_at) >= startOfThisMonth).length;
    const leadsLastMonth = leads.filter(l => {
      const d = new Date(l.created_at);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    }).length;
    const leadsGrowth =
      leadsLastMonth > 0
        ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 1000) / 10
        : leadsThisMonth > 0 ? 100 : 0;

    const valueThisMonth = leads
      .filter(l => new Date(l.created_at) >= startOfThisMonth)
      .reduce((s, l) => s + (l.deal_value ?? 0), 0);
    const valueLastMonth = leads
      .filter(l => {
        const d = new Date(l.created_at);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      })
      .reduce((s, l) => s + (l.deal_value ?? 0), 0);
    const valueGrowth =
      valueLastMonth > 0
        ? Math.round(((valueThisMonth - valueLastMonth) / valueLastMonth) * 1000) / 10
        : valueThisMonth > 0 ? 100 : 0;

    const kpis: MarketingKPIs = {
      totalLeads,
      totalPipelineValue,
      totalClosedWon,
      avgConversionRate,
      activeCampaigns: campaigns.length,
      leadsThisMonth,
      leadsLastMonth,
      leadsGrowth,
      valueThisMonth,
      valueLastMonth,
      valueGrowth,
    };

    // ── AI insights derived from real data ───────────────────────────────────
    const insights: MarketingInsight[] = [];

    if (campaigns.length > 0) {
      const bestConv  = [...campaigns].sort((a, b) => b.conversion_rate - a.conversion_rate)[0];
      const bestValue = [...campaigns].sort((a, b) => b.total_value - a.total_value)[0];

      if (bestConv.conversion_rate > 0) {
        insights.push({
          id: 'ins-1',
          type: 'success',
          title: `${bestConv.channel} leads in conversion`,
          description: `${bestConv.channel} achieves a ${bestConv.conversion_rate}% conversion rate across ${bestConv.total_leads} leads. Consider scaling this channel's budget.`,
          action: 'View Campaigns',
          actionLink: '/marketing/campaigns',
        });
      }

      if (bestValue.total_value > 0) {
        insights.push({
          id: 'ins-2',
          type: 'opportunity',
          title: `$${bestValue.total_value.toLocaleString()} pipeline from ${bestValue.channel}`,
          description: `${bestValue.channel} generates the highest deal value. Create more targeted content to accelerate these deals.`,
          action: 'Create Content',
          actionLink: '/marketing/content-studio',
        });
      }

      if (leadsGrowth !== 0) {
        insights.push({
          id: 'ins-3',
          type: leadsGrowth >= 0 ? 'success' : 'warning',
          title: leadsGrowth >= 0
            ? `Lead volume up ${leadsGrowth}% this month`
            : `Lead volume down ${Math.abs(leadsGrowth)}% this month`,
          description: leadsGrowth >= 0
            ? `${leadsThisMonth} new leads this month vs ${leadsLastMonth} last month — great momentum!`
            : `Lead volume has dropped. Review your campaign targeting and consider fresh outreach strategies.`,
          action: leadsGrowth >= 0 ? 'View Analytics' : 'Boost Campaigns',
          actionLink: leadsGrowth >= 0 ? '/marketing/analytics' : '/marketing/campaigns',
        });
      }

      const lowConv = campaigns.filter(c => c.total_leads >= 3 && c.conversion_rate < 5);
      if (lowConv.length > 0) {
        insights.push({
          id: 'ins-4',
          type: 'warning',
          title: `${lowConv.length} channel(s) underperforming`,
          description: `${lowConv.map(c => c.channel).join(', ')} have conversion rates below 5%. Review messaging, targeting, and landing pages.`,
          action: 'Review Campaigns',
          actionLink: '/marketing/campaigns',
        });
      }
    }

    // Top industry insight
    if (totalLeads > 0 && insights.length < 4) {
      const indMap = new Map<string, number>();
      leads.forEach(l => {
        const ind = l.industry ?? (l.clients as any)?.industry ?? null;
        if (ind) indMap.set(ind, (indMap.get(ind) ?? 0) + 1);
      });
      const topInd = [...indMap.entries()].sort((a, b) => b[1] - a[1])[0];
      if (topInd) {
        insights.push({
          id: 'ins-5',
          type: 'opportunity',
          title: `${topInd[0].charAt(0).toUpperCase() + topInd[0].slice(1)} is your top industry`,
          description: `${topInd[1]} leads (${Math.round((topInd[1] / totalLeads) * 100)}%) come from ${topInd[0]}. Generate personalised content for this segment.`,
          action: 'Content Studio',
          actionLink: '/marketing/content-studio',
        });
      }
    }

    // If no real insights yet, add a helpful prompt
    if (insights.length === 0) {
      insights.push({
        id: 'ins-default',
        type: 'opportunity',
        title: 'Start adding leads to unlock insights',
        description: 'Import leads with source attribution (lead_source field) to get AI-powered campaign insights and ROI analysis.',
        action: 'Add Leads',
        actionLink: '/leads',
      });
    }

    // Recent leads for "quick actions" panel
    const recentLeads = [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return { campaigns, kpis, insights, recentLeads };
  }, [leads]);
}
