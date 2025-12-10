/**
 * Marketing Automation
 * 
 * Visual workflow builder for marketing automation.
 * Create trigger-based automated marketing workflows.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ClockIcon,
  EnvelopeIcon,
  UserGroupIcon,
  TagIcon,
  FunnelIcon,
  ArrowRightIcon,
  SparklesIcon,
  CogIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type WorkflowStatus = 'active' | 'paused' | 'draft';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  name: string;
  config: Record<string, string | number>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: string;
  steps: WorkflowStep[];
  totalContacts: number;
  completedContacts: number;
  conversionRate: number;
  createdAt: string;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const workflows: Workflow[] = [
  {
    id: '1',
    name: 'Lead Nurturing Workflow',
    description: 'Automatically nurture new leads with targeted content',
    status: 'active',
    trigger: 'New lead created',
    steps: [
      { id: '1', type: 'trigger', name: 'New Lead Created', config: { source: 'any' } },
      { id: '2', type: 'delay', name: 'Wait 1 Day', config: { duration: 1, unit: 'days' } },
      { id: '3', type: 'action', name: 'Send Welcome Email', config: { template: 'welcome' } },
      { id: '4', type: 'condition', name: 'Email Opened?', config: { condition: 'opened' } },
      { id: '5', type: 'action', name: 'Send Follow-up', config: { template: 'follow_up' } },
    ],
    totalContacts: 1245,
    completedContacts: 892,
    conversionRate: 18.5,
    createdAt: '2024-10-15',
  },
  {
    id: '2',
    name: 'Cart Recovery Automation',
    description: 'Win back abandoned carts with timely reminders',
    status: 'active',
    trigger: 'Cart abandoned',
    steps: [
      { id: '1', type: 'trigger', name: 'Cart Abandoned', config: { timeout: 30 } },
      { id: '2', type: 'delay', name: 'Wait 1 Hour', config: { duration: 1, unit: 'hours' } },
      { id: '3', type: 'action', name: 'Send Reminder Email', config: { template: 'cart_reminder' } },
      { id: '4', type: 'delay', name: 'Wait 24 Hours', config: { duration: 24, unit: 'hours' } },
      { id: '5', type: 'condition', name: 'Cart Still Abandoned?', config: { condition: 'abandoned' } },
      { id: '6', type: 'action', name: 'Send Discount Offer', config: { template: 'discount' } },
    ],
    totalContacts: 567,
    completedContacts: 234,
    conversionRate: 28.4,
    createdAt: '2024-11-01',
  },
  {
    id: '3',
    name: 'Customer Onboarding',
    description: 'Guide new customers through product setup',
    status: 'paused',
    trigger: 'New purchase',
    steps: [
      { id: '1', type: 'trigger', name: 'New Purchase', config: { product: 'any' } },
      { id: '2', type: 'action', name: 'Send Welcome Email', config: { template: 'welcome' } },
      { id: '3', type: 'delay', name: 'Wait 2 Days', config: { duration: 2, unit: 'days' } },
      { id: '4', type: 'action', name: 'Send Setup Guide', config: { template: 'setup' } },
      { id: '5', type: 'action', name: 'Add Tag', config: { tag: 'onboarding_started' } },
    ],
    totalContacts: 890,
    completedContacts: 756,
    conversionRate: 92.1,
    createdAt: '2024-09-20',
  },
];

const availableTriggers = [
  { id: 'new_lead', name: 'New Lead Created', icon: UserGroupIcon },
  { id: 'cart_abandoned', name: 'Cart Abandoned', icon: ExclamationTriangleIcon },
  { id: 'new_purchase', name: 'New Purchase', icon: CheckCircleIcon },
  { id: 'tag_added', name: 'Tag Added', icon: TagIcon },
  { id: 'form_submitted', name: 'Form Submitted', icon: FunnelIcon },
];

const availableActions = [
  { id: 'send_email', name: 'Send Email', icon: EnvelopeIcon },
  { id: 'add_tag', name: 'Add Tag', icon: TagIcon },
  { id: 'update_field', name: 'Update Field', icon: AdjustmentsHorizontalIcon },
  { id: 'notify_team', name: 'Notify Team', icon: UserGroupIcon },
  { id: 'wait', name: 'Wait/Delay', icon: ClockIcon },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingAutomation: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const getStatusBadge = (status: WorkflowStatus) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      paused: 'bg-amber-100 text-amber-700 border-amber-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const icons = {
      active: <PlayIcon className="h-3.5 w-3.5" />,
      paused: <PauseIcon className="h-3.5 w-3.5" />,
      draft: <CogIcon className="h-3.5 w-3.5" />,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStepIcon = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'trigger': return <BoltIcon className="h-4 w-4" />;
      case 'action': return <EnvelopeIcon className="h-4 w-4" />;
      case 'condition': return <FunnelIcon className="h-4 w-4" />;
      case 'delay': return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStepColor = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'trigger': return 'bg-amber-500';
      case 'action': return 'bg-blue-500';
      case 'condition': return 'bg-purple-500';
      case 'delay': return 'bg-gray-500';
    }
  };

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    totalContacts: workflows.reduce((acc, w) => acc + w.totalContacts, 0),
    avgConversion: workflows.reduce((acc, w) => acc + w.conversionRate, 0) / workflows.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white">
              <BoltIcon className="h-6 w-6" />
            </div>
            Marketing Automation
          </h1>
          <p className="mt-1 text-gray-500">
            Create automated workflows to engage your audience
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Total Workflows</p>
                <p className="text-2xl font-bold text-violet-700">{stats.total}</p>
              </div>
              <BoltIcon className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
              </div>
              <PlayIcon className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Contacts in Workflows</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalContacts.toLocaleString()}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600 font-medium">Avg Conversion</p>
                <p className="text-2xl font-bold text-rose-700">{stats.avgConversion.toFixed(1)}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-rose-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card 
            key={workflow.id} 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedWorkflow(workflow)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Workflow Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                    {getStatusBadge(workflow.status)}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{workflow.description}</p>
                  
                  {/* Workflow Steps Preview */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {workflow.steps.slice(0, 5).map((step, index) => (
                      <React.Fragment key={step.id}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${getStepColor(step.type)} text-white flex items-center justify-center`}>
                          {getStepIcon(step.type)}
                        </div>
                        {index < Math.min(workflow.steps.length - 1, 4) && (
                          <ArrowRightIcon className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                    {workflow.steps.length > 5 && (
                      <span className="text-xs text-gray-400 ml-2">+{workflow.steps.length - 5} more</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-8 lg:gap-12">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{workflow.totalContacts.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">In workflow</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{workflow.completedContacts.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-violet-600">{workflow.conversionRate}%</p>
                    <p className="text-xs text-gray-500">Conversion</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    Stats
                  </Button>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={workflow.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
                  >
                    {workflow.status === 'active' ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-violet-500" />
                Create New Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
                <input
                  type="text"
                  placeholder="e.g., Lead Nurturing"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Describe what this workflow does..."
                  rows={2}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Trigger</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableTriggers.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <button
                        key={trigger.id}
                        className="flex items-center gap-3 p-4 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Icon className="h-5 w-5 text-amber-600" />
                        </div>
                        <span className="font-medium text-sm">{trigger.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600">
                  Create & Edit Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketingAutomation;

