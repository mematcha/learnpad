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
import { TagInput } from './tag-input';

const notebookSettingsSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

type NotebookSettingsFormData = z.infer<typeof notebookSettingsSchema>;

interface NotebookSettingsFormProps {
  notebook: Notebook;
  showSharing?: boolean;
}

export function NotebookSettingsForm({ notebook, showSharing = true }: NotebookSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NotebookSettingsFormData>({
    resolver: zodResolver(notebookSettingsSchema),
    defaultValues: {
      title: notebook.title,
      subject: notebook.subject,
      tags: (notebook as any).tags || [],
    },
  });

  const tags = watch('tags') || [];

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
      <h2 className="text-xl font-semibold mb-8 text-primary">
        General Settings
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2 text-secondary"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              {...register('title')}
              className="w-full max-w-md px-4 py-2 bg-primary border border-color rounded-md text-base text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary min-h-[44px]"
              aria-label="Notebook title"
              aria-required="true"
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium mb-2 text-secondary"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              {...register('subject')}
              className="w-full max-w-md px-4 py-2 bg-primary border border-color rounded-md text-base text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary min-h-[44px]"
              aria-label="Notebook subject"
              aria-required="true"
            />
            {errors.subject && (
              <p className="text-xs text-red-400 mt-1" role="alert">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium mb-2 text-secondary"
            >
              Tags
            </label>
            <div className="w-full max-w-md">
              <TagInput
                tags={tags}
                onChange={(newTags) => setValue('tags', newTags)}
                placeholder="Add tags to help with search (press Enter or comma to add)"
                maxTags={20}
              />
            </div>
            {errors.tags && (
              <p className="text-xs text-red-400 mt-1" role="alert">
                {errors.tags.message}
              </p>
            )}
            <p className="text-xs text-secondary mt-1">
              Tags help you organize and find notebooks more easily
            </p>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div
            className="p-4 border border-green-500/50 rounded-md bg-green-900/20 text-sm text-green-400 max-w-md"
            role="alert"
            aria-live="polite"
          >
            Settings updated successfully
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-text-primary text-bg-primary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
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
        </div>
      </form>

      {showSharing && (
        <div className="border-t border-color mt-12 pt-8">
          <SharingControls notebook={notebook} />
        </div>
      )}
    </div>
  );
}

