/**
 * Marketing Email Templates
 * 
 * Email template library with drag-and-drop editor preview.
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
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
  StarIcon,
  HeartIcon,
  RocketLaunchIcon,
  GiftIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  uses: number;
  rating: number;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const templateCategories = [
  { id: 'all', name: 'All Templates', icon: DocumentDuplicateIcon },
  { id: 'promotional', name: 'Promotional', icon: MegaphoneIcon },
  { id: 'newsletter', name: 'Newsletter', icon: EnvelopeIcon },
  { id: 'welcome', name: 'Welcome', icon: HeartIcon },
  { id: 'product', name: 'Product Launch', icon: RocketLaunchIcon },
  { id: 'holiday', name: 'Holiday', icon: GiftIcon },
];

const emailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Modern Newsletter',
    category: 'newsletter',
    description: 'Clean and professional newsletter template with hero image and article sections.',
    thumbnail: '/api/placeholder/300/200',
    uses: 245,
    rating: 4.8,
    isStarred: true,
    createdAt: '2024-11-15',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    name: 'Flash Sale',
    category: 'promotional',
    description: 'High-conversion promotional template with countdown timer and bold CTAs.',
    thumbnail: '/api/placeholder/300/200',
    uses: 189,
    rating: 4.9,
    isStarred: true,
    createdAt: '2024-10-20',
    updatedAt: '2024-11-28',
  },
  {
    id: '3',
    name: 'Welcome Series',
    category: 'welcome',
    description: 'Warm welcome email template perfect for onboarding new subscribers.',
    thumbnail: '/api/placeholder/300/200',
    uses: 567,
    rating: 4.7,
    isStarred: false,
    createdAt: '2024-09-10',
    updatedAt: '2024-11-15',
  },
  {
    id: '4',
    name: 'Product Announcement',
    category: 'product',
    description: 'Showcase your new product with stunning visuals and feature highlights.',
    thumbnail: '/api/placeholder/300/200',
    uses: 134,
    rating: 4.6,
    isStarred: false,
    createdAt: '2024-11-01',
    updatedAt: '2024-12-05',
  },
  {
    id: '5',
    name: 'Holiday Greetings',
    category: 'holiday',
    description: 'Festive template with seasonal designs and special offer sections.',
    thumbnail: '/api/placeholder/300/200',
    uses: 312,
    rating: 4.9,
    isStarred: true,
    createdAt: '2024-11-20',
    updatedAt: '2024-12-08',
  },
  {
    id: '6',
    name: 'Minimalist Promo',
    category: 'promotional',
    description: 'Simple, elegant promotional template that puts your message first.',
    thumbnail: '/api/placeholder/300/200',
    uses: 98,
    rating: 4.5,
    isStarred: false,
    createdAt: '2024-12-01',
    updatedAt: '2024-12-09',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingEmailTemplates: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const filteredTemplates = emailTemplates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
              <DocumentDuplicateIcon className="h-6 w-6" />
            </div>
            Email Templates
          </h1>
          <p className="mt-1 text-gray-500">
            Beautiful, responsive email templates for every occasion
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar Categories */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {templateCategories.map((category) => {
                  const Icon = category.icon;
                  const count = category.id === 'all' 
                    ? emailTemplates.length 
                    : emailTemplates.filter(t => t.category === category.id).length;
                  
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
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Template Generator CTA */}
          <Card className="mt-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <SparklesIcon className="h-8 w-8 mb-3" />
              <h3 className="font-bold mb-2">AI Template Generator</h3>
              <p className="text-sm text-white/80 mb-4">
                Create custom templates with AI in seconds
              </p>
              <Button className="w-full bg-white text-indigo-600 hover:bg-white/90">
                Generate Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        <div className="flex-1">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Template Preview */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-40 bg-white rounded shadow-lg flex flex-col">
                      <div className="h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t" />
                      <div className="flex-1 p-2 space-y-1">
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-2/3" />
                        <div className="h-6 bg-indigo-100 rounded mt-2" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="sm" 
                      className="bg-white text-gray-900 hover:bg-gray-100"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" className="bg-primary">
                      Use Template
                    </Button>
                  </div>

                  {/* Star Badge */}
                  {template.isStarred && (
                    <div className="absolute top-2 right-2">
                      <StarIconSolid className="h-6 w-6 text-amber-400 drop-shadow" />
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <StarIconSolid className="h-4 w-4" />
                      <span className="text-sm font-medium text-gray-700">{template.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      {template.uses} uses
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <DocumentDuplicateIcon className="h-3.5 w-3.5" />
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
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>{previewTemplate.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{previewTemplate.description}</p>
              </div>
              <Button variant="ghost" onClick={() => setPreviewTemplate(null)}>✕</Button>
            </CardHeader>
            <CardContent className="p-6">
              {/* Email Preview */}
              <div className="bg-gray-100 rounded-xl p-8">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                  {/* Email Header */}
                  <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                    <h2 className="text-2xl font-bold text-white">Your Brand</h2>
                  </div>
                  
                  {/* Email Body */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">Welcome to our newsletter!</h3>
                    <p className="text-gray-600">
                      Thank you for subscribing. We're excited to share our latest updates, 
                      exclusive offers, and valuable content with you.
                    </p>
                    <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      [Featured Image]
                    </div>
                    <p className="text-gray-600">
                      Stay tuned for amazing content coming your way. We promise to only send 
                      you valuable information that matters.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">
                      Shop Now
                    </Button>
                  </div>
                  
                  {/* Email Footer */}
                  <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                    <p>© 2024 Your Company. All rights reserved.</p>
                    <p className="mt-1">Unsubscribe | Privacy Policy</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600">
                  Use This Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketingEmailTemplates;

