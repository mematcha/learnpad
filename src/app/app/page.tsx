import { AppShell } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export default function Home() {
  return (
    <AppShell>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Welcome to Learnpad</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Your adaptive learning companion for personalized education
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Start a new learning project with interactive notebooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Begin your learning journey with AI-powered adaptive content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Continue where you left off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access your recent learning materials and progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Analytics</CardTitle>
              <CardDescription>
                Track your progress and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize your learning patterns and improvements
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to make the most of Learnpad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold tracking-tight leading-snug text-lg mb-2">
                    Interactive Notebooks
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create rich documents with text, code, and mathematical notation
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight leading-snug text-lg mb-2">
                    AI Assistant
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized help and adaptive content recommendations
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight leading-snug text-lg mb-2">
                    Code Sandboxes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Practice coding with multi-language support and IntelliSense
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight leading-snug text-lg mb-2">
                    Progress Tracking
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your learning journey with detailed analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
    </AppShell>
  );
}