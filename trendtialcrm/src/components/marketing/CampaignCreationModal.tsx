/**
 * Campaign Creation Modal - Ollama-Powered
 * 
 * AI-powered campaign creation with idea generation and optimization.
 * Connects to Clara Marketing Agent backend (Ollama).
 * 
 * @author AI Assistant
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  SparklesIcon,
  LightBulbIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const CLARA_BACKEND_URL = import.meta.env.VITE_CLARA_BACKEND_URL || 'http://localhost:8001';

interface CampaignCreationModalProps {
  onClose: () => void;
  onCampaignCreated: (campaign: any) => void;
}

interface CampaignIdea {
  name: string;
  description: string;
  channels: string[];
  expected_roi: string;
  metrics: string[];
}

const CampaignCreationModal: React.FC<CampaignCreationModalProps> = ({
  onClose,
  onCampaignCreated,
}) => {
  const [step, setStep] = useState<'form' | 'ideas' | 'creating'>('form');
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('lead_generation');
  const [budget, setBudget] = useState('5000');
  const [campaignIdeas, setCampaignIdeas] = useState<CampaignIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<CampaignIdea | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateIdeas = async () => {
    if (!industry || !budget) {
      setError('Please fill in all fields');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/campaigns/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          goal,
          budget: parseFloat(budget),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate campaign ideas');
      }

      const data = await response.json();
      setCampaignIdeas(data.campaigns || []);
      setStep('ideas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  const createCampaign = () => {
    if (!selectedIdea) return;

    // Create campaign object
    const newCampaign = {
      id: Date.now().toString(),
      name: selectedIdea.name,
      channel: selectedIdea.channels[0],
      total_leads: 0,
      closed_won: 0,
      conversion_rate: 0,
      total_value: 0,
      costPerLead: 0,
      status: 'active' as const,
    };

    onCampaignCreated(newCampaign);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            {step === 'form' && 'Create New Campaign'}
            {step === 'ideas' && 'AI-Generated Campaign Ideas'}
            {step === 'creating' && 'Creating Campaign...'}
          </CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Campaign Details Form */}
          {step === 'form' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., B2B SaaS, E-commerce, Healthcare"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="lead_generation">Lead Generation</option>
                  <option value="brand_awareness">Brand Awareness</option>
                  <option value="sales">Direct Sales</option>
                  <option value="engagement">Engagement</option>
                  <option value="retention">Customer Retention</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget ($)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="5000"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600"
                  onClick={generateIdeas}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating Ideas...
                    </>
                  ) : (
                    <>
                      <LightBulbIcon className="h-4 w-4 mr-2" />
                      Generate AI Ideas
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

          {/* Step 2: Campaign Ideas Selection */}
          {step === 'ideas' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <LightBulbIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">AI-Generated Ideas</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Select a campaign idea to create, or go back to adjust your parameters
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {campaignIdeas.map((idea, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedIdea === idea
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{idea.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {idea.channels.map((channel, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t">
                      <span className="text-gray-600">
                        Expected ROI: <span className="font-semibold text-green-600">{idea.expected_roi}</span>
                      </span>
                      <span className="text-gray-600">
                        {idea.metrics.length} key metrics
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('form')}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600"
                  onClick={createCampaign}
                  disabled={!selectedIdea}
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

export default CampaignCreationModal;
