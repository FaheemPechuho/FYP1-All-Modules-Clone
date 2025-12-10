/**
 * Marketing Hub Pages Index
 * 
 * Central export file for all Marketing Hub pages.
 * This module provides a comprehensive marketing automation suite.
 * 
 * Features:
 * - Dashboard: Central command center with KPIs and AI insights
 * - Content Studio: AI-powered content generation (email, SMS, scripts, ads)
 * - Campaigns: Campaign management and performance tracking
 * - Lead Intelligence: Lead scoring and temperature analysis
 * - Email Marketing: Campaigns, templates, and automated sequences
 * - Social Media: Post scheduling, content calendar, and analytics
 * - Automation: Visual workflow builder for marketing automation
 * - Analytics: Comprehensive performance analytics and attribution
 * - ROI Calculator: Marketing ROI and budget planning tool
 * - Templates Library: Centralized template management
 * - A/B Testing: Experimentation and optimization
 * 
 * @author Sheryar
 */

// Dashboard & Core
export { default as MarketingDashboard } from './MarketingDashboard';
export { default as MarketingContentStudio } from './MarketingContentStudio';
export { default as MarketingCampaigns } from './MarketingCampaigns';
export { default as MarketingLeadIntelligence } from './MarketingLeadIntelligence';

// Email Marketing
export { default as MarketingEmailCampaigns } from './MarketingEmailCampaigns';
export { default as MarketingEmailTemplates } from './MarketingEmailTemplates';
export { default as MarketingEmailSequences } from './MarketingEmailSequences';

// Social Media
export { default as MarketingSocialScheduler } from './MarketingSocialScheduler';
export { default as MarketingSocialCalendar } from './MarketingSocialCalendar';
export { default as MarketingSocialAnalytics } from './MarketingSocialAnalytics';

// Automation & Analytics
export { default as MarketingAutomation } from './MarketingAutomation';
export { default as MarketingAnalytics } from './MarketingAnalytics';
export { default as MarketingROICalculator } from './MarketingROICalculator';

// Templates & Testing
export { default as MarketingTemplatesLibrary } from './MarketingTemplatesLibrary';
export { default as MarketingABTesting } from './MarketingABTesting';

