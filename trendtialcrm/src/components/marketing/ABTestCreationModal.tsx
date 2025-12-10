/**
 * A/B Test Creation Modal - Ollama-Powered
 * 
 * AI-powered A/B test variant generation and management.
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
  BeakerIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const CLARA_BACKEND_URL = import.meta.env.VITE_CLARA_BACKEND_URL || 'http://localhost:8001';

interface ABTestCreationModalProps {
  onClose: () => void;
  onTestCreated: (test: any) => void;
}

const ABTestCreationModal: React.FC<ABTestCreationModalProps> = ({
  onClose,
  onTestCreated,
}) => {
  const [step, setStep] = useState<'form' | 'variants'>('form');
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState('subject_line');
  const [original, setOriginal] = useState('');
  const [goal, setGoal] = useState('increase_opens');
  const [numVariants, setNumVariants] = useState(3);
  
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateVariants = async () => {
    if (!original) {
      setError('Please enter the original version');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/ab-testing/generate-variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: testType,
          original: original,
          goal: goal,
          num_variants: numVariants,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate variants');

      const data = await response.json();
      setVariants(data.variants || []);
      setSelectedVariants([original]); // Include original as control
      setStep('variants');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variants');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleVariant = (variant: string) => {
    setSelectedVariants(prev =>
      prev.includes(variant)
        ? prev.filter(v => v !== variant)
        : [...prev, variant]
    );
  };

  const createTest = () => {
    const newTest = {
      id: Date.now().toString(),
      name: testName || `${testType.replace('_', ' ')} Test`,
      type: testType,
      goal: goal,
      variants: selectedVariants.map((v, i) => ({
        name: i === 0 ? 'Control (A)' : `Variant ${String.fromCharCode(65 + i)}`,
        content: v,
        impressions: 0,
        conversions: 0,
        conversion_rate: 0,
      })),
      status: 'draft' as const,
      started_at: null,
      ended_at: null,
    };

    onTestCreated(newTest);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-orange-500" />
            {step === 'form' && 'Create A/B Test'}
            {step === 'variants' && 'Select Variants'}
          </CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Test Configuration */}
          {step === 'form' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Holiday Email Subject Line Test"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="subject_line">Email Subject Line</option>
                  <option value="cta">Call-to-Action Button</option>
                  <option value="email_content">Email Content</option>
                  <option value="landing_page">Landing Page Headline</option>
                  <option value="ad_copy">Ad Copy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Version (Control)
                </label>
                <textarea
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  rows={3}
                  placeholder="Enter your current version..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="increase_opens">Increase Open Rate</option>
                  <option value="increase_clicks">Increase Click Rate</option>
                  <option value="increase_conversions">Increase Conversions</option>
                  <option value="reduce_unsubscribes">Reduce Unsubscribes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Variants to Generate
                </label>
                <select
                  value={numVariants}
                  onChange={(e) => setNumVariants(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={2}>2 variants</option>
                  <option value={3}>3 variants</option>
                  <option value={4}>4 variants</option>
                  <option value={5}>5 variants</option>
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
                  onClick={generateVariants}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating Variants...
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

          {/* Step 2: Variant Selection */}
          {step === 'variants' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Variants Generated!</p>
                    <p className="text-xs text-green-700 mt-1">
                      Select which variants to include in your test (including control)
                    </p>
                  </div>
                </div>
              </div>

              {/* Control (Original) */}
              <div
                onClick={() => toggleVariant(original)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedVariants.includes(original)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">A</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 uppercase">Control</span>
                      <span className="text-xs text-gray-500">(Original)</span>
                    </div>
                    <p className="text-sm text-gray-900">{original}</p>
                  </div>
                </div>
              </div>

              {/* Generated Variants */}
              {variants.map((variant, index) => (
                <div
                  key={index}
                  onClick={() => toggleVariant(variant)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedVariants.includes(variant)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-bold">
                          {String.fromCharCode(66 + index)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-orange-600 uppercase">
                          Variant {String.fromCharCode(66 + index)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{variant}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>{selectedVariants.length} variants selected</strong> for testing.
                  We recommend testing 2-4 variants for statistically significant results.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                  onClick={createTest}
                  disabled={selectedVariants.length < 2}
                >
                  <BeakerIcon className="h-4 w-4 mr-2" />
                  Create A/B Test
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ABTestCreationModal;
