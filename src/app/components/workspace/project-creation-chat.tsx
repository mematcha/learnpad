'use client';

import * as React from 'react';
import { Send, Bot, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { NotebookLoader } from '@/components/ui/notebook-loader';
import { cn } from '@/lib/utils';
import { assessmentAPI, curriculumAPI, notebookAPI } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectConfig {
  notebook_id?: string;
  subject?: string;
  curriculum_plan_id?: string;
}

interface ProjectCreationChatProps {
  onComplete?: (config: ProjectConfig) => void;
  className?: string;
}

type ConversationStep = 'assessment' | 'assessment_complete' | 'curriculum' | 'generating' | 'complete';

const initialMessage: Message = {
  id: '1',
  role: 'assistant',
  content: "Hello! I'm here to help you create a personalized learning notebook. I'll ask you a few questions to understand your learning goals and preferences.\n\n**To get started, tell me what subject or topic you'd like to learn about.**",
  timestamp: new Date(),
};

export function ProjectCreationChat({ onComplete, className }: ProjectCreationChatProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([initialMessage]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [config, setConfig] = React.useState<ProjectConfig>({});
  const [conversationStep, setConversationStep] = React.useState<ConversationStep>('assessment');
  const [assessmentSessionId, setAssessmentSessionId] = React.useState<string | null>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [curriculumPlanId, setCurriculumPlanId] = React.useState<string | null>(null);
  const [notebookId, setNotebookId] = React.useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = React.useState<{current_step: string, percentage: number} | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

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

  // Initialize assessment session when component mounts
  React.useEffect(() => {
    const initializeAssessment = async () => {
      if (!user?.sub) return;

      try {
        setError(null);
        const response = await assessmentAPI.startAssessment({
          user_id: user.sub
        });

        setAssessmentSessionId(response.session_id);

        // Only show the initial welcome message - wait for user to start the conversation
        setMessages([initialMessage]);
      } catch (err: any) {
        console.error('Failed to start assessment:', err);
        let errorMessage = 'Failed to start assessment. Please try again.';

        // Handle specific error types
        if (err?.response?.status === 401) {
          errorMessage = 'Authentication error. Please sign in again.';
        } else if (err?.response?.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (err?.response?.status >= 500) {
          errorMessage = 'Server error. Please try again in a few minutes.';
        } else if (!navigator.onLine) {
          errorMessage = 'No internet connection. Please check your connection and try again.';
        }

        setError(errorMessage);
      }
    };

    initializeAssessment();
  }, [user?.sub]);

  // Progress polling for notebook generation
  React.useEffect(() => {
    if (conversationStep === 'generating' && notebookId) {
      let pollAttempts = 0;
      const maxPollAttempts = 30; // Max 1 minute of polling (30 * 2s)

      const pollProgress = async () => {
        try {
          pollAttempts++;
          const response = await notebookAPI.getNotebookStatus(notebookId);
          const progress = response.progress;

          if (progress) {
            setGenerationProgress({
              current_step: progress.current_step || 'Processing',
              percentage: progress.percentage || 0
            });

            if (response.status === 'complete') {
              setConversationStep('complete');
              setConfig(prev => ({ ...prev, notebook_id: notebookId }));

              const completionMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `🎉 Your personalized learning notebook has been created successfully!\n\n**Notebook ID:** ${notebookId}\n\nYou can now start learning with your customized content. The page will redirect automatically in a moment...`,
                timestamp: new Date(),
              };

              setMessages(prev => [...prev, completionMessage]);

              // Clear progress polling
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }

              // Redirect to the notebook page
              setTimeout(() => {
                router.push(`/notebook/${notebookId}`);
              }, 1500);
              return;
            } else if (response.status === 'error') {
              // Generation failed
              setError('Notebook generation failed. Please try again.');

              const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'I apologize, but the notebook generation failed. Please try creating a new project.',
                timestamp: new Date(),
              };

              setMessages(prev => [...prev, errorMessage]);
              setConversationStep('curriculum');

              // Clear progress polling
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              return;
            }
          }

          // Stop polling after max attempts
          if (pollAttempts >= maxPollAttempts) {
            setError('Notebook generation is taking longer than expected. Please check your notebooks later or try again.');

            const timeoutMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: 'The notebook generation is taking longer than expected. Please check your notebooks page later or try creating a new project.',
              timestamp: new Date(),
            };

            setMessages(prev => [...prev, timeoutMessage]);
            setConversationStep('curriculum');

            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        } catch (err: any) {
          console.error('Failed to poll progress:', err);

          let shouldContinuePolling = true;

          if (err?.response?.status === 404) {
            // Notebook not found - stop polling
            setError('Notebook not found. Please try creating a new project.');
            shouldContinuePolling = false;
          } else if (err?.response?.status >= 500) {
            // Server error - continue polling but log it
            console.warn('Server error during progress polling, continuing...');
          } else if (!navigator.onLine) {
            // Network error - continue polling
            console.warn('Network error during progress polling, continuing...');
          }

          if (!shouldContinuePolling) {
            const errorMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: 'I encountered an error checking your notebook progress. Please try creating a new project.',
              timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
            setConversationStep('curriculum');

            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        }
      };

      // Start polling
      progressIntervalRef.current = setInterval(pollProgress, 2000);
      pollProgress(); // Initial poll

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [conversationStep, notebookId, onComplete]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleSendAssessmentMessage = async (userMessage: string, retryCount = 0) => {
    if (!assessmentSessionId || !user?.sub) return;

    const maxRetries = 2;

    try {
      setError(null);
      const response = await assessmentAPI.sendAssessmentMessage(assessmentSessionId, {
        message: userMessage,
        user_id: user.sub
      });

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check if assessment is complete
      if (response.profile_complete) {
        // Get the final user profile
        const profileResponse = await assessmentAPI.getAssessmentProfile(assessmentSessionId);
        setUserProfile(profileResponse.profile);

        // Assessment is complete - wait for user to click "Create Notebook"
        setConversationStep('assessment_complete');

        // Add completion message
        const completionMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Perfect! I now have a good understanding of your learning preferences and goals. Click the **"Create Notebook"** button below to generate your personalized learning notebook.',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, completionMessage]);
      }
    } catch (err: any) {
      console.error('Failed to send assessment message:', err);

      let errorMessage = 'Failed to process your message. Please try again.';
      let shouldRetry = false;

      // Handle specific error types
      if (err?.response?.status === 401) {
        errorMessage = 'Session expired. Please refresh the page and try again.';
        setConversationStep('complete'); // Prevent further interaction
      } else if (err?.response?.status === 404) {
        errorMessage = 'Assessment session not found. Please start over.';
        setConversationStep('complete');
      } else if (err?.response?.status === 429 && retryCount < maxRetries) {
        // Rate limited - retry after delay
        shouldRetry = true;
        setTimeout(() => {
          handleSendAssessmentMessage(userMessage, retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      } else if (err?.response?.status >= 500 && retryCount < maxRetries) {
        // Server error - retry
        shouldRetry = true;
        setTimeout(() => {
          handleSendAssessmentMessage(userMessage, retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection and try again.';
      }

      if (!shouldRetry) {
        setError(errorMessage);

        const errorResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorResponse]);
      }
    }
  };

  const handleCurriculumPlanning = async (profile: any, retryCount = 0) => {
    const maxRetries = 2;

    try {
      setConversationStep('curriculum');
      setError(null);

      const curriculumMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Based on our conversation, I now have a good understanding of your learning preferences. Let me create a personalized curriculum plan for you...\n\n📚 **Creating your curriculum plan...**',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, curriculumMessage]);

      // Create curriculum plan
      const curriculumResponse = await curriculumAPI.createCurriculumPlan({
        user_profile: profile,
        subject: profile.subject || 'General Learning',
        learning_goals: profile.learning_goals,
        time_constraints: profile.time_constraints?.target_completion
      });

      setCurriculumPlanId(curriculumResponse.plan_id);
      setConfig(prev => ({
        ...prev,
        subject: profile.subject,
        curriculum_plan_id: curriculumResponse.plan_id
      }));

      // Curriculum planning complete - now start notebook generation
      await handleNotebookGeneration(curriculumResponse.plan_id);

    } catch (err: any) {
      console.error('Failed to create curriculum plan:', err);

      let errorMessage = 'Failed to create curriculum plan. Please try again.';
      let shouldRetry = false;

      if (err?.response?.status === 401) {
        errorMessage = 'Authentication error. Please sign in again.';
        setConversationStep('complete');
      } else if (err?.response?.status === 429 && retryCount < maxRetries) {
        shouldRetry = true;
        setTimeout(() => {
          handleCurriculumPlanning(profile, retryCount + 1);
        }, 3000 * (retryCount + 1));
        return;
      } else if (err?.response?.status >= 500 && retryCount < maxRetries) {
        shouldRetry = true;
        setTimeout(() => {
          handleCurriculumPlanning(profile, retryCount + 1);
        }, 2000 * (retryCount + 1));
        return;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection and try again.';
      }

      if (!shouldRetry) {
        setError(errorMessage);

        const errorResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I apologize, but I encountered an error creating your curriculum plan: ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorResponse]);
        setConversationStep('assessment'); // Allow retry from assessment
      }
    }
  };

  const handleCreateNotebook = async () => {
    if (!userProfile) return;

    try {
      setError(null);
      // Start the curriculum planning and notebook generation process
      await handleCurriculumPlanning(userProfile);
    } catch (err) {
      console.error('Failed to start notebook creation:', err);
      setError('Failed to start notebook creation. Please try again.');
    }
  };

  const handleNotebookGeneration = async (planId: string, retryCount = 0) => {
    const maxRetries = 1; // Fewer retries for generation as it's more expensive

    try {
      setConversationStep('generating');
      setError(null);

      const generationMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Perfect! Now I\'m generating your personalized learning notebook based on your profile and curriculum plan. This may take a few moments...\n\n🔄 **Generating your notebook...**',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, generationMessage]);

      // Start notebook generation
      const notebookResponse = await notebookAPI.createNotebook({
        plan_id: planId,
        user_id: user!.sub,
        options: {
          include_progress_tracking: true,
          include_cross_references: true,
          output_format: 'markdown'
        }
      });

      setNotebookId(notebookResponse.notebook_id);

      // Progress polling will handle the rest automatically

    } catch (err: any) {
      console.error('Failed to start notebook generation:', err);

      let errorMessage = 'Failed to start notebook generation. Please try again.';
      let shouldRetry = false;

      if (err?.response?.status === 401) {
        errorMessage = 'Authentication error. Please sign in again.';
        setConversationStep('complete');
      } else if (err?.response?.status === 404) {
        errorMessage = 'Curriculum plan not found. Please try creating a new project.';
        setConversationStep('complete');
      } else if (err?.response?.status === 429 && retryCount < maxRetries) {
        shouldRetry = true;
        setTimeout(() => {
          handleNotebookGeneration(planId, retryCount + 1);
        }, 5000 * (retryCount + 1));
        return;
      } else if (err?.response?.status >= 500 && retryCount < maxRetries) {
        shouldRetry = true;
        setTimeout(() => {
          handleNotebookGeneration(planId, retryCount + 1);
        }, 3000 * (retryCount + 1));
        return;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection and try again.';
      }

      if (!shouldRetry) {
        setError(errorMessage);

        const errorResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I apologize, but I encountered an error generating your notebook: ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorResponse]);
        setConversationStep('curriculum'); // Allow retry from curriculum planning
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || conversationStep === 'complete' || conversationStep === 'curriculum' || conversationStep === 'generating' || conversationStep === 'assessment_complete') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if this is the first user message in the assessment
      const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 1;

      if (isFirstUserMessage && conversationStep === 'assessment') {
        // For the first message, include context about what we're doing
        const contextualMessage = `${userMessage.content}\n\nI want to create a personalized learning notebook. Please assess my learning preferences and help me create a curriculum plan.`;
        await handleSendAssessmentMessage(contextualMessage);
      } else {
        await handleSendAssessmentMessage(userMessage.content);
      }
    } catch (err) {
      console.error('Error in handleSendMessage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show loader during generation
  if (conversationStep === 'generating' || conversationStep === 'curriculum') {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 flex items-center justify-center p-8">
          <NotebookLoader
            status={conversationStep === 'curriculum' ? 'curriculum' : 'generating'}
            currentStep={generationProgress?.current_step}
            progress={generationProgress?.percentage || 0}
            message={
              conversationStep === 'curriculum'
                ? 'Creating your personalized learning plan...'
                : generationProgress?.current_step || 'Building your learning content...'
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Step indicator */}
      <div className="px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {conversationStep === 'assessment' && '📝 Assessment'}
            {conversationStep === 'assessment_complete' && '✅ Assessment Complete'}
            {conversationStep === 'complete' && '✅ Complete'}
          </span>
          {generationProgress && (
            <span>{generationProgress.percentage}%</span>
          )}
        </div>
        {generationProgress && (
          <Progress value={generationProgress.percentage} className="mt-1 h-2" />
        )}
      </div>

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

          {/* Loading indicator */}
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


          {/* Error display */}
          {error && (
            <div className="flex gap-3 justify-center">
              <div className="flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <AlertCircle className="h-3 w-3" />
                </div>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 max-w-[80%]">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Notebook Button */}
      {conversationStep === 'assessment_complete' && (
        <div className="border-t p-4 bg-primary/5">
          <div className="flex justify-center">
            <Button
              onClick={handleCreateNotebook}
              disabled={isLoading}
              size="lg"
              className="px-8"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Notebook...
                </>
              ) : (
                <>
                  🚀 Create My Notebook
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            This will generate a personalized learning notebook based on our conversation
          </p>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-end space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              conversationStep === 'assessment'
                ? messages.filter(m => m.role === 'user').length === 0
                  ? 'What subject would you like to learn about?'
                  : 'Tell me about your learning goals...'
                : conversationStep === 'assessment_complete'
                ? 'Assessment complete! Click "Create Notebook" above.'
                : 'Notebook ready! Click "Open Notebook"'
            }
            disabled={isLoading || conversationStep !== 'assessment' && conversationStep !== 'assessment_complete'}
            className="min-h-[40px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || conversationStep !== 'assessment'}
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

