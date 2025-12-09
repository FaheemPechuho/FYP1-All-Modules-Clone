// src/pages/support/AgentQueuePage.tsx
// Human Agent Queue - For tickets that need human review
import React, { useState, useRef, useEffect } from 'react';
import { useTicketsQuery, useTicketMessagesQuery, useSendTicketMessageMutation, useUpdateTicketMutation, useAISuggestResponseMutation } from '../../hooks/queries/useSupportQuery';
import { Ticket, TicketMessage } from '../../types/support';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowUpIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

// Priority colors
const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
  critical: 'bg-red-600 text-white',
};

// Status colors
const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_customer: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  escalated: 'bg-red-100 text-red-800',
};

// Message Component
const MessageBubble: React.FC<{ message: TicketMessage; isLast?: boolean }> = ({ message, isLast }) => {
  const isCustomer = message.sender_type === 'customer';
  const isSystem = message.sender_type === 'system';
  const isAI = message.sender_type === 'ai_bot';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-600 flex items-center gap-2">
          <BoltIcon className="h-3 w-3" />
          {message.content}
        </div>
      </div>
    );
  }

  // Hide raw AI bot chat bubbles in Agent Queue.
  // The assistant's answer is already shown in the dedicated "AI Response" panel above.
  if (isAI) {
    return null;
  }

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[80%] ${isCustomer ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-center gap-2 mb-1 ${isCustomer ? '' : 'justify-end'}`}>
          <span className="text-xs font-medium text-gray-600">{message.sender_name}</span>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {isAI && (
            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
              <SparklesIcon className="h-3 w-3" />
              AI
            </span>
          )}
        </div>
        <div className={`p-3 rounded-2xl text-sm ${
          isCustomer 
            ? 'bg-gray-100 rounded-tl-none' 
            : 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
      <div className={`flex-shrink-0 ${isCustomer ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
          isCustomer 
            ? 'bg-gradient-to-br from-gray-300 to-gray-400' 
            : isAI
              ? 'bg-gradient-to-br from-purple-400 to-indigo-500'
              : 'bg-gradient-to-br from-primary to-indigo-500'
        }`}>
          {isAI ? <SparklesIcon className="h-4 w-4" /> : message.sender_name?.charAt(0) || 'U'}
        </div>
      </div>
    </div>
  );
};

// Ticket Card in Queue
const QueueTicketCard: React.FC<{
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
}> = ({ ticket, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 border-b transition-all hover:bg-gray-50 ${
      isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
    }`}
  >
    <div className="flex items-start justify-between mb-2">
      <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${priorityColors[ticket.priority] || priorityColors.medium}`}>
        {ticket.priority}
      </span>
    </div>
    <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">{ticket.subject}</h4>
    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-600">
            {ticket.customer_name?.charAt(0) || 'C'}
          </span>
        </div>
        <span className="text-xs text-gray-600">{ticket.customer_name}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
      </span>
    </div>
    {ticket.needs_human_review && (
      <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
        <ExclamationTriangleIcon className="h-3 w-3" />
        Needs Human Review
      </div>
    )}
  </button>
);

