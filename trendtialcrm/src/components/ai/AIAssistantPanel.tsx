// src/components/ai/AIAssistantPanel.tsx
import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    type: 'lead' | 'follow-up' | 'general';
    data?: any;
  };
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ 
  isOpen, 
  onClose,
  context 
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  const actions = [
    {
      id: 'analyze-lead',
      label: 'Analyze this lead',
      description: 'Get AI insights about lead temperature, priority, and recommended actions',
      icon: '🔍',
      available: context?.type === 'lead'
    },
    {
      id: 'write-follow-up',
      label: 'Write follow-up',
      description: 'Generate personalized follow-up message',
      icon: '✍️',
      available: context?.type === 'follow-up' || context?.type === 'lead'
    },
    {
      id: 'suggest-action',
      label: 'Suggest next action',
      description: 'Get AI recommendations for next steps',
      icon: '💡',
      available: true
    },
    {
      id: 'generate-content',
      label: 'Quick content generation',
      description: 'Generate email, SMS, or call script',
      icon: '🚀',
      available: true
    }
  ].filter(action => action.available);

  const handleAction = (actionId: string) => {
    setSelectedAction(actionId);
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedContent(`AI-generated content for: ${actions.find(a => a.id === actionId)?.label}`);
    }, 1000);
  };

  return (
    <>
      <Transition show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-end">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-white shadow-xl transition-all">
                  <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="h-6 w-6 text-primary" />
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          AI Assistant
                        </Dialog.Title>
                      </div>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {!selectedAction ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 mb-4">
                            What would you like help with?
                          </p>
                          {actions.map((action) => (
                            <Card
                              key={action.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleAction(action.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                  <span className="text-2xl">{action.icon}</span>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">
                                      {action.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {action.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedAction(null);
                              setGeneratedContent('');
                            }}
                            className="mb-4"
                          >
                            ← Back
                          </Button>
                          <Card>
                            <CardContent className="p-4">
                              {generatedContent ? (
                                <div className="space-y-4">
                                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                      {generatedContent}
                                    </p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" className="flex-1">
                                      Copy
                                    </Button>
                                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                                      Use
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                  <p className="text-sm text-gray-500">Generating...</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default AIAssistantPanel;

