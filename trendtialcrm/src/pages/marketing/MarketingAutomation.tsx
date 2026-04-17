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
import WorkflowCreationModal from '../../components/marketing/WorkflowCreationModal';
import { useLeadsQuery } from '../../hooks/queries/useLeadsQuery';

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

const WORKFLOWS_KEY = 'crm_automation_workflows';

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingAutomation: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    try { return JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]'); }
    catch { return []; }
  });

  const { data } = useLeadsQuery({ limit: 1000 });
  const totalLeads = data?.leads?.length ?? 0;

  const saveWorkflows = (updated: Workflow[]) => {
    setWorkflows(updated);
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(updated));
  };

  const toggleStatus = (id: string) => {
    saveWorkflows(workflows.map(w =>
      w.id === id
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' as WorkflowStatus }
        : w
    ));
  };

  const deleteWorkflow = (id: string) => saveWorkflows(workflows.filter(w => w.id !== id));

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
    totalContacts: totalLeads,
    avgConversion: workflows.length > 0
      ? workflows.reduce((acc, w) => acc + w.conversionRate, 0) / workflows.length
      : 0,
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
            className="hover:shadow-lg transition-all duration-300"
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
                    onClick={() => toggleStatus(workflow.id)}
                    title={workflow.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {workflow.status === 'active' ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deleteWorkflow(workflow.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Workflow Modal - AI-Powered */}
      {showCreateModal && (
        <WorkflowCreationModal
          onClose={() => setShowCreateModal(false)}
          onWorkflowCreated={(workflow) => {
            const wf = workflow as Workflow;
            const entry: Workflow = {
              id: wf.id || Date.now().toString(),
              name: wf.name || 'New Workflow',
              description: wf.description || '',
              status: wf.status || 'draft',
              trigger: wf.trigger || 'Manual',
              steps: wf.steps || [],
              totalContacts: totalLeads,
              completedContacts: 0,
              conversionRate: 0,
              createdAt: new Date().toISOString().split('T')[0],
            };
            saveWorkflows([entry, ...workflows]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MarketingAutomation;

