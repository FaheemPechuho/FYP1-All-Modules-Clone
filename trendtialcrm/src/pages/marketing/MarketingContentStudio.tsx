/**
 * Marketing Content Studio
 * 
 * AI-powered content generation hub with enhanced features.
 * Wraps the existing ContentStudio with additional capabilities.
 * 
 * @author Sheryar
 */

import React from 'react';
import ContentStudio from '../../components/marketing/ContentStudio';
import { useLeadsQuery } from '../../hooks/queries/useLeadsQuery';
import { Lead } from '../../types';

const MarketingContentStudio: React.FC = () => {
  const { data: leadsResponse } = useLeadsQuery({});
  const leads: Lead[] = leadsResponse?.leads || [];

  return <ContentStudio leads={leads} />;
};

export default MarketingContentStudio;

