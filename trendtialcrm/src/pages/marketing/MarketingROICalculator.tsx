/**
 * Marketing ROI Calculator
 * 
 * Interactive ROI calculator and budget planning tool.
 * 
 * @author Sheryar
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// COMPONENT
// =============================================================================

const MarketingROICalculator: React.FC = () => {
  // Input states
  const [marketingSpend, setMarketingSpend] = useState(10000);
  const [totalLeads, setTotalLeads] = useState(500);
  const [conversionRate, setConversionRate] = useState(5);
  const [avgDealValue, setAvgDealValue] = useState(2500);
  const [salesCycleLength, setSalesCycleLength] = useState(30);
  const [customerLifetimeValue, setCustomerLifetimeValue] = useState(15000);

  // Calculated metrics
  const metrics = useMemo(() => {
    const customers = Math.round(totalLeads * (conversionRate / 100));
    const revenue = customers * avgDealValue;
    const ltv = customers * customerLifetimeValue;
    const roi = marketingSpend > 0 ? ((revenue - marketingSpend) / marketingSpend) * 100 : 0;
    const ltvRoi = marketingSpend > 0 ? ((ltv - marketingSpend) / marketingSpend) * 100 : 0;
    const costPerLead = totalLeads > 0 ? marketingSpend / totalLeads : 0;
    const costPerCustomer = customers > 0 ? marketingSpend / customers : 0;
    const revenuePerLead = totalLeads > 0 ? revenue / totalLeads : 0;

    return {
      customers,
      revenue,
      ltv,
      roi,
      ltvRoi,
      costPerLead,
      costPerCustomer,
      revenuePerLead,
    };
  }, [marketingSpend, totalLeads, conversionRate, avgDealValue, customerLifetimeValue]);

  const getRoiColor = (roi: number) => {
    if (roi >= 300) return 'text-emerald-600';
    if (roi >= 100) return 'text-blue-600';
    if (roi >= 0) return 'text-amber-600';
    return 'text-red-600';
  };

  const recommendations = useMemo(() => {
    const recs = [];
    
    if (metrics.roi < 100) {
      recs.push({
        type: 'warning',
        title: 'Low ROI Alert',
        desc: 'Your ROI is below 100%. Consider optimizing your targeting or reducing spend on underperforming channels.',
      });
    }
    
    if (metrics.costPerLead > 50) {
      recs.push({
        type: 'info',
        title: 'High Cost Per Lead',
        desc: 'Your CPL is above $50. Try content marketing or referral programs for lower acquisition costs.',
      });
    }
    
    if (conversionRate < 3) {
      recs.push({
        type: 'info',
        title: 'Conversion Opportunity',
        desc: 'Your conversion rate is below industry average (3-5%). Focus on lead nurturing and qualification.',
      });
    }
    
    if (metrics.roi >= 200) {
      recs.push({
        type: 'success',
        title: 'Strong Performance',
        desc: 'Your marketing ROI is excellent! Consider scaling up your budget to maximize growth.',
      });
    }

    return recs;
  }, [metrics, conversionRate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
              <CalculatorIcon className="h-6 w-6" />
            </div>
            ROI Calculator
          </h1>
          <p className="mt-1 text-gray-500">
            Calculate your marketing ROI and optimize budget allocation
          </p>
        </div>
        <Button variant="outline">
          <SparklesIcon className="h-4 w-4 mr-2" />
          AI Budget Optimizer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Input Your Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marketing Spend ($)
              </label>
              <input
                type="number"
                value={marketingSpend}
                onChange={(e) => setMarketingSpend(Number(e.target.value))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={marketingSpend}
                onChange={(e) => setMarketingSpend(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Leads Generated
              </label>
              <input
                type="number"
                value={totalLeads}
                onChange={(e) => setTotalLeads(Number(e.target.value))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="range"
                min="10"
                max="5000"
                step="10"
                value={totalLeads}
                onChange={(e) => setTotalLeads(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conversion Rate (%)
              </label>
              <input
                type="number"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Deal Value ($)
              </label>
              <input
                type="number"
                value={avgDealValue}
                onChange={(e) => setAvgDealValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={avgDealValue}
                onChange={(e) => setAvgDealValue(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Lifetime Value ($)
              </label>
              <input
                type="number"
                value={customerLifetimeValue}
                onChange={(e) => setCustomerLifetimeValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={customerLifetimeValue}
                onChange={(e) => setCustomerLifetimeValue(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <CardContent className="pt-4">
                <p className="text-sm text-green-600 font-medium">Marketing ROI</p>
                <p className={`text-3xl font-bold ${getRoiColor(metrics.roi)}`}>
                  {metrics.roi.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-600 font-medium">LTV ROI</p>
                <p className="text-3xl font-bold text-blue-700">{metrics.ltvRoi.toFixed(1)}%</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
              <CardContent className="pt-4">
                <p className="text-sm text-violet-600 font-medium">Revenue</p>
                <p className="text-3xl font-bold text-violet-700">${metrics.revenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-600 font-medium">Customers</p>
                <p className="text-3xl font-bold text-amber-700">{metrics.customers}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Cost Per Lead</p>
                  <p className="text-2xl font-bold text-gray-900">${metrics.costPerLead.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Cost Per Customer</p>
                  <p className="text-2xl font-bold text-gray-900">${metrics.costPerCustomer.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Revenue Per Lead</p>
                  <p className="text-2xl font-bold text-gray-900">${metrics.revenuePerLead.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Total LTV</p>
                  <p className="text-2xl font-bold text-gray-900">${metrics.ltv.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Profit (Short-term)</p>
                  <p className={`text-2xl font-bold ${metrics.revenue - marketingSpend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${(metrics.revenue - marketingSpend).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Profit (LTV-based)</p>
                  <p className="text-2xl font-bold text-emerald-600">${(metrics.ltv - marketingSpend).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <CardHeader className="border-b border-indigo-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <SparklesIcon className="h-5 w-5 text-indigo-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {recommendations.length > 0 ? recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl border ${
                    rec.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    rec.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rec.type === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <InformationCircleIcon className={`h-5 w-5 flex-shrink-0 ${
                        rec.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                      }`} />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.desc}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">Enter your metrics to get AI recommendations</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingROICalculator;

