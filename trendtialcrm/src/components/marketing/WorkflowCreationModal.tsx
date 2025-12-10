/**
 * Workflow Creation Modal - Ollama-Powered
 * 
 * AI-powered marketing automation workflow creation.
 * Connects to Clara Marketing Agent backend (Ollama).
 * 
 * @author AI Assistant
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const CLARA_BACKEND_URL = import.meta.env.VITE_CLARA_BACKEND_URL || 'http://localhost:8001';

interface WorkflowCreationModalProps {
  onClose: () => void;
  onWorkflowCreated: (workflow: any) => void;
}

const WorkflowCreationModal: React.FC<WorkflowCreationModalProps> = ({
  onClose,
  onWorkflowCreated,
}) => {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [workflowName, setWorkflowName] = useState('');
  const [goal, setGoal] = useState('lead_nurturing');
  const [triggerType, setTriggerType] = useState('new_lead');
  const [audience, setAudience] = useState('');
  
  const [workflow, setWorkflow] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateWorkflow = async () => {
    if (!audience) {
      setError('Please enter target audience');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/automation/suggest-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal,
          trigger_type: triggerType,
          audience: audience,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate workflow');

      const data = await response.json();
      setWorkflow(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const createWorkflow = () => {
    const newWorkflow = {
      id: Date.now().toString(),
      name: workflowName || workflow.name,
      goal: goal,
      trigger: triggerType,
      audience: audience,
      steps: workflow.steps,
      status: 'draft' as const,
      total_contacts: 0,
      completed: 0,
      conversion_rate: 0,
    };

    onWorkflowCreated(newWorkflow);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger': return '🎯';
      case 'delay': return '⏰';
      case 'action': return '⚡';
      case 'condition': return '🔀';
      default: return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-500" />
            {step === 'form' && 'Create Automation Workflow'}
            {step === 'preview' && 'Preview Workflow'}
          </CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Workflow Details */}
          {step === 'form' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="e.g., Lead Nurturing Campaign"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="lead_nurturing">Lead Nurturing</option>
                  <option value="customer_onboarding">Customer Onboarding</option>
                  <option value="re_engagement">Re-engagement</option>
                  <option value="abandoned_cart">Abandoned Cart Recovery</option>
                  <option value="upsell">Upsell/Cross-sell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Event
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="new_lead">New Lead Created</option>
                  <option value="form_submit">Form Submitted</option>
                  <option value="tag_added">Tag Added</option>
                  <option value="email_opened">Email Opened</option>
                  <option value="no_activity">No Activity (X days)</option>
                  <option value="purchase">Purchase Made</option>
                  <option value="cart_abandoned">Cart Abandoned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., new leads from website, trial users"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600"
                  onClick={generateWorkflow}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating Workflow...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center text-xs text-gray-500 pt-2">
                <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                Powered by Ollama - Local AI
              </div>
            </div>
          )}

          {/* Step 2: Workflow Preview */}
          {step === 'preview' && workflow && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Workflow Generated!</p>
                    <p className="text-xs text-green-700 mt-1">
                      {workflow.steps?.length || 0} steps created for {goal.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{workflow.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{workflow.description}</p>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Workflow Steps:</h4>
                {workflow.steps?.map((step: any, index: number) => (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                          {getStepIcon(step.type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-purple-600 uppercase">
                            {step.type}
                          </span>
                          <h4 className="font-semibold text-gray-900">{step.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        {step.config && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                            <code>{JSON.stringify(step.config, null, 2)}</code>
                          </div>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-300">
                        {step.step_number}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expected Outcome */}
              {workflow.expected_outcome && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-1">Expected Outcome:</h4>
                  <p className="text-sm text-blue-700">{workflow.expected_outcome}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600"
                  onClick={createWorkflow}
                >
                  <BoltIcon className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowCreationModal;
