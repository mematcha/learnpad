import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server-auth';
import { getNotebook } from '@/lib/api/notebooks';
import { NotebookSettingsForm } from '@/components/notebook/notebook-settings-form';
import { DeleteConfirmation } from '@/components/notebook/delete-confirmation';

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

  try {
    const notebookData = await getNotebook(notebookid);

    // Check ownership
    if (!notebookData.can_edit) {
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

    return (
      <main className="min-h-screen bg-primary">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="mb-4">
            <Link
              href={`/${notebookid}`}
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              ← Back to notebook
            </Link>
            <h1 className="text-2xl font-bold mt-md mb-1 text-primary">
              Notebook Settings
            </h1>
            <p className="text-sm text-secondary">{notebookData.notebook.title}</p>
          </div>

          <div className="bg-secondary border border-color rounded-md p-4 mb-4">
            <NotebookSettingsForm notebook={notebookData.notebook} />
          </div>

          <div className="border-t border-color pt-lg">
            <DeleteConfirmation notebookId={notebookid} notebookTitle={notebookData.notebook.title} />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    notFound();
  }
}

