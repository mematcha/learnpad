'use client';

/**
 * Notebook settings form component
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateNotebookSettings } from '@/lib/api/notebooks';
import type { Notebook } from '@/types/entities';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-message';
import { SharingControls } from './sharing-controls';

const notebookSettingsSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1),
});

type NotebookSettingsFormData = z.infer<typeof notebookSettingsSchema>;

interface NotebookSettingsFormProps {
  notebook: Notebook;
}

export function NotebookSettingsForm({ notebook }: NotebookSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NotebookSettingsFormData>({
    resolver: zodResolver(notebookSettingsSchema),
    defaultValues: {
      title: notebook.title,
      subject: notebook.subject,
    },
  });

  const onSubmit = async (data: NotebookSettingsFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await updateNotebookSettings(notebook.notebook_id, data);
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update notebook settings'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-primary">
        Notebook Information
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium mb-0.5 text-secondary"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            {...register('title')}
            className="w-full px-3 py-1 bg-primary border border-color rounded-md text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
            aria-label="Notebook title"
            aria-required="true"
          />
          {errors.title && (
            <p className="text-xs text-red-400 mt-xs" role="alert">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium mb-0.5 text-secondary"
          >
            Subject
          </label>
          <input
            type="text"
            id="subject"
            {...register('subject')}
            className="w-full px-3 py-1 bg-primary border border-color rounded-md text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
            aria-label="Notebook subject"
            aria-required="true"
          />
          {errors.subject && (
            <p className="text-xs text-red-400 mt-xs" role="alert">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <SharingControls notebook={notebook} />
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div
            className="p-3 border border-green-500/50 rounded-md bg-green-900/20 text-sm text-green-400"
            role="alert"
            aria-live="polite"
          >
            Settings updated successfully
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-text-primary text-bg-primary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
          aria-label="Save notebook settings"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
}

