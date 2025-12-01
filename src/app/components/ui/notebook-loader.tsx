'use client';

import * as React from 'react';
import { BookOpen, Brain, Cog, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface NotebookLoaderProps {
  title?: string;
  currentStep?: string;
  progress?: number;
  status?: 'assessment' | 'curriculum' | 'generating' | 'complete' | 'error';
  message?: string;
  className?: string;
}

const getStatusConfig = (status: NotebookLoaderProps['status']) => {
  switch (status) {
    case 'assessment':
      return {
        icon: Brain,
        title: 'Assessment in Progress',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        description: 'Analyzing your learning preferences...',
      };
    case 'curriculum':
      return {
        icon: BookOpen,
        title: 'Curriculum Planning',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        description: 'Creating your personalized learning plan...',
      };
    case 'generating':
      return {
        icon: Cog,
        title: 'Generating Notebook',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        description: 'Building your learning content...',
      };
    case 'complete':
      return {
        icon: CheckCircle,
        title: 'Notebook Ready!',
        color: 'text-success',
        bgColor: 'bg-success/10',
        description: 'Your personalized notebook is ready to explore.',
      };
    case 'error':
      return {
        icon: CheckCircle, // We'll use a different icon for error in the component
        title: 'Creation Failed',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        description: 'Something went wrong. Please try again.',
      };
    default:
      return {
        icon: Loader2,
        title: 'Creating Notebook',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        description: 'Please wait while we prepare your learning experience...',
      };
  }
};

export function NotebookLoader({
  title,
  currentStep,
  progress = 0,
  status = 'generating',
  message,
  className
}: NotebookLoaderProps) {
  const statusConfig = getStatusConfig(status);
  const IconComponent = statusConfig.icon;

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            statusConfig.bgColor
          )}>
            {status === 'error' ? (
              <CheckCircle className={cn('h-8 w-8', statusConfig.color)} />
            ) : status === 'complete' ? (
              <IconComponent className={cn('h-8 w-8', statusConfig.color)} />
            ) : (
              <IconComponent className={cn('h-8 w-8 animate-spin', statusConfig.color)} />
            )}
          </div>
        </div>
        <CardTitle className="text-xl font-semibold">
          {title || statusConfig.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {message || statusConfig.description}
          </p>
        </div>

        {currentStep && status !== 'complete' && status !== 'error' && (
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {currentStep}
            </p>
          </div>
        )}

        {status !== 'complete' && status !== 'error' && (
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to your notebook...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <p className="text-sm text-destructive">
              Please try creating a new project or contact support if the issue persists.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotebookLoader;
