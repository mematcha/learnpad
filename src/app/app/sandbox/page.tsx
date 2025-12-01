import { AppShell } from '@/components/layout';
import { CodeSandbox } from '@/components/sandbox';

export default function SandboxPage() {
  return (
    <AppShell>
      <div className="container mx-auto p-6 h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Code Sandbox</h1>
          <p className="text-muted-foreground">
            Practice coding with multi-language support and real-time execution
          </p>
        </div>
        
        <div className="h-[calc(100vh-200px)]">
          <CodeSandbox />
        </div>
      </div>
    </AppShell>
  );
}