const AgentQueuePage: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'needs_review' | 'open' | 'in_progress'>('needs_review');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch tickets that need human review
  const { data: allTickets = [], isLoading, refetch } = useTicketsQuery({});
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessagesQuery(selectedTicket?.id);
  
  const sendMessageMutation = useSendTicketMessageMutation();
  const updateTicketMutation = useUpdateTicketMutation();
  const aiAnswerMutation = useAISuggestResponseMutation();
  
  // State for AI response in chat
  const [aiChatResponse, setAiChatResponse] = useState<string | null>(null);
  const [isGettingAI, setIsGettingAI] = useState(false);

  // Filter tickets
  const filteredTickets = allTickets.filter((ticket: Ticket) => {
    if (filter === 'needs_review') return ticket.needs_human_review || ticket.status === 'open';
    if (filter === 'open') return ticket.status === 'open';
    if (filter === 'in_progress') return ticket.status === 'in_progress';
    return true;
  }).filter((ticket: Ticket) => {
    if (!searchQuery) return true;
    return ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
           ticket.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Stats
  const stats = {
    total: allTickets.length,
    needsReview: allTickets.filter((t: Ticket) => t.needs_human_review).length,
    open: allTickets.filter((t: Ticket) => t.status === 'open').length,
    inProgress: allTickets.filter((t: Ticket) => t.status === 'in_progress').length,
  };

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        ticket_id: selectedTicket.id,
        content: replyContent.trim(),
      });
      setReplyContent('');
      
      // Update ticket status to in_progress if open
      if (selectedTicket.status === 'open') {
        await updateTicketMutation.mutateAsync({
          id: selectedTicket.id,
          data: { status: 'in_progress' },
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    
    // Optimistically clear selection first for instant UI feedback
    const ticketToResolve = selectedTicket;
    setSelectedTicket(null);
    
    try {
      await updateTicketMutation.mutateAsync({
        id: ticketToResolve.id,
        data: { status: 'resolved', needs_human_review: false },
      });
      // Query invalidation in mutation will trigger refetch automatically
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
      // Revert selection on error
      setSelectedTicket(ticketToResolve);
    }
  };
  
  // Get AI answer when ticket is selected
  const handleGetAIAnswer = async () => {
    if (!selectedTicket) return;
    
    setIsGettingAI(true);
    setAiChatResponse(null);
    
    try {
      const result = await aiAnswerMutation.mutateAsync(selectedTicket.id);
      setAiChatResponse(result.answer);
    } catch (error) {
      console.error('Failed to get AI answer:', error);
      setAiChatResponse('Unable to get AI response. Please try again.');
    } finally {
      setIsGettingAI(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    
    try {
      await updateTicketMutation.mutateAsync({
        id: selectedTicket.id,
        data: { status: 'escalated', priority: 'urgent' },
      });
      refetch();
    } catch (error) {
      console.error('Failed to escalate ticket:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UserGroupIcon className="h-7 w-7 text-primary" />
            Agent Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Handle tickets that need human attention
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'all' ? 'border-primary bg-primary/5' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-muted-foreground">All Tickets</p>
        </button>
        <button
          onClick={() => setFilter('needs_review')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'needs_review' ? 'border-orange-500 bg-orange-50' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-orange-600">{stats.needsReview}</p>
          <p className="text-sm text-muted-foreground">Needs Review</p>
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'open' ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
          <p className="text-sm text-muted-foreground">Open</p>
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'in_progress' ? 'border-yellow-500 bg-yellow-50' : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Ticket List */}
        <div className="w-96 bg-white rounded-xl border flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CheckCircleIcon className="h-12 w-12 mx-auto text-green-300 mb-3" />
                <p className="text-sm text-muted-foreground">No tickets in queue</p>
              </div>
            ) : (
              filteredTickets.map((ticket: Ticket) => (
                <QueueTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selectedTicket?.id === ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-xl border flex flex-col">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{selectedTicket.ticket_number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedTicket.status] || statusColors.open}`}>
                        {selectedTicket.status?.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${priorityColors[selectedTicket.priority] || priorityColors.medium}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {selectedTicket.customer_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="h-4 w-4" />
                        {selectedTicket.customer_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {format(new Date(selectedTicket.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEscalate}>
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                      Escalate
                    </Button>
                    <Button size="sm" onClick={handleResolveTicket} className="bg-green-600 hover:bg-green-700">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>

              {/* Initial Description */}
              <div className="p-4 bg-blue-50 border-b">
                <p className="text-sm text-blue-800">{selectedTicket.description}</p>
              </div>
              
              {/* AI Classification Info */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">AI Classification (RoBERTa)</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="px-2 py-1 bg-purple-100 rounded-full text-purple-700">
                    Category: {selectedTicket.category?.replace('_', ' ') || 'Unknown'}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 rounded-full text-purple-700">
                    Priority: {selectedTicket.priority}
                  </span>
                  {selectedTicket.ai_confidence && (
                    <span className="px-2 py-1 bg-purple-100 rounded-full text-purple-700">
                      Confidence: {(selectedTicket.ai_confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  {selectedTicket.needs_human_review && (
                    <span className="px-2 py-1 bg-orange-100 rounded-full text-orange-700 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      Needs Human Review
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Show AI Resolution if exists */}
                    {selectedTicket.resolution && (
                      <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                            <SparklesIcon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-purple-800">AI Response (Llama 3.1 + RAG)</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.resolution}</p>
                      </div>
                    )}
                    
                    {/* Button to get AI answer if no resolution yet */}
                    {!selectedTicket.resolution && (
                      <div className="mb-4 text-center">
                        <Button 
                          onClick={handleGetAIAnswer}
                          disabled={isGettingAI}
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                        >
                          {isGettingAI ? (
                            <>
                              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                              Getting AI Response...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-4 w-4 mr-2" />
                              Get AI Answer
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Show AI response from button click */}
                    {aiChatResponse && !selectedTicket.resolution && (
                      <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                            <SparklesIcon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-purple-800">AI Response</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiChatResponse}</p>
                      </div>
                    )}
                    
                    {/* Conversation messages */}
                    {messages.length === 0 && !selectedTicket.resolution && !aiChatResponse ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Click "Get AI Answer" to generate a response, or type a reply below.</p>
                      </div>
                    ) : (
                      messages.map((msg: TicketMessage, idx: number) => (
                        <MessageBubble key={msg.id} message={msg} isLast={idx === messages.length - 1} />
                      ))
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your response..."
                    rows={2}
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() || sendMessageMutation.isLoading}
                    className="self-end bg-gradient-to-r from-primary to-indigo-600"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a ticket</h3>
                <p className="text-muted-foreground">Choose a ticket from the queue to start responding</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentQueuePage;
