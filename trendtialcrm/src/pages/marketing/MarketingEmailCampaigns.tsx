/**
 * Marketing Email Campaigns
 * 
 * Full-featured email campaign management interface.
 * Create, manage, and track email marketing campaigns.
 * 
 * @author Sheryar
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  EnvelopeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  SparklesIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  template: string;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const emailCampaigns: EmailCampaign[] = [
  {
    id: '1',
    name: 'Holiday Season Sale',
    subject: '🎄 Exclusive Holiday Deals Just for You!',
    status: 'sent',
    recipients: 15420,
    sent: 15380,
    opened: 4892,
    clicked: 1247,
    bounced: 40,
    unsubscribed: 23,
    sentAt: '2024-12-01T10:00:00Z',
    createdAt: '2024-11-28T14:30:00Z',
    template: 'promotional',
  },
  {
    id: '2',
    name: 'Product Update Newsletter',
    subject: 'New Features You\'ll Love 🚀',
    status: 'scheduled',
    recipients: 8750,
    sent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    scheduledAt: '2024-12-15T09:00:00Z',
    createdAt: '2024-12-08T11:20:00Z',
    template: 'newsletter',
  },
  {
    id: '3',
    name: 'Re-engagement Campaign',
    subject: 'We miss you! Here\'s 20% off',
    status: 'sending',
    recipients: 3200,
    sent: 1845,
    opened: 412,
    clicked: 89,
    bounced: 12,
    unsubscribed: 5,
    createdAt: '2024-12-10T08:00:00Z',
    template: 'win-back',
  },
  {
    id: '4',
    name: 'Welcome Series - Day 1',
    subject: 'Welcome to the family! 👋',
    status: 'sent',
    recipients: 2450,
    sent: 2448,
    opened: 1834,
    clicked: 567,
    bounced: 2,
    unsubscribed: 3,
    sentAt: '2024-12-05T00:00:00Z',
    createdAt: '2024-11-20T16:45:00Z',
    template: 'welcome',
  },
  {
    id: '5',
    name: 'Q4 Report to Stakeholders',
    subject: 'Q4 2024 Performance Report',
    status: 'draft',
    recipients: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    createdAt: '2024-12-09T13:15:00Z',
    template: 'report',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingEmailCampaigns: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredCampaigns = useMemo(() => {
    return emailCampaigns.filter((campaign) => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: emailCampaigns.length,
    sent: emailCampaigns.filter(c => c.status === 'sent').length,
    scheduled: emailCampaigns.filter(c => c.status === 'scheduled').length,
    drafts: emailCampaigns.filter(c => c.status === 'draft').length,
    totalSent: emailCampaigns.reduce((acc, c) => acc + c.sent, 0),
    totalOpened: emailCampaigns.reduce((acc, c) => acc + c.opened, 0),
    avgOpenRate: emailCampaigns.filter(c => c.sent > 0).reduce((acc, c) => acc + (c.opened / c.sent * 100), 0) / emailCampaigns.filter(c => c.sent > 0).length || 0,
    avgClickRate: emailCampaigns.filter(c => c.opened > 0).reduce((acc, c) => acc + (c.clicked / c.opened * 100), 0) / emailCampaigns.filter(c => c.opened > 0).length || 0,
  }), []);

  const getStatusBadge = (status: CampaignStatus) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      sending: 'bg-amber-100 text-amber-700 border-amber-200',
      sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      paused: 'bg-red-100 text-red-700 border-red-200',
    };

    const icons = {
      draft: <DocumentDuplicateIcon className="h-3.5 w-3.5" />,
      scheduled: <ClockIcon className="h-3.5 w-3.5" />,
      sending: <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />,
      sent: <CheckCircleIcon className="h-3.5 w-3.5" />,
      paused: <PauseCircleIcon className="h-3.5 w-3.5" />,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              <EnvelopeIcon className="h-6 w-6" />
            </div>
            Email Campaigns
          </h1>
          <p className="mt-1 text-gray-500">
            Create and manage your email marketing campaigns
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowUpTrayIcon className="h-4 w-4" />
            Import List
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Sent</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalSent.toLocaleString()}</p>
              </div>
              <PaperAirplaneIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Avg Open Rate</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.avgOpenRate.toFixed(1)}%</p>
              </div>
              <EyeIcon className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Avg Click Rate</p>
                <p className="text-2xl font-bold text-violet-700">{stats.avgClickRate.toFixed(1)}%</p>
              </div>
              <CursorArrowRaysIcon className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Scheduled</p>
                <p className="text-2xl font-bold text-amber-700">{stats.scheduled}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'draft', 'scheduled', 'sending', 'sent'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Campaign</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Recipients</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Open Rate</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Click Rate</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCampaigns.map((campaign) => {
                  const openRate = campaign.sent > 0 ? (campaign.opened / campaign.sent * 100).toFixed(1) : '0.0';
                  const clickRate = campaign.opened > 0 ? (campaign.clicked / campaign.opened * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{campaign.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.subject}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{campaign.recipients.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(parseFloat(openRate), 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{openRate}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-violet-500 rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(parseFloat(clickRate), 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{clickRate}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12">
              <EnvelopeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No campaigns found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first email campaign'}
              </p>
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-primary" />
                Create New Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g., Holiday Sale 2024"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  placeholder="e.g., 🎄 Your exclusive holiday offer awaits!"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Newsletter', 'Promotional', 'Welcome', 'Win-back', 'Announcement', 'Report'].map((template) => (
                    <button
                      key={template}
                      className="p-4 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">{template}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <select className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option>All Subscribers (15,420)</option>
                  <option>Active Users (8,750)</option>
                  <option>New Leads (2,340)</option>
                  <option>Cold Leads (3,200)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Create with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketingEmailCampaigns;

