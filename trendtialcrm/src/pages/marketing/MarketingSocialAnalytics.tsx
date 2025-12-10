/**
 * Marketing Social Analytics
 * 
 * Comprehensive social media performance analytics.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  ShareIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// DEMO DATA
// =============================================================================

const platformStats = [
  { platform: 'Facebook', icon: '📘', followers: 45230, growth: 5.2, engagement: 4.8, posts: 24, reach: 125000, color: 'blue' },
  { platform: 'Instagram', icon: '📸', followers: 32100, growth: 12.5, engagement: 7.2, posts: 36, reach: 89000, color: 'pink' },
  { platform: 'LinkedIn', icon: '💼', followers: 18450, growth: 8.1, engagement: 3.5, posts: 12, reach: 45000, color: 'indigo' },
  { platform: 'Twitter', icon: '🐦', followers: 28900, growth: -2.3, engagement: 2.8, posts: 45, reach: 67000, color: 'sky' },
  { platform: 'TikTok', icon: '🎵', followers: 15600, growth: 24.8, engagement: 12.4, posts: 18, reach: 234000, color: 'gray' },
];

const topPosts = [
  { id: '1', platform: 'Instagram', content: 'Behind the scenes at our office! 📸', likes: 2340, comments: 156, shares: 89, reach: 45600 },
  { id: '2', platform: 'TikTok', content: 'Quick tutorial: 5 marketing hacks 🎬', likes: 5670, comments: 234, shares: 456, reach: 89000 },
  { id: '3', platform: 'LinkedIn', content: 'Industry trends 2025 report 📊', likes: 1890, comments: 78, shares: 234, reach: 34500 },
  { id: '4', platform: 'Facebook', content: 'Customer success story 🌟', likes: 1234, comments: 89, shares: 123, reach: 28900 },
];

const audienceData = {
  ageGroups: [
    { range: '18-24', percentage: 22 },
    { range: '25-34', percentage: 38 },
    { range: '35-44', percentage: 24 },
    { range: '45-54', percentage: 12 },
    { range: '55+', percentage: 4 },
  ],
  genders: [
    { gender: 'Male', percentage: 54 },
    { gender: 'Female', percentage: 44 },
    { gender: 'Other', percentage: 2 },
  ],
  topLocations: [
    { location: 'United States', percentage: 45 },
    { location: 'United Kingdom', percentage: 18 },
    { location: 'Canada', percentage: 12 },
    { location: 'Australia', percentage: 8 },
    { location: 'Germany', percentage: 6 },
  ],
};

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingSocialAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const totalFollowers = platformStats.reduce((acc, p) => acc + p.followers, 0);
  const avgEngagement = platformStats.reduce((acc, p) => acc + p.engagement, 0) / platformStats.length;
  const totalReach = platformStats.reduce((acc, p) => acc + p.reach, 0);
  const totalPosts = platformStats.reduce((acc, p) => acc + p.posts, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            Social Analytics
          </h1>
          <p className="mt-1 text-gray-500">
            Track your social media performance across platforms
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Followers</p>
                <p className="text-2xl font-bold text-blue-700">{totalFollowers.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +8.2%
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600 font-medium">Avg Engagement</p>
                <p className="text-2xl font-bold text-rose-700">{avgEngagement.toFixed(1)}%</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +1.4%
                </p>
              </div>
              <HeartIcon className="h-8 w-8 text-rose-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Total Reach</p>
                <p className="text-2xl font-bold text-violet-700">{(totalReach / 1000).toFixed(0)}K</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +15.3%
                </p>
              </div>
              <EyeIcon className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Posts Published</p>
                <p className="text-2xl font-bold text-amber-700">{totalPosts}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <ShareIcon className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Platform</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Followers</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Growth</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Engagement</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Posts</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Reach</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {platformStats.map((platform) => (
                  <tr key={platform.platform} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <span className="font-medium">{platform.platform}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">{platform.followers.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`flex items-center gap-1 font-medium ${platform.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {platform.growth >= 0 ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
                        {platform.growth >= 0 ? '+' : ''}{platform.growth}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px] bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-${platform.color}-500 rounded-full h-2`}
                            style={{ width: `${Math.min(platform.engagement * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{platform.engagement}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{platform.posts}</td>
                    <td className="py-4 px-4">{(platform.reach / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {topPosts.map((post, index) => (
              <div key={post.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-500">{post.platform}</span>
                  </div>
                  <span className="text-xs text-gray-400">{(post.reach / 1000).toFixed(0)}K reach</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <HeartIcon className="h-3.5 w-3.5 text-red-400" />
                    {post.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatBubbleLeftIcon className="h-3.5 w-3.5 text-blue-400" />
                    {post.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShareIcon className="h-3.5 w-3.5 text-green-400" />
                    {post.shares}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audience Demographics */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Audience Demographics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {/* Age Distribution */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Age Distribution</h4>
              <div className="space-y-2">
                {audienceData.ageGroups.map((group) => (
                  <div key={group.range} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-16">{group.range}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-3 transition-all"
                        style={{ width: `${group.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-10">{group.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Gender</h4>
              <div className="flex gap-4">
                {audienceData.genders.map((item) => (
                  <div key={item.gender} className="flex-1 p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{item.percentage}%</p>
                    <p className="text-sm text-gray-500">{item.gender}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Locations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Locations</h4>
              <div className="space-y-2">
                {audienceData.topLocations.map((loc) => (
                  <div key={loc.location} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-700">{loc.location}</span>
                    <span className="text-sm font-medium text-gray-900">{loc.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingSocialAnalytics;

