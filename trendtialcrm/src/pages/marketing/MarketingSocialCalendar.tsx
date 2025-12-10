/**
 * Marketing Social Calendar
 * 
 * Visual calendar view for social media content planning.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// =============================================================================
// DEMO DATA
// =============================================================================

const scheduledPosts: Record<string, { id: string; platform: string; time: string; content: string }[]> = {
  '2024-12-11': [
    { id: '1', platform: 'facebook', time: '10:00', content: 'Product launch announcement!' },
    { id: '2', platform: 'instagram', time: '14:00', content: 'Behind the scenes photo' },
  ],
  '2024-12-12': [
    { id: '3', platform: 'linkedin', time: '09:00', content: 'Industry insights article' },
  ],
  '2024-12-15': [
    { id: '4', platform: 'twitter', time: '11:00', content: 'Quick tip Tuesday' },
    { id: '5', platform: 'facebook', time: '15:00', content: 'Customer testimonial' },
    { id: '6', platform: 'instagram', time: '18:00', content: 'Product showcase' },
  ],
  '2024-12-18': [
    { id: '7', platform: 'linkedin', time: '10:00', content: 'Team spotlight' },
  ],
  '2024-12-20': [
    { id: '8', platform: 'twitter', time: '09:00', content: 'Weekend special offer' },
    { id: '9', platform: 'instagram', time: '12:00', content: 'User-generated content' },
  ],
  '2024-12-25': [
    { id: '10', platform: 'facebook', time: '08:00', content: 'Holiday greetings!' },
    { id: '11', platform: 'instagram', time: '10:00', content: 'Holiday photo' },
    { id: '12', platform: 'twitter', time: '10:00', content: 'Merry Christmas!' },
  ],
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingSocialCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1)); // December 2024
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'bg-blue-500',
      twitter: 'bg-sky-400',
      linkedin: 'bg-blue-700',
      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
      tiktok: 'bg-black',
    };
    return colors[platform] || 'bg-gray-500';
  };

  const getPlatformEmoji = (platform: string) => {
    const emojis: Record<string, string> = {
      facebook: '📘',
      twitter: '🐦',
      linkedin: '💼',
      instagram: '📸',
      tiktok: '🎵',
    };
    return emojis[platform] || '📱';
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDatePosts = selectedDate ? scheduledPosts[selectedDate] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl text-white">
              <CalendarIcon className="h-6 w-6" />
            </div>
            Content Calendar
          </h1>
          <p className="mt-1 text-gray-500">
            Plan and visualize your social media content
          </p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{months[month]} {year}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Week Days Header */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded-lg" />;
                  }

                  const dateString = getDateString(day);
                  const posts = scheduledPosts[dateString] || [];
                  const isToday = dateString === new Date().toISOString().split('T')[0];
                  const isSelected = dateString === selectedDate;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(dateString)}
                      className={`h-24 p-2 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : isToday
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-transparent hover:border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-cyan-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {posts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={`text-xs px-1.5 py-0.5 rounded text-white truncate ${getPlatformColor(post.platform)}`}
                          >
                            {getPlatformEmoji(post.platform)} {post.time}
                          </div>
                        ))}
                        {posts.length > 3 && (
                          <div className="text-xs text-gray-400">+{posts.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Detail Panel */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="border-b">
              <CardTitle className="text-base">
                {selectedDate 
                  ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a date'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedDate ? (
                selectedDatePosts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDatePosts.map((post) => (
                      <div key={post.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getPlatformEmoji(post.platform)}</span>
                            <span className="text-sm font-medium capitalize">{post.platform}</span>
                          </div>
                          <span className="text-sm text-gray-500">{post.time}</span>
                        </div>
                        <p className="text-sm text-gray-700">{post.content}</p>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full" variant="outline">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Post for This Day
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No posts scheduled</p>
                    <p className="text-sm text-gray-400 mt-1">Click below to add content</p>
                    <Button className="mt-4" variant="outline">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Post
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a date to view or add posts</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Platforms</p>
              <div className="space-y-2">
                {['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok'].map((platform) => (
                  <div key={platform} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${getPlatformColor(platform)}`} />
                    <span className="text-sm capitalize">{platform}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingSocialCalendar;

