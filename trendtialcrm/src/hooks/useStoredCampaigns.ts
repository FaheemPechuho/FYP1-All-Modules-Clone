// src/hooks/useStoredCampaigns.ts
// Reactive hook that syncs with the campaignStore.
// Automatically re-renders any component using this hook when a campaign is
// added / removed (even from a different component on the same page).

import { useState, useEffect } from 'react';
import { CampaignMetric } from './useMarketingMetrics';
import {
  getStoredCampaigns,
  saveStoredCampaigns,
  removeStoredCampaign,
  CAMPAIGN_STORE_EVENT,
} from '../lib/campaignStore';

export function useStoredCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>(getStoredCampaigns);

  useEffect(() => {
    const onUpdate = () => setCampaigns(getStoredCampaigns());
    window.addEventListener(CAMPAIGN_STORE_EVENT, onUpdate);
    return () => window.removeEventListener(CAMPAIGN_STORE_EVENT, onUpdate);
  }, []);

  const save = (updated: CampaignMetric[]) => saveStoredCampaigns(updated);
  const remove = (id: string)              => removeStoredCampaign(id);

  return { campaigns, save, remove };
}
