/**
 * Email Sequence Creation Modal - Ollama-Powered
 * 
 * AI-powered email sequence creation for automated nurturing.
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
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const CLARA_BACKEND_URL = import.meta.env.VITE_CLARA_BACKEND_URL || 'http://localhost:8001';

interface EmailSequenceCreationModalProps {
  onClose: () => void;
  onSequenceCreated: (sequence: any) => void;
}

const EmailSequenceCreationModal: React.FC<EmailSequenceCreationModalProps> = ({
  onClose,
  onSequenceCreated,
}) => {
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceGoal, setSequenceGoal] = useState('customer_onboarding');
  const [audience, setAudience] = useState('');
  const [numEmails, setNumEmails] = useState(3);
  const [sequence, setSequence] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'preview'>('form');

  const generateSequence = async () => {
    if (!audience) {
      setError('Please enter target audience');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/email/sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence_goal: sequenceGoal,
          audience: audience,
          num_emails: numEmails,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate sequence');

      const data = await response.json();
      setSequence(data.sequence || []);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sequence');
    } finally {
      setIsGenerating(false);
    }
  };

  const createSequence = () => {
    const newSequence = {
      id: Date.now().toString(),
      name: sequenceName || 'AI-Generated Sequence',
      goal: sequenceGoal,
      audience: audience,
      emails: sequence,
      status: 'draft' as const,
      subscribers: 0,
      completed: 0,
      conversionRate: 0,
    };

    onSequenceCreated(newSequence);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-orange-500" />
            {step === 'form' && 'Create Email Sequence'}
            {step === 'preview' && 'Preview Email Sequence'}
          </CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Sequence Details */}
          {step === 'form' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sequence Name
                </label>
                <input
                  type="text"
                  value={sequenceName}
                  onChange={(e) => setSequenceName(e.target.value)}
                  placeholder="e.g., Welcome Series, Onboarding Flow"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sequence Goal
                </label>
                <select
                  value={sequenceGoal}
                  onChange={(e) => setSequenceGoal(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="customer_onboarding">Customer Onboarding</option>
                  <option value="lead_nurturing">Lead Nurturing</option>
                  <option value="product_education">Product Education</option>
                  <option value="re_engagement">Re-engagement</option>
                  <option value="trial_conversion">Trial Conversion</option>
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
                  placeholder="e.g., new SaaS customers, trial users"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Emails
                </label>
                <select
                  value={numEmails}
                  onChange={(e) => setNumEmails(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={3}>3 emails</option>
                  <option value={5}>5 emails</option>
                  <option value={7}>7 emails</option>
                </select>
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
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                  onClick={generateSequence}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating Sequence...
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

          {/* Step 2: Sequence Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <SparklesIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Email Sequence Generated!</p>
                    <p className="text-xs text-green-700 mt-1">
                      {sequence.length} emails ready for your {sequenceGoal.replace('_', ' ')} campaign
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {sequence.map((email, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-bold">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">{email.subject}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4" />
                          <span>Send on Day {email.day}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-13 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Topic</p>
                        <p className="text-sm text-gray-700">{email.topic}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Key Points</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {email.key_points?.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-orange-500">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                  onClick={createSequence}
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSequenceCreationModal;
