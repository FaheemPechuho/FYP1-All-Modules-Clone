/**
 * Social Post Creation Modal - Ollama-Powered
 * 
 * AI-powered social media content creation with platform-specific optimization.
 * Connects to Clara Marketing Agent backend (Ollama).
 * 
 * Features:
 * - Platform-specific content generation
 * - AI-powered hashtag suggestions
 * - Character limit enforcement
 * - Editable content
 * - Multi-platform posting
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
  HashtagIcon,
  PhotoIcon,
  ClockIcon,
  PencilIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const CLARA_BACKEND_URL = import.meta.env.VITE_CLARA_BACKEND_URL || 'http://localhost:8001';

// Platform icons
const FacebookIcon = () => <span className="text-blue-600 text-lg">📘</span>;
const TwitterIcon = () => <span className="text-blue-400 text-lg">🐦</span>;
const LinkedInIcon = () => <span className="text-blue-700 text-lg">💼</span>;
const InstagramIcon = () => <span className="text-pink-500 text-lg">📸</span>;
const TikTokIcon = () => <span className="text-black text-lg">🎵</span>;

type Platform = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok';

interface SocialPostCreationModalProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

const SocialPostCreationModal: React.FC<SocialPostCreationModalProps> = ({
  onClose,
  onPostCreated,
}) => {
  const [step, setStep] = useState<'form' | 'generated' | 'edit'>('form');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('linkedin');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('engagement');
  const [includeCTA, setIncludeCTA] = useState(true);
  
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const platformSpecs = {
    facebook: { maxChars: 63206, optimal: 250, icon: <FacebookIcon />, name: 'Facebook' },
    twitter: { maxChars: 280, optimal: 250, icon: <TwitterIcon />, name: 'Twitter' },
    linkedin: { maxChars: 3000, optimal: 150, icon: <LinkedInIcon />, name: 'LinkedIn' },
    instagram: { maxChars: 2200, optimal: 150, icon: <InstagramIcon />, name: 'Instagram' },
    tiktok: { maxChars: 2200, optimal: 150, icon: <TikTokIcon />, name: 'TikTok' },
  };

  const generatePost = async () => {
    if (!topic) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/social/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          topic: topic,
          goal: goal,
          include_cta: includeCTA,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate post');

      const data = await response.json();
      setGeneratedPost(data);
      setEditedContent(data.content);
      setEditedHashtags(data.hashtags || []);
      setStep('generated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHashtags = async () => {
    if (!topic) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`${CLARA_BACKEND_URL}/api/marketing/social/hashtags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          platform: selectedPlatform,
          count: 10,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate hashtags');

      const data = await response.json();
      setEditedHashtags(data.hashtags || []);
    } catch (err) {
      console.error('Hashtag generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const createPost = () => {
    const newPost = {
      id: Date.now().toString(),
      content: editedContent,
      platforms: [selectedPlatform],
      hashtags: editedHashtags,
      scheduledAt: scheduleDate && scheduleTime 
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : new Date().toISOString(),
      status: scheduleDate ? 'scheduled' as const : 'draft' as const,
      mediaType: undefined,
    };

    onPostCreated(newPost);
  };

  const charCount = editedContent.length;
  const charLimit = platformSpecs[selectedPlatform].maxChars;
  const isOverLimit = charCount > charLimit;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-pink-500" />
            {step === 'form' && 'Create Social Media Post'}
            {step === 'generated' && 'AI-Generated Content'}
            {step === 'edit' && 'Edit & Schedule Post'}
          </CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Content Generation Form */}
          {step === 'form' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Platform
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(platformSpecs) as Platform[]).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedPlatform === platform
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {platformSpecs[platform].icon}
                      <span className="text-xs font-medium">{platformSpecs[platform].name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Character limit: {platformSpecs[selectedPlatform].maxChars.toLocaleString()} 
                  (optimal: {platformSpecs[selectedPlatform].optimal})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., productivity tips for remote teams, new product launch"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="engagement">Engagement</option>
                  <option value="traffic">Drive Traffic</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="thought_leadership">Thought Leadership</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeCTA"
                  checked={includeCTA}
                  onChange={(e) => setIncludeCTA(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="includeCTA" className="text-sm text-gray-700">
                  Include call-to-action
                </label>
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
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600"
                  onClick={generatePost}
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

          {/* Step 2: Generated Content */}
          {(step === 'generated' || step === 'edit') && generatedPost && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Content Generated for {platformSpecs[selectedPlatform].name}!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Edit the content below or generate new hashtags
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Post Content
                  </label>
                  <span className={`text-xs ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {charCount} / {charLimit.toLocaleString()}
                  </span>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${
                    isOverLimit ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                />
                {isOverLimit && (
                  <p className="text-xs text-red-600 mt-1">
                    Content exceeds {platformSpecs[selectedPlatform].name} character limit
                  </p>
                )}
              </div>

              {/* Editable Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hashtags
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateHashtags}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <HashtagIcon className="h-3.5 w-3.5 mr-1" />
                    )}
                    Regenerate
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-gray-50">
                  {editedHashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => setEditedHashtags(editedHashtags.filter((_, i) => i !== index))}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {editedHashtags.length === 0 && (
                    <p className="text-sm text-gray-400">No hashtags generated</p>
                  )}
                </div>
              </div>

              {/* Emoji Suggestions */}
              {generatedPost.emoji_suggestions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggested Emojis
                  </label>
                  <div className="flex gap-2">
                    {generatedPost.emoji_suggestions.map((emoji: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setEditedContent(editedContent + ' ' + emoji)}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Post (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600"
                  onClick={createPost}
                  disabled={isOverLimit}
                >
                  {scheduleDate ? (
                    <>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Schedule Post
                    </>
                  ) : (
                    <>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Save as Draft
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialPostCreationModal;
