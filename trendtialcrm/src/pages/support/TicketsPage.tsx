// src/pages/support/TicketsPage.tsx
import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTicketsQuery, useUpdateTicketMutation } from '../../hooks/queries/useSupportQuery';
import { TicketFilters, TicketSortOptions, Ticket, TicketStatus, TicketPriority, TicketChannel, TicketCategory } from '../../types/support';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  TicketIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  SparklesIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

// Status Badge Component
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const styles: Record<TicketStatus, string> = {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    waiting_customer: 'bg-purple-100 text-purple-800 border-purple-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200',
    escalated: 'bg-red-100 text-red-800 border-red-200',
  };

  const icons: Record<TicketStatus, React.ReactNode> = {
    open: <ClockIcon className="h-3.5 w-3.5" />,
    in_progress: <ArrowPathIcon className="h-3.5 w-3.5" />,
    waiting_customer: <UserIcon className="h-3.5 w-3.5" />,
    resolved: <CheckCircleIcon className="h-3.5 w-3.5" />,
    closed: <XMarkIcon className="h-3.5 w-3.5" />,
    escalated: <ExclamationTriangleIcon className="h-3.5 w-3.5" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {icons[status]}
      {status.replace('_', ' ')}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const styles: Record<TicketPriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
    critical: 'bg-red-600 text-white',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${styles[priority]}`}>
      {priority}
    </span>
  );
};

// Channel Icon Component
const ChannelIcon: React.FC<{ channel: TicketChannel }> = ({ channel }) => {
  const icons: Record<TicketChannel, React.ReactNode> = {
    email: <EnvelopeIcon className="h-4 w-4 text-blue-500" />,
    chat: <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500" />,
    phone: <PhoneIcon className="h-4 w-4 text-purple-500" />,
    voice: <PhoneIcon className="h-4 w-4 text-pink-500" />,
    web_form: <GlobeAltIcon className="h-4 w-4 text-gray-500" />,
    social_media: <GlobeAltIcon className="h-4 w-4 text-blue-400" />,
    whatsapp: <ChatBubbleLeftIcon className="h-4 w-4 text-green-600" />,
  };

  return <span title={channel}>{icons[channel]}</span>;
};

// Ticket Card Component (for grid view)
const TicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
  <Link to={`/support/tickets/${ticket.id}`}>
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChannelIcon channel={ticket.channel} />
            <span className="text-sm font-medium text-muted-foreground">{ticket.ticket_number}</span>
          </div>
          <PriorityBadge priority={ticket.priority} />
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {ticket.subject}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {ticket.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">
                {ticket.customer_name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{ticket.customer_name}</p>
              <p className="text-xs text-muted-foreground">{ticket.customer_email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <StatusBadge status={ticket.status} />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </span>
        </div>

        {ticket.ai_confidence && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <SparklesIcon className="h-4 w-4 text-purple-500" />
            <span className="text-muted-foreground">AI: {ticket.ai_category}</span>
            <span className={`font-medium ${ticket.ai_confidence > 0.9 ? 'text-green-600' : 'text-yellow-600'}`}>
              ({Math.round(ticket.ai_confidence * 100)}%)
            </span>
          </div>
        )}

        {ticket.sla_breached && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
            <ExclamationTriangleIcon className="h-4 w-4" />
            SLA Breached
          </div>
        )}
      </CardContent>
    </Card>
  </Link>
);

// Filter Panel Component
interface FilterPanelProps {
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, onClear }) => {
  const statusOptions: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'escalated'];
  const priorityOptions: TicketPriority[] = ['low', 'medium', 'high', 'urgent', 'critical'];
  const channelOptions: TicketChannel[] = ['email', 'chat', 'phone', 'voice', 'web_form', 'social_media', 'whatsapp'];
  const categoryOptions: TicketCategory[] = ['technical_issue', 'billing', 'account', 'feature_request', 'bug_report', 'general_inquiry', 'complaint', 'feedback', 'other'];

  const toggleFilter = (key: keyof TicketFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear All
        </Button>
      </div>

      {/* Status Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => toggleFilter('status', status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.status?.includes(status)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map(priority => (
            <button
              key={priority}
              onClick={() => toggleFilter('priority', priority)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.priority?.includes(priority)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Channel</label>
        <div className="flex flex-wrap gap-2">
          {channelOptions.map(channel => (
            <button
              key={channel}
              onClick={() => toggleFilter('channel', channel)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.channel?.includes(channel)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {channel.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map(category => (
            <button
              key={category}
              onClick={() => toggleFilter('category', category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.category?.includes(category)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* SLA Breached Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="sla-breached"
          checked={filters.sla_breached || false}
          onChange={(e) => onFiltersChange({ ...filters, sla_breached: e.target.checked || undefined })}
          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
        />
        <label htmlFor="sla-breached" className="text-sm font-medium text-gray-700">
          SLA Breached Only
        </label>
      </div>

      {/* Unassigned Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="unassigned"
          checked={filters.unassigned || false}
          onChange={(e) => onFiltersChange({ ...filters, unassigned: e.target.checked || undefined })}
          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
        />
        <label htmlFor="unassigned" className="text-sm font-medium text-gray-700">
          Unassigned Only
        </label>
      </div>
    </div>
  );
};

const TicketsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse filters from URL
  const filters: TicketFilters = useMemo(() => ({
    status: searchParams.get('status')?.split(',') as TicketStatus[] | undefined,
    priority: searchParams.get('priority')?.split(',') as TicketPriority[] | undefined,
    channel: searchParams.get('channel')?.split(',') as TicketChannel[] | undefined,
    category: searchParams.get('category')?.split(',') as TicketCategory[] | undefined,
    search: searchQuery || undefined,
    sla_breached: searchParams.get('sla_breached') === 'true' || undefined,
    unassigned: searchParams.get('unassigned') === 'true' || undefined,
  }), [searchParams, searchQuery]);

  const [sort, setSort] = useState<TicketSortOptions>({ field: 'created_at', direction: 'desc' });

  const { data: tickets = [], isLoading, refetch } = useTicketsQuery(filters, sort);

  const handleFiltersChange = (newFilters: TicketFilters) => {
    const params = new URLSearchParams();
    if (newFilters.status?.length) params.set('status', newFilters.status.join(','));
    if (newFilters.priority?.length) params.set('priority', newFilters.priority.join(','));
    if (newFilters.channel?.length) params.set('channel', newFilters.channel.join(','));
    if (newFilters.category?.length) params.set('category', newFilters.category.join(','));
    if (newFilters.sla_breached) params.set('sla_breached', 'true');
    if (newFilters.unassigned) params.set('unassigned', 'true');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchQuery('');
  };

  const activeFiltersCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.channel?.length,
    filters.category?.length,
    filters.sla_breached,
    filters.unassigned,
  ].filter(Boolean).length;

  // Quick filter stats
  const stats = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((t: Ticket) => t.status === 'open').length,
    inProgress: tickets.filter((t: Ticket) => t.status === 'in_progress').length,
    urgent: tickets.filter((t: Ticket) => t.priority === 'urgent' || t.priority === 'critical').length,
  }), [tickets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <TicketIcon className="h-7 w-7 text-primary" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and respond to customer support requests
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to="/support/tickets/new">
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleFiltersChange({})}
          className={`p-4 rounded-xl border-2 transition-all ${
            !filters.status?.length ? 'border-primary bg-primary/5' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.all}</p>
          <p className="text-sm text-muted-foreground">All Tickets</p>
        </button>
        <button
          onClick={() => handleFiltersChange({ status: ['open'] })}
          className={`p-4 rounded-xl border-2 transition-all ${
            filters.status?.includes('open') && filters.status.length === 1 ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
          <p className="text-sm text-muted-foreground">Open</p>
        </button>
        <button
          onClick={() => handleFiltersChange({ status: ['in_progress'] })}
          className={`p-4 rounded-xl border-2 transition-all ${
            filters.status?.includes('in_progress') && filters.status.length === 1 ? 'border-yellow-500 bg-yellow-50' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </button>
        <button
          onClick={() => handleFiltersChange({ priority: ['urgent', 'critical'] })}
          className={`p-4 rounded-xl border-2 transition-all ${
            filters.priority?.includes('urgent') ? 'border-red-500 bg-red-50' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
          <p className="text-sm text-muted-foreground">Urgent</p>
        </button>
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets by subject, customer, or ticket number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters || activeFiltersCount > 0 ? 'border-primary text-primary' : ''}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
            </div>

            <select
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [TicketSortOptions['field'], 'asc' | 'desc'];
                setSort({ field, direction });
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="priority-desc">Highest Priority</option>
              <option value="priority-asc">Lowest Priority</option>
              <option value="updated_at-desc">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.status?.map(status => (
              <span key={status} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Status: {status.replace('_', ' ')}
                <button onClick={() => handleFiltersChange({ ...filters, status: filters.status?.filter(s => s !== status) })}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            {filters.priority?.map(priority => (
              <span key={priority} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                Priority: {priority}
                <button onClick={() => handleFiltersChange({ ...filters, priority: filters.priority?.filter(p => p !== priority) })}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-sm text-primary hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filter Panel */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={clearFilters}
            />
          </div>
        )}

        {/* Tickets List/Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TicketIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeFiltersCount > 0 ? 'Try adjusting your filters' : 'Create your first support ticket'}
                </p>
                <Link to="/support/tickets/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tickets.map((ticket: Ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Ticket</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Customer</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Priority</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Channel</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Agent</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Created</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket: Ticket) => (
                      <tr key={ticket.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <Link to={`/support/tickets/${ticket.id}`} className="hover:text-primary">
                            <p className="font-medium text-sm">{ticket.ticket_number}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{ticket.subject}</p>
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">
                                {ticket.customer_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{ticket.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{ticket.customer_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="py-4 px-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <ChannelIcon channel={ticket.channel} />
                            <span className="text-sm capitalize">{ticket.channel.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {ticket.assigned_agent ? (
                            <span className="text-sm">{ticket.assigned_agent.full_name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link to={`/support/tickets/${ticket.id}`}>
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;
