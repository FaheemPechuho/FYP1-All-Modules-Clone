// src/components/marketing/ContentStudio.tsx
import React, { useState } from 'react';
import { Lead } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  RocketLaunchIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface ContentStudioProps {
  leads: Lead[];
}

type ContentType = 'cold-call' | 'email' | 'sms' | 'fb-ad' | 'tiktok-ad';
type Tone = 'professional' | 'friendly' | 'casual' | 'formal' | 'persuasive';

const ContentStudio: React.FC<ContentStudioProps> = ({ leads }) => {
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [contentType, setContentType] = useState<ContentType>('cold-call');
  const [tone, setTone] = useState<Tone>('professional');
  const [generatedContent, setGeneratedContent] = useState<{
    subject?: string;
    body: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedLead) {
      alert('Please select a lead first');
      return;
    }

    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedContent({
        subject: contentType === 'email' ? 'Exciting Opportunity for Your Business' : undefined,
        body: `This is a generated ${contentType} script with a ${tone} tone for the selected lead. The content will be personalized based on the lead's information and preferences.`
      });
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = () => {
    if (generatedContent) {
      const textToCopy = generatedContent.subject 
        ? `${generatedContent.subject}\n\n${generatedContent.body}`
        : generatedContent.body;
      navigator.clipboard.writeText(textToCopy);
      alert('Content copied to clipboard!');
    }
  };

  const handleSend = () => {
    if (generatedContent) {
      alert('Content sent! (This is a dummy action)');
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Input/Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Select Lead */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Lead
            </label>
            <select
              value={selectedLead}
              onChange={(e) => setSelectedLead(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose a lead...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.clients?.client_name || lead.contact_person || 'Unknown Lead'}
                </option>
              ))}
            </select>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Content Type
            </label>
            <div className="space-y-2">
              {[
                { value: 'cold-call', label: 'Cold Call' },
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
                { value: 'fb-ad', label: 'FB Ad' },
                { value: 'tiktok-ad', label: 'TikTok Ad' }
              ].map((type) => (
                <label
                  key={type.value}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="contentType"
                    value={type.value}
                    checked={contentType === type.value}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="persuasive">Persuasive</option>
            </select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedLead}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            {isGenerating ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RocketLaunchIcon className="h-5 w-5 mr-2" />
                Generate
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Right Panel - Generated Content */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
        </CardHeader>
        <CardContent>
          {generatedContent ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
                {generatedContent.subject && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Subject:
                    </div>
                    <div className="text-gray-900">{generatedContent.subject}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Body:
                  </div>
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {generatedContent.body}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={handleSend}
                  variant="default"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send
                </Button>
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <SparklesIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Generated content appears here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentStudio;

