import { AppShell } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export default function Home() {
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

        <div className="flex gap-2 justify-center">
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-transparent text-xs font-normal transition hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80"
          >
            Create New Project
          </button>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-transparent text-xs font-normal transition hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80"
          >
            Recent Projects
          </button>
        </div>

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