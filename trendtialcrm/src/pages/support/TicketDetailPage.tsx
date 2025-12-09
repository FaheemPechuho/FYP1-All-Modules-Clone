// src/pages/support/TicketDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTicketByIdQuery, useTicketMessagesQuery, useSendTicketMessageMutation, useUpdateTicketMutation, useCannedResponsesQuery, useAISuggestResponseMutation } from '../../hooks/queries/useSupportQuery';
import { TicketStatus, TicketPriority, TicketMessage, CannedResponse } from '../../types/support';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  ClockIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  EllipsisVerticalIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  BoltIcon,
  StarIcon,
  HandThumbUpIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

// Message Bubble Component
const MessageBubble: React.FC<{ message: TicketMessage }> = ({ message }) => {
  const isCustomer = message.sender_type === 'customer';
  const isSystem = message.sender_type === 'system';
  const isAI = message.sender_type === 'ai_bot';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 flex items-center gap-2">
          <BoltIcon className="h-4 w-4" />
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[70%] ${isCustomer ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-center gap-2 mb-1 ${isCustomer ? '' : 'justify-end'}`}>
          <span className="text-sm font-medium text-gray-700">{message.sender_name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.is_ai_generated && (
            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              <SparklesIcon className="h-3 w-3" />
              AI
            </span>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${
          isCustomer 
            ? 'bg-gray-100 rounded-tl-none' 
            : isAI 
              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tr-none'
              : 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map(attachment => (
              <a
                key={attachment.id}
                href={attachment.file_url}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                <PaperClipIcon className="h-4 w-4" />
                {attachment.filename}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className={`flex-shrink-0 ${isCustomer ? 'order-1 mr-3' : 'order-2 ml-3'}`}>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          isCustomer 
            ? 'bg-gradient-to-br from-gray-200 to-gray-300' 
            : isAI
              ? 'bg-gradient-to-br from-purple-400 to-indigo-500'
              : 'bg-gradient-to-br from-primary to-indigo-500'
        }`}>
          {isAI ? (
            <SparklesIcon className="h-5 w-5 text-white" />
          ) : (
            <span className="text-sm font-semibold text-white">
              {message.sender_name.split(' ').map(n => n[0]).join('')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Select Component
const StatusSelect: React.FC<{
  value: TicketStatus;
  onChange: (status: TicketStatus) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const options: { value: TicketStatus; label: string; color: string }[] = [
    { value: 'open', label: 'Open', color: 'bg-blue-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'waiting_customer', label: 'Waiting Customer', color: 'bg-purple-500' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-500' },
    { value: 'escalated', label: 'Escalated', color: 'bg-red-500' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TicketStatus)}
      disabled={disabled}
      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Priority Select Component  
const PrioritySelect: React.FC<{
  value: TicketPriority;
  onChange: (priority: TicketPriority) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const options: TicketPriority[] = ['low', 'medium', 'high', 'urgent', 'critical'];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TicketPriority)}
      disabled={disabled}
      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
    >
      {options.map(option => (
        <option key={option} value={option} className="capitalize">
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  );
};

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: ticket, isLoading: ticketLoading } = useTicketByIdQuery(id);
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessagesQuery(id);
  const { data: cannedResponses = [] } = useCannedResponsesQuery();
  
  const sendMessageMutation = useSendTicketMessageMutation();
  const updateTicketMutation = useUpdateTicketMutation();
  const aiSuggestMutation = useAISuggestResponseMutation();

  const [replyContent, setReplyContent] = useState('');
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !id) return;
    
    await sendMessageMutation.mutateAsync({
      ticket_id: id,
      content: replyContent.trim(),
    });
    
    setReplyContent('');
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!id) return;
    await updateTicketMutation.mutateAsync({ id, data: { status } });
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!id) return;
    await updateTicketMutation.mutateAsync({ id, data: { priority } });
  };

  const handleGetAISuggestion = async () => {
    if (!id) return;
    setShowAISuggestion(true);
    try {
      const result = await aiSuggestMutation.mutateAsync(id);
      setReplyContent(result.suggestion || ticket?.ai_suggested_response || '');
    } catch {
      // Use fallback suggestion
      setReplyContent(ticket?.ai_suggested_response || 'Thank you for reaching out. Let me help you with this issue...');
    }
  };

  const insertCannedResponse = (response: CannedResponse) => {
    setReplyContent(prev => prev + (prev ? '\n\n' : '') + response.content);
    setShowCannedResponses(false);
  };

  if (ticketLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket not found</h2>
        <p className="text-muted-foreground mb-4">The ticket you're looking for doesn't exist or has been deleted.</p>
        <Link to="/support/tickets">
          <Button>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/support/tickets">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{ticket.ticket_number}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                ticket.status === 'escalated' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                ticket.priority === 'critical' ? 'bg-red-600 text-white' :
                ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <PhoneIcon className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" size="sm">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" size="sm">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Messages */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
                Conversation
                <span className="text-sm font-normal text-muted-foreground">
                  ({messages.length} messages)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-h-[500px] overflow-y-auto">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((message: TicketMessage) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Reply Box */}
          <Card>
            <CardContent className="p-4">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetAISuggestion}
                  disabled={aiSuggestMutation.isLoading}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  {aiSuggestMutation.isLoading ? 'Generating...' : 'AI Suggest'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCannedResponses(!showCannedResponses)}
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Canned Responses
                </Button>
                <Button variant="outline" size="sm">
                  <PaperClipIcon className="h-4 w-4 mr-2" />
                  Attach
                </Button>
              </div>

              {/* Canned Responses Dropdown */}
              {showCannedResponses && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Responses</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cannedResponses.map((response: CannedResponse) => (
                      <button
                        key={response.id}
                        onClick={() => insertCannedResponse(response)}
                        className="w-full text-left p-2 rounded hover:bg-white transition-colors"
                      >
                        <p className="text-sm font-medium">{response.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{response.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Area */}
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />

              {/* Send Actions */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" title="Voice Message">
                    <MicrophoneIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Video Call">
                    <VideoCameraIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setReplyContent('')}>
                    Clear
                  </Button>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() || sendMessageMutation.isLoading}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    {sendMessageMutation.isLoading ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {ticket.customer_name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{ticket.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{ticket.customer_email}</p>
                </div>
              </div>
              {ticket.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                  <span>{ticket.customer_phone}</span>
                </div>
              )}
              <div className="pt-3 border-t space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Customer Profile
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  View Previous Tickets
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <StatusSelect
                  value={ticket.status}
                  onChange={handleStatusChange}
                  disabled={updateTicketMutation.isLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <PrioritySelect
                  value={ticket.priority}
                  onChange={handlePriorityChange}
                  disabled={updateTicketMutation.isLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-sm capitalize">
                  {ticket.category.replace('_', ' ')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Channel</label>
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-sm capitalize">
                  {ticket.channel.replace('_', ' ')}
                </p>
              </div>
              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {ticket.ai_confidence && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                  <SparklesIcon className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className="text-sm font-medium capitalize">{ticket.ai_category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ticket.ai_confidence > 0.9 ? 'bg-green-500' :
                          ticket.ai_confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${ticket.ai_confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{Math.round(ticket.ai_confidence * 100)}%</span>
                  </div>
                </div>
                {ticket.ai_sentiment && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sentiment</span>
                    <span className={`text-sm font-medium capitalize ${
                      ticket.ai_sentiment === 'positive' ? 'text-green-600' :
                      ticket.ai_sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {ticket.ai_sentiment}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                </div>
                {ticket.first_response_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First Response</span>
                    <span>{format(new Date(ticket.first_response_at), 'MMM d, HH:mm')}</span>
                  </div>
                )}
                {ticket.resolved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolved</span>
                    <span>{format(new Date(ticket.resolved_at), 'MMM d, HH:mm')}</span>
                  </div>
                )}
                {ticket.sla_deadline && (
                  <div className={`flex justify-between ${ticket.sla_breached ? 'text-red-600' : ''}`}>
                    <span>SLA Deadline</span>
                    <span>{format(new Date(ticket.sla_deadline), 'MMM d, HH:mm')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
