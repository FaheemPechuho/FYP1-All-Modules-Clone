/**
 * Marketing Social Media Scheduler
 * 
 * Schedule and manage social media posts across platforms.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  CalendarDaysIcon,
  PlusIcon,
  ClockIcon,
  PhotoIcon,
  VideoCameraIcon,
  LinkIcon,
  SparklesIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';

// Platform icons (simplified)
const FacebookIcon = () => <span className="text-blue-600 text-lg">📘</span>;
const TwitterIcon = () => <span className="text-blue-400 text-lg">🐦</span>;
const LinkedInIcon = () => <span className="text-blue-700 text-lg">💼</span>;
const InstagramIcon = () => <span className="text-pink-500 text-lg">📸</span>;
const TikTokIcon = () => <span className="text-black text-lg">🎵</span>;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type Platform = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok';
type PostStatus = 'scheduled' | 'published' | 'draft' | 'failed';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: Platform[];
  scheduledAt: string;
  status: PostStatus;
  mediaType?: 'image' | 'video' | 'link';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

// =============================================================================
// DEMO DATA
// =============================================================================

const scheduledPosts: ScheduledPost[] = [
  {
    id: '1',
    content: '🚀 Exciting news! We just launched our new feature that helps you automate your marketing workflows. Check it out! #MarketingAutomation #ProductLaunch',
    platforms: ['facebook', 'twitter', 'linkedin'],
    scheduledAt: '2024-12-11T10:00:00Z',
    status: 'scheduled',
    mediaType: 'image',
  },
  {
    id: '2',
    content: 'Behind the scenes at our office! 📸 Our team is working hard to bring you the best marketing tools. #TeamWork #StartupLife',
    platforms: ['instagram', 'facebook'],
    scheduledAt: '2024-12-11T14:00:00Z',
    status: 'scheduled',
    mediaType: 'image',
  },
  {
    id: '3',
    content: '5 Marketing Trends You Can\'t Ignore in 2025 📈 Our latest blog post breaks down what\'s coming next year. Link in bio!',
    platforms: ['twitter', 'linkedin'],
    scheduledAt: '2024-12-12T09:00:00Z',
    status: 'scheduled',
    mediaType: 'link',
  },
  {
    id: '4',
    content: 'Customer spotlight! 🌟 See how @AcmeCorp increased their conversion rate by 45% using our platform.',
    platforms: ['facebook', 'linkedin', 'twitter'],
    scheduledAt: '2024-12-10T15:00:00Z',
    status: 'published',
    engagement: { likes: 234, comments: 45, shares: 67 },
  },
  {
    id: '5',
    content: 'Quick tip Tuesday! 💡 Use A/B testing for your email subject lines to boost open rates by up to 30%.',
    platforms: ['twitter', 'linkedin'],
    scheduledAt: '2024-12-10T11:00:00Z',
    status: 'published',
    engagement: { likes: 189, comments: 23, shares: 45 },
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingSocialScheduler: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [filterStatus, setFilterStatus] = useState<PostStatus | 'all'>('all');

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'facebook': return <FacebookIcon />;
      case 'twitter': return <TwitterIcon />;
      case 'linkedin': return <LinkedInIcon />;
      case 'instagram': return <InstagramIcon />;
      case 'tiktok': return <TikTokIcon />;
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const filteredPosts = scheduledPosts.filter(post =>
    filterStatus === 'all' || post.status === filterStatus
  );

  const stats = {
    scheduled: scheduledPosts.filter(p => p.status === 'scheduled').length,
    published: scheduledPosts.filter(p => p.status === 'published').length,
    totalEngagement: scheduledPosts.reduce((acc, p) => 
      acc + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0), 0
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl text-white">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            Social Media Scheduler
          </h1>
          <p className="mt-1 text-gray-500">
            Schedule and manage your social media posts
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Scheduled</p>
                <p className="text-2xl font-bold text-blue-700">{stats.scheduled}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Published</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.published}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Total Engagement</p>
                <p className="text-2xl font-bold text-violet-700">{stats.totalEngagement.toLocaleString()}</p>
              </div>
              <HeartIcon className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Platforms</p>
                <p className="text-2xl font-bold text-amber-700">5</p>
              </div>
              <div className="flex -space-x-1">
                <FacebookIcon />
                <TwitterIcon />
                <LinkedInIcon />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'scheduled', 'published', 'draft'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Posts' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  {post.platforms.map((platform) => (
                    <span key={platform}>{getPlatformIcon(platform)}</span>
                  ))}
                </div>
                {getStatusBadge(post.status)}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>

              {/* Media Type Badge */}
              {post.mediaType && (
                <div className="flex items-center gap-2 mb-4">
                  {post.mediaType === 'image' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                      <PhotoIcon className="h-3.5 w-3.5" /> Image
                    </span>
                  )}
                  {post.mediaType === 'video' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs">
                      <VideoCameraIcon className="h-3.5 w-3.5" /> Video
                    </span>
                  )}
                  {post.mediaType === 'link' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs">
                      <LinkIcon className="h-3.5 w-3.5" /> Link
                    </span>
                  )}
                </div>
              )}

              {/* Schedule Time */}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <ClockIcon className="h-4 w-4" />
                {new Date(post.scheduledAt).toLocaleString()}
              </div>

              {/* Engagement Stats (for published posts) */}
              {post.engagement && (
                <div className="flex gap-4 py-3 border-t border-b mb-4">
                  <div className="flex items-center gap-1 text-sm">
                    <HeartIcon className="h-4 w-4 text-red-400" />
                    <span className="font-medium">{post.engagement.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <ChatBubbleLeftIcon className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{post.engagement.comments}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowPathRoundedSquareIcon className="h-4 w-4 text-green-400" />
                    <span className="font-medium">{post.engagement.shares}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-pink-500" />
                Create Social Post
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Platforms</label>
                <div className="flex gap-3 flex-wrap">
                  {(['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok'] as Platform[]).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedPlatforms.includes(platform)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {getPlatformIcon(platform)}
                      <span className="text-sm font-medium capitalize">{platform}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
                <textarea
                  rows={4}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">0/280 characters (Twitter limit)</p>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Media</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <PhotoIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Drop images or videos here, or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, MP4 up to 10MB</p>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <input
                    type="time"
                    className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="outline" className="flex-1">
                  Save as Draft
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Schedule Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketingSocialScheduler;

