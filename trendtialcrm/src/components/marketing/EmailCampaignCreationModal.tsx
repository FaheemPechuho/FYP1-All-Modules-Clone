/**
 * Email Campaign Creation Modal - Ollama-Powered
 * 
 * AI-powered email campaign creation with subject line and content generation.
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
  LightBulbIcon,
} from '@heroicons/react/24/outline';

const CLARA_BACKEND_URL = import.meta.env.VITE_CLARA_BACKEND_URL || 'http://localhost:8001';

interface EmailCampaignCreationModalProps {
  onClose: () => void;
  onCampaignCreated: (campaign: any) => void;
}

const EmailCampaignCreationModal: React.FC<EmailCampaignCreationModalProps> = ({
  onClose,
  onCampaignCreated,
}) => {
  const [step, setStep] = useState<'form' | 'subject-lines' | 'content'>('form');
  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('product_launch');
  const [targetAudience, setTargetAudience] = useState('');
  const [keyBenefit, setKeyBenefit] = useState('');
  const [tone, setTone] = useState('professional');
  const [recipients, setRecipients] = useState('all');
  
  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [emailContent, setEmailContent] = useState<any>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateSubjectLines = async () => {
    if (!targetAudience || !keyBenefit) {
      setError('Please fill in target audience and key benefit');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/email/subject-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_goal: campaignGoal,
          target_audience: targetAudience,
          key_benefit: keyBenefit,
          count: 5,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate subject lines');

      const data = await response.json();
      setSubjectLines(data.subject_lines || []);
      setStep('subject-lines');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate subject lines');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmailContent = async () => {
    if (!selectedSubject) {
      setError('Please select a subject line');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/email/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          goal: campaignGoal,
          audience: targetAudience,
          tone: tone,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate email content');

      const data = await response.json();
      setEmailContent(data);
      setStep('content');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const createCampaign = () => {
    const newCampaign = {
      id: Date.now().toString(),
      name: campaignName || 'AI-Generated Campaign',
      subject: selectedSubject,
      status: 'draft' as const,
      recipients: recipients === 'all' ? 15420 : 8750,
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      createdAt: new Date().toISOString(),
      template: 'ai-generated',
    };

    onCampaignCreated(newCampaign);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            {step === 'form' && 'Create Email Campaign'}
            {step === 'subject-lines' && 'Select Subject Line'}
            {step === 'content' && 'Review Email Content'}
          </CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Campaign Details */}
          {step === 'form' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Holiday Sale 2024"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Goal
                </label>
                <select
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="product_launch">Product Launch</option>
                  <option value="webinar_registration">Webinar Registration</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="promotional">Promotional</option>
                  <option value="re_engagement">Re-engagement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., small business owners, marketing professionals"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Benefit
                </label>
                <input
                  type="text"
                  value={keyBenefit}
                  onChange={(e) => setKeyBenefit(e.target.value)}
                  placeholder="e.g., save 10 hours per week, increase revenue by 30%"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <select
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Subscribers (15,420)</option>
                  <option value="active">Active Users (8,750)</option>
                  <option value="new">New Leads (2,340)</option>
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
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                  onClick={generateSubjectLines}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
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

          {/* Step 2: Subject Line Selection */}
          {step === 'subject-lines' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <LightBulbIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">AI-Generated Subject Lines</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Select a subject line or go back to adjust parameters
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {subjectLines.map((subject, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSubject(subject)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedSubject === subject
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-900 flex-1">{subject}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                  onClick={generateEmailContent}
                  disabled={!selectedSubject || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Email Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Email Content Review */}
          {step === 'content' && emailContent && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <SparklesIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Email Content Generated!</p>
                    <p className="text-xs text-green-700 mt-1">
                      Review and create your campaign
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                    {selectedSubject}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Greeting</label>
                  <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                    {emailContent.greeting}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opening</label>
                  <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                    {emailContent.opening}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                  <div className="p-3 bg-gray-50 border rounded-lg text-sm whitespace-pre-wrap">
                    {emailContent.body}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Call to Action</label>
                  <div className="p-3 bg-gray-50 border rounded-lg text-sm font-medium text-primary">
                    {emailContent.cta}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Closing</label>
                  <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                    {emailContent.closing}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('subject-lines')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                  onClick={createCampaign}
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailCampaignCreationModal;
