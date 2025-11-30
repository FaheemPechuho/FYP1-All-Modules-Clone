// src/components/marketing/Campaigns.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Campaign {
  id: string;
  name: string;
  source: string;
  leadsCount: number;
  conversionRate: number;
  costPerLead: number;
}

const Campaigns: React.FC = () => {
  // Dummy data - replace with actual data fetching
  const [campaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer Sale 2024',
      source: 'Facebook Ads',
      leadsCount: 245,
      conversionRate: 12.5,
      costPerLead: 15.50
    },
    {
      id: '2',
      name: 'Product Launch Campaign',
      source: 'Google Ads',
      leadsCount: 189,
      conversionRate: 8.3,
      costPerLead: 22.75
    },
    {
      id: '3',
      name: 'Email Newsletter',
      source: 'Email Marketing',
      leadsCount: 156,
      conversionRate: 15.2,
      costPerLead: 5.20
    },
    {
      id: '4',
      name: 'LinkedIn Outreach',
      source: 'LinkedIn',
      leadsCount: 98,
      conversionRate: 18.7,
      costPerLead: 12.30
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header with New Campaign Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage your marketing campaigns
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Campaign Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Leads Count
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Conversion Rate
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Cost per Lead
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">{campaign.source}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{campaign.leadsCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">{campaign.conversionRate}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">
                        ${campaign.costPerLead.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No campaigns found. Create your first campaign to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campaigns;

