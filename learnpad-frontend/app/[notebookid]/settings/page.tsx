import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server-auth';
import { getNotebook } from '@/lib/api/notebooks';
import { NotebookSettingsForm } from '@/components/notebook/notebook-settings-form';
import { DeleteConfirmation } from '@/components/notebook/delete-confirmation';
import type { Notebook } from '@/types/entities';

/**
 * Generate dummy notebook data for development/demo purposes
 */
function getDummyNotebook(notebookId: string): Notebook | null {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Map of known dummy notebook IDs to their data
  const dummyNotebooks: Record<string, Notebook> = {
    '550e8400-e29b-41d4-a716-446655440000': {
      notebook_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'dummy-user',
      title: 'Introduction to Machine Learning',
      subject: 'Computer Science',
      status: 'completed',
      created_at: oneWeekAgo.toISOString(),
      updated_at: oneDayAgo.toISOString(),
      is_shared: false,
    },
    '550e8400-e29b-41d4-a716-446655440001': {
      notebook_id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: 'dummy-user',
      title: 'Advanced Python Programming',
      subject: 'Programming',
      status: 'completed',
      created_at: oneWeekAgo.toISOString(),
      updated_at: oneDayAgo.toISOString(),
      is_shared: true,
    },
    '550e8400-e29b-41d4-a716-446655440002': {
      notebook_id: '550e8400-e29b-41d4-a716-446655440002',
      user_id: 'dummy-user',
      title: 'Web Development Fundamentals',
      subject: 'Web Development',
      status: 'generating',
      created_at: oneDayAgo.toISOString(),
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      is_shared: false,
    },
    '550e8400-e29b-41d4-a716-446655440003': {
      notebook_id: '550e8400-e29b-41d4-a716-446655440003',
      user_id: 'dummy-user',
      title: 'Data Structures and Algorithms',
      subject: 'Computer Science',
      status: 'completed',
      created_at: oneWeekAgo.toISOString(),
      updated_at: oneWeekAgo.toISOString(),
      is_shared: false,
    },
  };

  return dummyNotebooks[notebookId] || null;
}

/**
 * Notebook settings page - allows notebook owners to manage notebook settings
 */
export default async function NotebookSettingsPage({
  params,
}: {
  params: Promise<{ notebookid: string }>;
}) {
  const { notebookid } = await params;
  const user = await getServerUser();

  if (!user) {
    redirect(`/login?redirect=/${notebookid}/settings`);
  }

  // Validate notebook ID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(notebookid)) {
    notFound();
  }

  // Try to get notebook data - first try API, then fall back to dummy data
  let notebook: Notebook;
  let canEdit = true;

  try {
    const notebookData = await getNotebook(notebookid);
    notebook = notebookData.notebook;
    canEdit = notebookData.can_edit;
  } catch (error) {
    // Fall back to dummy data if API fails
    const dummyNotebook = getDummyNotebook(notebookid);
    if (!dummyNotebook) {
      notFound();
    }
    notebook = dummyNotebook;
    canEdit = true; // Assume can edit for dummy notebooks
  }

  // Check ownership
  if (!canEdit) {
    return (
      <main className="min-h-screen bg-primary px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-secondary border border-color rounded-md p-4 text-center">
            <h1 className="text-xl font-semibold mb-1 text-primary">
              Access Denied
            </h1>
            <p className="text-sm text-secondary">
              You do not have permission to modify this notebook.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const createdDate = new Date(notebook.created_at).toLocaleDateString();
  const updatedDate = new Date(notebook.updated_at).toLocaleDateString();

  return (
    <main className="min-h-screen bg-primary">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href={`/${notebookid}`}
            className="text-sm text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 mb-4"
          >
            ← Back to notebook
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-primary">
            Notebook Settings
          </h1>
          <p className="text-base text-secondary">{notebook.title}</p>
        </div>

        <div className="space-y-12">
          <NotebookSettingsForm notebook={notebook} />
          
          <div className="border-t border-color pt-8">
            <h2 className="text-xl font-semibold mb-6 text-primary">
              Notebook Information
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Notebook ID</dt>
                <dd className="text-sm text-primary font-mono">{notebook.notebook_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Status</dt>
                <dd className="text-sm text-primary capitalize">{notebook.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Created</dt>
                <dd className="text-sm text-primary">{createdDate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Last Updated</dt>
                <dd className="text-sm text-primary">{updatedDate}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-color pt-8">
            <DeleteConfirmation notebookId={notebookid} notebookTitle={notebook.title} />
          </div>
        </div>
      </div>
    </main>
  );
}

