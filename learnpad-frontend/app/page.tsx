import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server-auth';
import { listNotebooks } from '@/lib/api/notebooks';
import { Hero } from '@/components/ui/hero';
import { Features } from '@/components/ui/features';
import { NotebooksView } from '@/components/notebook/notebooks-view';
import type { Notebook } from '@/types/entities';

/**
 * Generate dummy notebooks for development/demo purposes
 */
function getDummyNotebooks(): Notebook[] {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return [
    {
      notebook_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'dummy-user',
      title: 'Introduction to Machine Learning',
      subject: 'Computer Science',
      status: 'completed',
      created_at: oneWeekAgo.toISOString(),
      updated_at: oneDayAgo.toISOString(),
      is_shared: false,
    },
    {
      notebook_id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: 'dummy-user',
      title: 'Advanced Python Programming',
      subject: 'Programming',
      status: 'completed',
      created_at: threeDaysAgo.toISOString(),
      updated_at: oneDayAgo.toISOString(),
      is_shared: true,
    },
    {
      notebook_id: '550e8400-e29b-41d4-a716-446655440002',
      user_id: 'dummy-user',
      title: 'Web Development Fundamentals',
      subject: 'Web Development',
      status: 'generating',
      created_at: oneDayAgo.toISOString(),
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      is_shared: false,
    },
    {
      notebook_id: '550e8400-e29b-41d4-a716-446655440003',
      user_id: 'dummy-user',
      title: 'Data Structures and Algorithms',
      subject: 'Computer Science',
      status: 'completed',
      created_at: oneWeekAgo.toISOString(),
      updated_at: threeDaysAgo.toISOString(),
      is_shared: false,
    },
  ];
}

/**
 * Homepage - Conditional rendering based on authentication state
 * Public homepage for unauthenticated users
 * Authenticated homepage showing notebook list
 */
export default async function Home() {
  const user = await getServerUser();

  // If authenticated, show notebook list
  if (user) {
    try {
      const notebooksData = await listNotebooks();
      // Use dummy notebooks if API returns empty or fails
      const notebooks = notebooksData.notebooks.length > 0 
        ? notebooksData.notebooks 
        : getDummyNotebooks();
      const total = notebooks.length;

      return (
        <main className="min-h-screen bg-primary">
          <div className="container mx-auto px-4 py-6">
            <NotebooksView notebooks={notebooks} />
          </div>
        </main>
      );
    } catch (error) {
      // If error fetching notebooks, show dummy notebooks instead
      const dummyNotebooks = getDummyNotebooks();
      return (
        <main className="min-h-screen bg-primary">
          <div className="container mx-auto px-4 py-6">
            <NotebooksView notebooks={dummyNotebooks} />
          </div>
        </main>
      );
    }
  }

  // Public homepage for unauthenticated users
  return (
    <main className="min-h-screen bg-primary">
      <Hero />
      <Features />
    </main>
  );
}
