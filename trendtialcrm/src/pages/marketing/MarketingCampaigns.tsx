/**
 * Marketing Campaigns
 * 
 * Campaign management interface with advanced features.
 * 
 * @author Sheryar
 */

import React from 'react';
import Campaigns from '../../components/marketing/Campaigns';
import { useLeadsQuery } from '../../hooks/queries/useLeadsQuery';
import { Lead } from '../../types';

const MarketingCampaigns: React.FC = () => {
  const { data } = useLeadsQuery({ limit: 1000 });
  return <Campaigns leads={(data?.leads ?? []) as Lead[]} />;
};

export default MarketingCampaigns;

