/**
 * Marketing Templates Library
 * 
 * Centralized library for all marketing content templates.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  MegaphoneIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  HeartIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type TemplateCategory = 'all' | 'email' | 'social' | 'ad' | 'landing' | 'script' | 'sms';

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  uses: number;
  rating: number;
  tags: string[];
  preview: string;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const categories = [
  { id: 'all' as const, name: 'All Templates', icon: DocumentDuplicateIcon, count: 24 },
  { id: 'email' as const, name: 'Email', icon: EnvelopeIcon, count: 8 },
  { id: 'social' as const, name: 'Social Media', icon: MegaphoneIcon, count: 6 },
  { id: 'ad' as const, name: 'Ads', icon: PresentationChartBarIcon, count: 4 },
  { id: 'landing' as const, name: 'Landing Pages', icon: DocumentTextIcon, count: 3 },
  { id: 'script' as const, name: 'Call Scripts', icon: PhoneIcon, count: 2 },
  { id: 'sms' as const, name: 'SMS', icon: ChatBubbleLeftIcon, count: 1 },
];

const templates: Template[] = [
  { id: '1', name: 'Welcome Email Series', category: 'email', description: 'Warm welcome for new subscribers', uses: 1245, rating: 4.9, tags: ['onboarding', 'welcome'], preview: 'Welcome to our community! We\'re thrilled to have you...' },
  { id: '2', name: 'Product Launch Announcement', category: 'email', description: 'Announce new products with impact', uses: 892, rating: 4.8, tags: ['launch', 'announcement'], preview: 'Big news! Introducing our latest innovation...' },
  { id: '3', name: 'Flash Sale Promo', category: 'email', description: 'Create urgency with limited-time offers', uses: 1567, rating: 4.7, tags: ['sale', 'promotion'], preview: '⚡ Flash Sale! 50% off for 24 hours only...' },
  { id: '4', name: 'LinkedIn Thought Leadership', category: 'social', description: 'Establish authority with insights', uses: 456, rating: 4.6, tags: ['linkedin', 'thought-leadership'], preview: 'Here\'s what I learned about [industry] after...' },
  { id: '5', name: 'Instagram Story Carousel', category: 'social', description: 'Engaging multi-slide stories', uses: 789, rating: 4.8, tags: ['instagram', 'stories'], preview: 'Swipe to see our top 5 tips for...' },
  { id: '6', name: 'Facebook Lead Gen Ad', category: 'ad', description: 'High-converting lead generation', uses: 2134, rating: 4.9, tags: ['facebook', 'lead-gen'], preview: 'Stop struggling with [pain point]. Our solution...' },
  { id: '7', name: 'Google Search Ad Copy', category: 'ad', description: 'Compelling search ad headlines', uses: 1890, rating: 4.7, tags: ['google', 'search'], preview: 'Get [Benefit] in [Timeframe] | Free Trial Available' },
  { id: '8', name: 'Cold Call Opening Script', category: 'script', description: 'Break the ice professionally', uses: 678, rating: 4.5, tags: ['cold-call', 'sales'], preview: 'Hi [Name], I noticed your company recently...' },
  { id: '9', name: 'Webinar Landing Page', category: 'landing', description: 'Drive registrations effectively', uses: 345, rating: 4.8, tags: ['webinar', 'registration'], preview: 'Join us for an exclusive webinar on...' },
  { id: '10', name: 'Cart Abandonment SMS', category: 'sms', description: 'Recover lost sales via text', uses: 567, rating: 4.6, tags: ['sms', 'recovery'], preview: 'Hey! You left something behind. Complete your order...' },
  { id: '11', name: 'Customer Win-Back Email', category: 'email', description: 'Re-engage inactive customers', uses: 923, rating: 4.7, tags: ['win-back', 're-engagement'], preview: 'We miss you! Here\'s a special offer just for you...' },
  { id: '12', name: 'Twitter Thread Template', category: 'social', description: 'Create viral thread content', uses: 412, rating: 4.5, tags: ['twitter', 'thread'], preview: '🧵 Thread: Everything you need to know about...' },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingTemplatesLibrary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: TemplateCategory) => {
    const cat = categories.find(c => c.id === category);
    return cat ? <cat.icon className="h-4 w-4" /> : <DocumentDuplicateIcon className="h-4 w-4" />;
  };

  const getCategoryColor = (category: TemplateCategory) => {
    const colors: Record<TemplateCategory, string> = {
      all: 'bg-gray-100 text-gray-700',
      email: 'bg-blue-100 text-blue-700',
      social: 'bg-pink-100 text-pink-700',
      ad: 'bg-amber-100 text-amber-700',
      landing: 'bg-violet-100 text-violet-700',
      script: 'bg-emerald-100 text-emerald-700',
      sms: 'bg-cyan-100 text-cyan-700',
    };
    return colors[category];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white">
              <DocumentDuplicateIcon className="h-6 w-6" />
            </div>
            Templates Library
          </h1>
          <p className="mt-1 text-gray-500">
            Browse and use our collection of high-converting marketing templates
          </p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block space-y-4">
          <Card>
            <CardContent className="p-2">
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {category.name}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedCategory === category.id
                          ? 'bg-white/20'
                          : 'bg-gray-200'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Generator CTA */}
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <SparklesIcon className="h-8 w-8 mb-3" />
              <h3 className="font-bold mb-2">AI Template Generator</h3>
              <p className="text-sm text-white/80 mb-4">
                Create custom templates with AI
              </p>
              <Button className="w-full bg-white text-violet-600 hover:bg-white/90">
                Generate Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates by name, description, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {getCategoryIcon(template.category)}
                      {template.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium">{template.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{template.description}</p>

                  {/* Preview */}
                  <div className="p-3 bg-gray-50 rounded-lg mb-3">
                    <p className="text-xs text-gray-600 line-clamp-2 italic">&ldquo;{template.preview}&rdquo;</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <HeartIcon className="h-3.5 w-3.5" />
                      {template.uses.toLocaleString()} uses
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="h-8 px-3 bg-primary text-white text-xs">
                        Use
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <DocumentDuplicateIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No templates found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketingTemplatesLibrary;

