'use client';

import * as React from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectConfig {
  name?: string;
  agents?: string[];
  resources?: string[];
}

interface ProjectCreationChatProps {
  onComplete?: (config: ProjectConfig) => void;
  className?: string;
}

const initialMessage: Message = {
  id: '1',
  role: 'assistant',
  content: "Hello! I'm here to help you set up your new learning project. Let's start by giving it a name. What would you like to call this project?",
  timestamp: new Date(),
};

export function ProjectCreationChat({ onComplete, className }: ProjectCreationChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([initialMessage]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [config, setConfig] = React.useState<ProjectConfig>({});
  const [step, setStep] = React.useState<'name' | 'agents' | 'resources' | 'complete'>('name');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string, currentStep: string): string => {
    const lowerMessage = userMessage.toLowerCase().trim();

    switch (currentStep) {
      case 'name':
        // Extract project name
        const name = userMessage.trim();
        setConfig(prev => ({ ...prev, name }));
        setStep('agents');
        return `Great! I'll call it "${name}". Now, which agents would you like to use for this project? You can choose from:\n\n• Teaching Agent - Provides explanations and guidance\n• Code Assistant - Helps with programming tasks\n• Math Tutor - Assists with mathematical concepts\n• Research Agent - Finds and summarizes information\n\nYou can select multiple agents. Just tell me which ones you'd like.`;

      case 'agents':
        // Extract agents
        const agents: string[] = [];
        if (lowerMessage.includes('teaching') || lowerMessage.includes('tutor') || lowerMessage.includes('guide')) {
          agents.push('Teaching Agent');
        }
        if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('coding')) {
          agents.push('Code Assistant');
        }
        if (lowerMessage.includes('math') || lowerMessage.includes('mathematical') || lowerMessage.includes('calculation')) {
          agents.push('Math Tutor');
        }
        if (lowerMessage.includes('research') || lowerMessage.includes('find') || lowerMessage.includes('summarize')) {
          agents.push('Research Agent');
        }
        if (lowerMessage.includes('all') || lowerMessage.includes('everything')) {
          agents.push('Teaching Agent', 'Code Assistant', 'Math Tutor', 'Research Agent');
        }
        
        const selectedAgents = agents.length > 0 ? agents : ['Teaching Agent']; // Default
        setConfig(prev => ({ ...prev, agents: selectedAgents }));
        setStep('resources');
        return `Perfect! I've selected ${selectedAgents.join(', ')} for your project. Now, what resources would you like to include? For example:\n\n• Code examples and templates\n• Mathematical formulas and equations\n• Interactive exercises\n• Reference documentation\n• Video tutorials\n\nWhat resources would be most helpful for your learning goals?`;

      case 'resources':
        // Extract resources
        const resources: string[] = [];
        if (lowerMessage.includes('code') || lowerMessage.includes('template') || lowerMessage.includes('example')) {
          resources.push('Code Examples');
        }
        if (lowerMessage.includes('math') || lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
          resources.push('Mathematical Formulas');
        }
        if (lowerMessage.includes('exercise') || lowerMessage.includes('practice') || lowerMessage.includes('interactive')) {
          resources.push('Interactive Exercises');
        }
        if (lowerMessage.includes('documentation') || lowerMessage.includes('reference') || lowerMessage.includes('docs')) {
          resources.push('Reference Documentation');
        }
        if (lowerMessage.includes('video') || lowerMessage.includes('tutorial')) {
          resources.push('Video Tutorials');
        }
        if (lowerMessage.includes('all') || lowerMessage.includes('everything')) {
          resources.push('Code Examples', 'Mathematical Formulas', 'Interactive Exercises', 'Reference Documentation', 'Video Tutorials');
        }
        
        const selectedResources = resources.length > 0 ? resources : ['Code Examples', 'Interactive Exercises']; // Default
        setConfig(prev => ({ ...prev, resources: selectedResources }));
        setStep('complete');
        
        const finalConfig = { ...config, resources: selectedResources };
        setTimeout(() => {
          onComplete?.(finalConfig);
        }, 500);
        
        return `Excellent! I've configured your project with:\n\n**Project Name:** ${config.name}\n**Agents:** ${config.agents?.join(', ')}\n**Resources:** ${selectedResources.join(', ')}\n\nYour project is ready to be created! Click the "Create Project" button to proceed.`;

      default:
        return "I'm ready to help you create your project. Let's get started!";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || step === 'complete') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(userMessage.content, step);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-0 min-h-[300px] max-h-[400px]">
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-3 w-3" />
                  </div>
                </div>
              )}
              
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-3 w-3" />
                </div>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={step === 'complete' ? 'Project configuration complete!' : 'Type your message...'}
            disabled={isLoading || step === 'complete'}
            className="min-h-[40px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || step === 'complete'}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

