'use client';

import * as React from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageComponent, type ChatMessage } from './chat-message';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  className?: string;
  onSendMessage?: (message: string) => void;
  mode?: 'teach' | 'chat';
  onModeChange?: (mode: 'teach' | 'chat') => void;
}

// Mock initial messages
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      "Hello! I'm your AI learning assistant. I can help you with explanations, answer questions, provide coding examples, and guide you through your learning journey. What would you like to learn about today?",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
];

export function ChatInterface({
  className,
  onSendMessage,
  mode = 'teach',
  onModeChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [internalMode, setInternalMode] = React.useState<'teach' | 'chat'>(mode);
  const currentMode = onModeChange ? mode : internalMode;

  React.useEffect(() => {
    if (mode !== internalMode) {
      setInternalMode(mode);
    }
  }, [mode]);

  const handleModeChange = (nextMode: 'teach' | 'chat') => {
    if (onModeChange) {
      onModeChange(nextMode);
    } else {
      setInternalMode(nextMode);
    }
  };

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about "${userMessage.content}". This is a simulated response. In a real implementation, this would connect to your AI backend to provide personalized learning assistance, explanations, and adaptive content recommendations based on your learning progress and preferences.`,
        timestamp: new Date(),
      };

      setMessages(prev => prev.filter(m => m.id !== 'typing').concat(aiResponse));
      setIsLoading(false);
    }, 1500);

    onSendMessage?.(userMessage.content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Your learning companion
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-0">
        <div className="space-y-0">
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              className="border-b border-border/50 last:border-b-0"
            />
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentMode === 'teach'
                  ? 'Ask the AI tutor for guidance...'
                  : 'Chat with the assistant...'
              }
              disabled={isLoading}
              className="min-h-[44px] resize-none pr-28"
            />
            <div className="absolute inset-y-1 right-1 flex items-center">
              <div className="inline-flex rounded-md border bg-background p-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => handleModeChange('teach')}
                  className={cn(
                    'px-2 py-1 rounded-sm transition-colors',
                    currentMode === 'teach'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  Teach
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('chat')}
                  className={cn(
                    'px-2 py-1 rounded-sm transition-colors',
                    currentMode === 'chat'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  Chat
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip> */}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                  >
                    {isLoading ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLoading ? 'Stop' : 'Send message'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{inputValue.length}/2000</span>
        </div>
      </div>
    </div>
  );
}
