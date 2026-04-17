// src/lib/campaignStore.ts
// Shared localStorage store for campaigns created via Content Studio.
// Dispatches a custom DOM event so every component reactively updates
// without needing a global state manager.

import { CampaignMetric } from '../hooks/useMarketingMetrics';

export const CAMPAIGN_STORE_KEY   = 'crm_manual_campaigns';
export const CAMPAIGN_STORE_EVENT = 'crm:campaign-changed';

// ── Read / write ──────────────────────────────────────────────────────────────

export function getStoredCampaigns(): CampaignMetric[] {
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGN_STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveStoredCampaigns(campaigns: CampaignMetric[]): void {
  localStorage.setItem(CAMPAIGN_STORE_KEY, JSON.stringify(campaigns));
  window.dispatchEvent(new CustomEvent(CAMPAIGN_STORE_EVENT));
}

export function addStoredCampaign(campaign: CampaignMetric): void {
  const existing = getStoredCampaigns();
  if (existing.some(c => c.id === campaign.id)) return;
  saveStoredCampaigns([...existing, campaign]);
}

export function removeStoredCampaign(id: string): void {
  saveStoredCampaigns(getStoredCampaigns().filter(c => c.id !== id));
}

// ── Content-type → marketing channel mapping ──────────────────────────────────

export const CONTENT_TYPE_CHANNEL: Record<string, string> = {
  'email':      'Email Marketing',
  'sms':        'SMS',
  'fb-ad':      'Facebook Ads',
  'tiktok-ad':  'TikTok',
  'cold-call':  'Cold Outreach',
};

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  'email':      'Email Campaign',
  'sms':        'SMS Campaign',
  'fb-ad':      'Facebook Ad',
  'tiktok-ad':  'TikTok Ad',
  'cold-call':  'Cold Call Campaign',
};
