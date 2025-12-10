/**
 * Marketing A/B Testing
 * 
 * Create and manage A/B tests for marketing campaigns.
 * 
 * @author Sheryar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  BeakerIcon,
  PlusIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import ABTestCreationModal from '../../components/marketing/ABTestCreationModal';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type TestStatus = 'running' | 'completed' | 'draft' | 'paused';
type TestType = 'email_subject' | 'email_content' | 'landing_page' | 'ad_creative' | 'cta';

interface ABTest {
  id: string;
  name: string;
  type: TestType;
  status: TestStatus;
  variantA: {
    name: string;
    content: string;
    impressions: number;
    conversions: number;
  };
  variantB: {
    name: string;
    content: string;
    impressions: number;
    conversions: number;
  };
  winner?: 'A' | 'B' | null;
  confidence: number;
  startDate: string;
  endDate?: string;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const abTests: ABTest[] = [
  {
    id: '1',
    name: 'Holiday Email Subject Test',
    type: 'email_subject',
    status: 'completed',
    variantA: { name: 'Control', content: 'Holiday Sale - 30% Off', impressions: 5000, conversions: 340 },
    variantB: { name: 'Variant B', content: '🎄 Your Exclusive Holiday Gift Awaits!', impressions: 5000, conversions: 425 },
    winner: 'B',
    confidence: 95.4,
    startDate: '2024-12-01',
    endDate: '2024-12-07',
  },
  {
    id: '2',
    name: 'Landing Page CTA Button',
    type: 'cta',
    status: 'running',
    variantA: { name: 'Blue Button', content: 'Get Started Free', impressions: 3200, conversions: 156 },
    variantB: { name: 'Green Button', content: 'Start Your Free Trial', impressions: 3200, conversions: 189 },
    winner: null,
    confidence: 78.2,
    startDate: '2024-12-08',
  },
  {
    id: '3',
    name: 'Facebook Ad Image Test',
    type: 'ad_creative',
    status: 'running',
    variantA: { name: 'Product Image', content: 'Product-focused image', impressions: 8500, conversions: 234 },
    variantB: { name: 'Lifestyle Image', content: 'Lifestyle scene with product', impressions: 8500, conversions: 312 },
    winner: null,
    confidence: 89.1,
    startDate: '2024-12-05',
  },
  {
    id: '4',
    name: 'Email Welcome Sequence',
    type: 'email_content',
    status: 'completed',
    variantA: { name: 'Short Form', content: 'Brief 3-email sequence', impressions: 2400, conversions: 456 },
    variantB: { name: 'Long Form', content: 'Detailed 5-email sequence', impressions: 2400, conversions: 512 },
    winner: 'B',
    confidence: 92.3,
    startDate: '2024-11-15',
    endDate: '2024-11-30',
  },
];

const testTypes = [
  { id: 'email_subject', name: 'Email Subject Line', icon: EnvelopeIcon },
  { id: 'email_content', name: 'Email Content', icon: DocumentDuplicateIcon },
  { id: 'cta', name: 'Call to Action', icon: CursorArrowRaysIcon },
  { id: 'ad_creative', name: 'Ad Creative', icon: ChartBarIcon },
  { id: 'landing_page', name: 'Landing Page', icon: DocumentDuplicateIcon },
];

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingABTesting: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TestStatus | 'all'>('all');

  const filteredTests = abTests.filter(test => 
    filterStatus === 'all' || test.status === filterStatus
  );

  const getStatusBadge = (status: TestStatus) => {
    const styles = {
      running: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      paused: 'bg-amber-100 text-amber-700 border-amber-200',
    };

    const icons = {
      running: <PlayIcon className="h-3.5 w-3.5" />,
      completed: <CheckCircleIcon className="h-3.5 w-3.5" />,
      draft: <DocumentDuplicateIcon className="h-3.5 w-3.5" />,
      paused: <PauseIcon className="h-3.5 w-3.5" />,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getConversionRate = (impressions: number, conversions: number) => {
    return impressions > 0 ? ((conversions / impressions) * 100).toFixed(2) : '0.00';
  };

  const stats = {
    total: abTests.length,
    running: abTests.filter(t => t.status === 'running').length,
    completed: abTests.filter(t => t.status === 'completed').length,
    avgLift: 18.5, // Demo value
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white">
              <BeakerIcon className="h-6 w-6" />
            </div>
            A/B Testing
          </h1>
          <p className="mt-1 text-gray-500">
            Create experiments and optimize your marketing performance
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Tests</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <BeakerIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Running</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.running}</p>
              </div>
              <PlayIcon className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-violet-700">{stats.completed}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Avg Lift</p>
                <p className="text-2xl font-bold text-amber-700">+{stats.avgLift}%</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'running', 'completed', 'draft', 'paused'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Tests' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                    {getStatusBadge(test.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    Started: {new Date(test.startDate).toLocaleDateString()}
                    {test.endDate && ` • Ended: ${new Date(test.endDate).toLocaleDateString()}`}
                  </p>
                </div>
                {test.winner && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                    <TrophyIcon className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-amber-700">Winner: Variant {test.winner}</span>
                  </div>
                )}
              </div>

              {/* Variants Comparison */}
              <div className="grid grid-cols-2 gap-6">
                {/* Variant A */}
                <div className={`p-4 rounded-xl border-2 ${test.winner === 'A' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">A</span>
                      <span className="font-medium">{test.variantA.name}</span>
                    </div>
                    {test.winner === 'A' && <TrophyIcon className="h-5 w-5 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">&ldquo;{test.variantA.content}&rdquo;</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{test.variantA.impressions.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Impressions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{test.variantA.conversions}</p>
                      <p className="text-xs text-gray-500">Conversions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{getConversionRate(test.variantA.impressions, test.variantA.conversions)}%</p>
                      <p className="text-xs text-gray-500">Conv. Rate</p>
                    </div>
                  </div>
                </div>

                {/* Variant B */}
                <div className={`p-4 rounded-xl border-2 ${test.winner === 'B' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm">B</span>
                      <span className="font-medium">{test.variantB.name}</span>
                    </div>
                    {test.winner === 'B' && <TrophyIcon className="h-5 w-5 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">&ldquo;{test.variantB.content}&rdquo;</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{test.variantB.impressions.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Impressions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{test.variantB.conversions}</p>
                      <p className="text-xs text-gray-500">Conversions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-violet-600">{getConversionRate(test.variantB.impressions, test.variantB.conversions)}%</p>
                      <p className="text-xs text-gray-500">Conv. Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Meter */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Statistical Confidence</span>
                  <span className={`text-sm font-bold ${test.confidence >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {test.confidence}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      test.confidence >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${test.confidence}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {test.confidence >= 95 
                    ? '✓ Statistically significant - safe to implement winner'
                    : '⏳ Needs more data for statistical significance (target: 95%)'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                {test.status === 'running' && (
                  <Button variant="outline" size="sm" className="text-amber-600">
                    <PauseIcon className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                {test.winner && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Apply Winner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Test Modal - AI-Powered */}
      {showCreateModal && (
        <ABTestCreationModal
          onClose={() => setShowCreateModal(false)}
          onTestCreated={(test) => {
            console.log('A/B Test created:', test);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MarketingABTesting;

