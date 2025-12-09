// src/pages/support/SupportDashboard.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSupportStatsQuery, useTicketsQuery } from '../../hooks/queries/useSupportQuery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  TicketIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  MicrophoneIcon,
  GlobeAltIcon,
  BoltIcon,
  FaceSmileIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { 
  StarIcon,
  FireIcon,
} from '@heroicons/react/24/solid';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white',
    indigo: 'bg-indigo-500 text-white',
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
                <span>{trend.value}% vs last week</span>
              </div>
            )}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`flex-shrink-0 h-14 w-14 rounded-xl ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Channel Card Component - Now clickable with onClick
interface ChannelCardProps {
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  isActive?: boolean;
  onClick?: () => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ name, icon, count, color, isActive = true, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center p-4 rounded-xl border-2 ${isActive ? 'border-transparent bg-gradient-to-br from-white to-gray-50 hover:shadow-lg hover:border-primary/20' : 'border-dashed border-gray-300 bg-gray-50'} transition-all duration-200 cursor-pointer group`}
  >
    <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="text-sm text-muted-foreground">{count} tickets</p>
    </div>
    {isActive && (
      <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
    )}
  </div>
);

const SupportDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useSupportStatsQuery();
  const { data: allTickets } = useTicketsQuery({}, { field: 'created_at', direction: 'desc' });

  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('month');
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [newTicketDropdownOpen, setNewTicketDropdownOpen] = useState(false);

  // Filter tickets based on selected timeframe
  const filteredTickets = useMemo(() => {
    if (!allTickets) return [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return allTickets.filter((ticket: any) => {
      const ticketDate = new Date(ticket.created_at);
      switch (selectedTimeframe) {
        case 'today':
          return ticketDate >= startOfToday;
        case 'week':
          return ticketDate >= startOfWeek;
        case 'month':
          return ticketDate >= startOfMonth;
        default:
          return true;
      }
    });
  }, [allTickets, selectedTimeframe]);

  // Get tickets by channel
  const getTicketsByChannel = (channel: string) => {
    return allTickets?.filter((t: any) => t.channel === channel) || [];
  };

  // Channel stats from filtered tickets
  const channelStats = useMemo(() => {
    const stats: Record<string, number> = { email: 0, chat: 0, phone: 0, voice: 0 };
    filteredTickets.forEach((t: any) => {
      if (stats[t.channel] !== undefined) {
        stats[t.channel]++;
      }
    });
    return stats;
  }, [filteredTickets]);

  // Handle channel card click
  const handleChannelClick = (channel: string) => {
    setSelectedChannel(channel);
    setChannelDialogOpen(true);
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Priority tickets from filtered data (high priority with AI info)
  const priorityTickets = filteredTickets.filter((t: any) => 
    t.priority === 'critical' || t.priority === 'urgent' || t.priority === 'high'
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TicketIcon className="h-6 w-6 text-white" />
            </div>
            Support Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your support center.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Button 
              onClick={() => setNewTicketDropdownOpen(!newTicketDropdownOpen)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Ticket
            </Button>
            {newTicketDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Create via</p>
                <Link 
                  to="/support/email" 
                  onClick={() => setNewTicketDropdownOpen(false)}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email Ingest</p>
                    <p className="text-xs text-muted-foreground">Process incoming emails</p>
                  </div>
                </Link>
                <Link 
                  to="/support/chat" 
                  onClick={() => setNewTicketDropdownOpen(false)}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Quick Ticket</p>
                    <p className="text-xs text-muted-foreground">Create ticket manually</p>
                  </div>
                </Link>
                <Link 
                  to="/support/agent-queue" 
                  onClick={() => setNewTicketDropdownOpen(false)}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <UserGroupIcon className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">Agent Queue</p>
                    <p className="text-xs text-muted-foreground">Handle escalated tickets</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets"
          value={stats?.total_tickets || 0}
          icon={<TicketIcon className="h-7 w-7" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Open Tickets"
          value={stats?.open_tickets || 0}
          icon={<ClockIcon className="h-7 w-7" />}
          subtitle={`${stats?.in_progress_tickets || 0} in progress`}
          color="yellow"
        />
        <StatCard
          title="Resolved Today"
          value={stats?.resolved_today || 0}
          icon={<CheckCircleIcon className="h-7 w-7" />}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <StatCard
          title="SLA Compliance"
          value={`${stats?.sla_compliance_rate || 0}%`}
          icon={<ChartBarIcon className="h-7 w-7" />}
          trend={{ value: 2.5, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Avg Response Time</p>
                <p className="text-4xl font-bold mt-2">{stats?.avg_response_time_minutes || 0} min</p>
                <p className="text-indigo-200 text-sm mt-2">Industry avg: 24 min</p>
              </div>
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <BoltIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Customer Satisfaction</p>
                <div className="flex items-center mt-2">
                  <p className="text-4xl font-bold">{stats?.customer_satisfaction_score || 0}</p>
                  <div className="flex ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.floor(stats?.customer_satisfaction_score || 0)
                            ? 'text-yellow-300'
                            : 'text-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-green-200 text-sm mt-2">Based on {stats?.total_tickets || 0} reviews</p>
              </div>
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <FaceSmileIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">AI Accuracy Rate</p>
                <p className="text-4xl font-bold mt-2">{stats?.ai_accuracy_rate || 0}%</p>
                <p className="text-amber-200 text-sm mt-2">{stats?.ai_auto_classified || 0} auto-classified</p>
              </div>
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <SparklesIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Tickets - full width */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FireIcon className="h-5 w-5 text-red-500" />
                Priority Tickets
              </CardTitle>
              <CardDescription>Urgent issues requiring immediate attention</CardDescription>
            </div>
            <Link to="/support/tickets?priority=urgent,critical">
              <Button variant="ghost" size="sm">
                View All <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {priorityTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No urgent tickets at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {priorityTickets.slice(0, 4).map((ticket: any) => (
                <Link
                  key={ticket.id}
                  to={`/support/tickets/${ticket.id}`}
                  className="flex items-center p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 ${
                    ticket.priority === 'critical' ? 'bg-red-500' : 
                    ticket.priority === 'urgent' ? 'bg-orange-500' : 'bg-yellow-500'
                  } text-white shadow-sm`}>
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{ticket.subject}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="truncate max-w-[240px]">{ticket.customer_email || ticket.customer_name}</span>
                      {ticket.ai_category && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          <SparklesIcon className="h-3 w-3" />
                          {ticket.ai_category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ticket.priority === 'critical' ? 'bg-red-500 text-white' :
                      ticket.priority === 'urgent' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {ticket.priority?.toUpperCase()}
                    </span>
                    {ticket.ai_confidence && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${
                          ticket.ai_confidence > 0.8 ? 'bg-green-500' : 
                          ticket.ai_confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        {Math.round(ticket.ai_confidence * 100)}% conf
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used support actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link to="/support/chat" className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors group">
              <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">New Ticket</span>
            </Link>
            
            <Link to="/support/knowledge-base" className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors group">
              <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">Knowledge Base</span>
            </Link>
            
            <Link to="/support/chat" className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors group">
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">Quick Create</span>
            </Link>
            
            <Link to="/support/agent-queue" className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition-colors group">
              <div className="h-12 w-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">Agent Queue</span>
            </Link>
            
            <Link to="/support/email" className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-colors group">
              <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <EnvelopeIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">Email Ingest</span>
            </Link>
            
            <Link to="/support/tickets" className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 transition-colors group">
              <div className="h-12 w-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">All Tickets</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest support tickets across all channels</CardDescription>
            </div>
            <Link to="/support/tickets">
              <Button variant="outline" size="sm">
                View All Tickets <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ticket</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Channel</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">AI Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.slice(0, 5).map((ticket: any) => (
                  <tr key={ticket.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <Link to={`/support/tickets/${ticket.id}`} className="hover:text-primary">
                        <p className="font-medium">{ticket.ticket_number}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{ticket.subject}</p>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium">{ticket.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{ticket.customer_email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'escalated' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize">{ticket.channel}</span>
                    </td>
                    <td className="py-4 px-4">
                      {ticket.ai_confidence && (
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                ticket.ai_confidence > 0.9 ? 'bg-green-500' :
                                ticket.ai_confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${ticket.ai_confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{Math.round(ticket.ai_confidence * 100)}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Channel Tickets Dialog */}
      <Transition appear show={channelDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setChannelDialogOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                    {selectedChannel === 'email' && <EnvelopeIcon className="h-6 w-6 text-blue-500" />}
                    {selectedChannel === 'chat' && <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500" />}
                    {selectedChannel === 'phone' && <PhoneIcon className="h-6 w-6 text-purple-500" />}
                    {selectedChannel === 'web_form' && <GlobeAltIcon className="h-6 w-6 text-pink-500" />}
                    {selectedChannel?.charAt(0).toUpperCase()}{selectedChannel?.slice(1).replace('_', ' ')} Tickets
                  </Dialog.Title>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {getTicketsByChannel(selectedChannel || '').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TicketIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>No tickets from this channel</p>
                      </div>
                    ) : (
                      getTicketsByChannel(selectedChannel || '').slice(0, 10).map((ticket: any) => (
                        <Link
                          key={ticket.id}
                          to={`/support/tickets/${ticket.id}`}
                          onClick={() => setChannelDialogOpen(false)}
                          className="flex items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{ticket.customer_email}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.status}
                              </span>
                              {ticket.ai_confidence && (
                                <span className="flex items-center gap-1">
                                  <SparklesIcon className="h-3 w-3 text-amber-500" />
                                  {Math.round(ticket.ai_confidence * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex justify-between">
                    <Link 
                      to={`/support/tickets?channel=${selectedChannel}`}
                      onClick={() => setChannelDialogOpen(false)}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View all {selectedChannel} tickets →
                    </Link>
                    <Button variant="outline" onClick={() => setChannelDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default SupportDashboard;
