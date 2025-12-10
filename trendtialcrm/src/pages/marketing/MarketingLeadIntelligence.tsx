/**
 * Marketing Lead Intelligence
 * 
 * Lead scoring and insights page.
 * 
 * @author Sheryar
 */

import React from 'react';
import LeadInsights from '../../components/marketing/LeadInsights';
import { useLeadsQuery } from '../../hooks/queries/useLeadsQuery';
import { Lead } from '../../types';

const MarketingLeadIntelligence: React.FC = () => {
  const { data: leadsResponse } = useLeadsQuery({});
  const leads: Lead[] = leadsResponse?.leads || [];

  return <LeadInsights leads={leads} />;
};

export default MarketingLeadIntelligence;

