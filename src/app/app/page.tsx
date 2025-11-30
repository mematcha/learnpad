'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Modal, Button } from '@/components/ui';
import { ProjectCreationChat } from '@/components/workspace/project-creation-chat';
import { RecentProjectsList } from '@/components/workspace/recent-projects-list';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isRecentProjectsModalOpen, setIsRecentProjectsModalOpen] = React.useState(false);
  const [projectConfig, setProjectConfig] = React.useState<{
    notebook_id?: string;
    subject?: string;
    curriculum_plan_id?: string;
  } | null>(null);

  const handleProjectComplete = (config: {
    notebook_id?: string;
    subject?: string;
    curriculum_plan_id?: string;
  }) => {
    setProjectConfig(config);
    // Auto-close modal and navigate when notebook is ready
    if (config.notebook_id) {
      setIsCreateModalOpen(false);
      router.push(`/notebook?id=${config.notebook_id}`);
    }
  };

  const handleCreateProject = () => {
    // The project creation is now handled automatically in handleProjectComplete
    // This function is kept for backward compatibility but may not be needed
    if (projectConfig?.notebook_id) {
      router.push(`/notebook?id=${projectConfig.notebook_id}`);
    }
    setIsCreateModalOpen(false);
    setProjectConfig(null);
  };

  return (
    <AppShell>
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Welcome to Learnpad
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
            Your adaptive learning companion for personalized education
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-transparent text-xs font-normal transition hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80"
            >
              Create New Project
            </button>
            <button
              type="button"
              onClick={() => setIsRecentProjectsModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-transparent text-xs font-normal transition hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80"
            >
              Recent Projects
            </button>
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-center text-sm font-semibold mb-1">Getting Started</h2>
          <p className="text-center text-xs text-muted-foreground max-w-2xl mx-auto mb-6">
            Learn how to make the most of Learnpad
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Feature
              title="Adaptive Notebooks"
              description="Capture everything in one place. Organize lessons, notes, and inline updates."
            />
            <Feature
              title="Teaching Agent"
              description="Keep an AI tutor at your side. Ask questions, request explanations, and get tailored recommendations on demand."
            />
            <Feature
              title="Interactive Practice"
              description="Solve runnable exercises inside each lesson. Auto-check math/code answers and receive instant feedback as you learn."
            />
            <Feature
              title="Sandboxes"
              description="Spin up interactive environments for code or math problems, and get instant feedback." 
            />
          </div>
        </section>
      </div>

      {isAuthenticated && (
        <>
          <Modal
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            title="Create New Learning Notebook"
            description="Chat with our AI assistant to create a personalized learning experience"
            size="lg"
            footer={
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setProjectConfig(null);
                }}
              >
                Cancel
              </Button>
            }
          >
            <ProjectCreationChat
              onComplete={handleProjectComplete}
              className="h-[500px]"
            />
          </Modal>

          <Modal
            open={isRecentProjectsModalOpen}
            onOpenChange={setIsRecentProjectsModalOpen}
            title="Recent Projects"
            description="Search and open your recent learning projects"
            size="lg"
            footer={
              <Button
                variant="outline"
                onClick={() => setIsRecentProjectsModalOpen(false)}
              >
                Close
              </Button>
            }
          >
            <RecentProjectsList
              onProjectClick={(project) => {
                console.log('Opening project:', project);
                // TODO: Navigate to project or open it
                setIsRecentProjectsModalOpen(false);
              }}
              className="h-[400px]"
            />
          </Modal>
        </>
      )}
    </AppShell>
  );
}

function Feature({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4 bg-background/60 backdrop-blur-sm">
      <h3 className="text-sm font-semibold tracking-tight leading-snug mb-2">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}