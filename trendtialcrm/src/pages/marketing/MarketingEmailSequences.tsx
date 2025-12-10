/**
 * Marketing Email Sequences
 * 
 * Automated email drip campaigns and sequences.
 * Visual workflow builder for email automation.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  TrashIcon,
  PencilIcon,
  ChartBarIcon,
  SparklesIcon,
  CogIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import EmailSequenceCreationModal from '../../components/marketing/EmailSequenceCreationModal';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface SequenceEmail {
  id: string;
  subject: string;
  delay: string;
  openRate: number;
  clickRate: number;
}

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  emails: SequenceEmail[];
  totalSubscribers: number;
  completed: number;
  conversionRate: number;
  createdAt: string;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const emailSequences: EmailSequence[] = [
  {
    id: '1',
    name: 'Welcome Series',
    description: 'Onboard new subscribers with a warm welcome sequence',
    status: 'active',
    trigger: 'On Signup',
    emails: [
      { id: '1', subject: 'Welcome to the family! 👋', delay: 'Immediately', openRate: 68.4, clickRate: 24.2 },
      { id: '2', subject: 'Getting started guide', delay: '1 day after', openRate: 52.1, clickRate: 18.7 },
      { id: '3', subject: 'Exclusive tips for new members', delay: '3 days after', openRate: 45.8, clickRate: 15.3 },
      { id: '4', subject: 'Your 10% welcome discount', delay: '5 days after', openRate: 58.2, clickRate: 32.1 },
    ],
    totalSubscribers: 8420,
    completed: 6234,
    conversionRate: 18.5,
    createdAt: '2024-09-15',
  },
  {
    id: '2',
    name: 'Re-engagement Campaign',
    description: 'Win back inactive subscribers with targeted content',
    status: 'active',
    trigger: 'No activity for 30 days',
    emails: [
      { id: '1', subject: 'We miss you! Here\'s what you\'ve missed', delay: 'Immediately', openRate: 28.4, clickRate: 8.2 },
      { id: '2', subject: 'Special offer just for you 🎁', delay: '3 days after', openRate: 32.1, clickRate: 12.7 },
      { id: '3', subject: 'Last chance: 25% off your next purchase', delay: '7 days after', openRate: 35.8, clickRate: 18.3 },
    ],
    totalSubscribers: 3240,
    completed: 1845,
    conversionRate: 8.2,
    createdAt: '2024-10-20',
  },
  {
    id: '3',
    name: 'Product Education',
    description: 'Teach customers how to get the most from their purchase',
    status: 'paused',
    trigger: 'After Purchase',
    emails: [
      { id: '1', subject: 'Thank you for your purchase!', delay: 'Immediately', openRate: 72.4, clickRate: 28.2 },
      { id: '2', subject: 'Quick tips to get started', delay: '2 days after', openRate: 58.1, clickRate: 22.7 },
      { id: '3', subject: 'Advanced features you\'ll love', delay: '5 days after', openRate: 48.8, clickRate: 19.3 },
      { id: '4', subject: 'How our customers use our product', delay: '10 days after', openRate: 42.2, clickRate: 15.1 },
      { id: '5', subject: 'Rate your experience', delay: '14 days after', openRate: 38.8, clickRate: 12.3 },
    ],
    totalSubscribers: 5680,
    completed: 3420,
    conversionRate: 24.7,
    createdAt: '2024-08-10',
  },
  {
    id: '4',
    name: 'Cart Abandonment',
    description: 'Recover abandoned carts with timely reminders',
    status: 'active',
    trigger: 'Cart abandoned',
    emails: [
      { id: '1', subject: 'Oops! You forgot something...', delay: '1 hour after', openRate: 48.4, clickRate: 22.2 },
      { id: '2', subject: 'Your cart is waiting! ⏰', delay: '24 hours after', openRate: 42.1, clickRate: 18.7 },
      { id: '3', subject: 'Complete your order + Free shipping', delay: '3 days after', openRate: 38.8, clickRate: 24.3 },
    ],
    totalSubscribers: 2890,
    completed: 1456,
    conversionRate: 34.2,
    createdAt: '2024-11-01',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingEmailSequences: React.FC = () => {
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusBadge = (status: EmailSequence['status']) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      paused: 'bg-amber-100 text-amber-700 border-amber-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const icons = {
      active: <PlayIcon className="h-3.5 w-3.5" />,
      paused: <PauseIcon className="h-3.5 w-3.5" />,
      draft: <DocumentDuplicateIcon className="h-3.5 w-3.5" />,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    totalSequences: emailSequences.length,
    activeSequences: emailSequences.filter(s => s.status === 'active').length,
    totalSubscribers: emailSequences.reduce((acc, s) => acc + s.totalSubscribers, 0),
    avgConversionRate: emailSequences.reduce((acc, s) => acc + s.conversionRate, 0) / emailSequences.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white">
              <BoltIcon className="h-6 w-6" />
            </div>
            Email Sequences
          </h1>
          <p className="mt-1 text-gray-500">
            Automated drip campaigns that nurture your leads
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Sequence
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Sequences</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalSequences}</p>
              </div>
              <BoltIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.activeSequences}</p>
              </div>
              <PlayIcon className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Total Subscribers</p>
                <p className="text-2xl font-bold text-violet-700">{stats.totalSubscribers.toLocaleString()}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600 font-medium">Avg Conversion</p>
                <p className="text-2xl font-bold text-rose-700">{stats.avgConversionRate.toFixed(1)}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-rose-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {emailSequences.map((sequence) => (
          <Card 
            key={sequence.id} 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedSequence(sequence)}
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{sequence.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{sequence.description}</p>
                </div>
                {getStatusBadge(sequence.status)}
              </div>

              {/* Trigger */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <BoltIcon className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">Trigger: {sequence.trigger}</span>
              </div>

              {/* Email Flow Preview */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Sequence Flow ({sequence.emails.length} emails)</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {sequence.emails.slice(0, 4).map((email, index) => (
                    <React.Fragment key={email.id}>
                      <div className="flex-shrink-0 w-24 p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <EnvelopeIcon className="h-4 w-4 text-blue-500 mb-1" />
                        <p className="text-xs font-medium text-gray-700 truncate">{email.delay}</p>
                      </div>
                      {index < Math.min(sequence.emails.length - 1, 3) && (
                        <ArrowRightIcon className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                  {sequence.emails.length > 4 && (
                    <span className="text-xs text-gray-400 flex-shrink-0">+{sequence.emails.length - 4} more</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{sequence.totalSubscribers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Subscribers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{sequence.completed.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-violet-600">{sequence.conversionRate}%</p>
                  <p className="text-xs text-gray-500">Conversion</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={sequence.status === 'active' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                >
                  {sequence.status === 'active' ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sequence Detail Modal */}
      {selectedSequence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BoltIcon className="h-5 w-5 text-amber-500" />
                  {selectedSequence.name}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">{selectedSequence.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedSequence.status)}
                <Button variant="ghost" size="sm" onClick={() => setSelectedSequence(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Email Sequence Timeline */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Sequence Timeline</h4>
                <div className="relative">
                  {selectedSequence.emails.map((email, index) => (
                    <div key={email.id} className="flex gap-4 pb-6">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        {index < selectedSequence.emails.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                        )}
                      </div>
                      
                      {/* Email Card */}
                      <div className="flex-1 bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{email.subject}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <ClockIcon className="h-4 w-4" />
                              {email.delay}
                            </p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-bold text-emerald-600">{email.openRate}%</p>
                              <p className="text-xs text-gray-500">Opens</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-violet-600">{email.clickRate}%</p>
                              <p className="text-xs text-gray-500">Clicks</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedSequence(null)}>
                  Close
                </Button>
                <Button variant="outline" className="flex-1">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Sequence
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Sequence Modal - AI-Powered */}
      {showCreateModal && (
        <EmailSequenceCreationModal
          onClose={() => setShowCreateModal(false)}
          onSequenceCreated={(sequence) => {
            console.log('Sequence created:', sequence);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MarketingEmailSequences;

