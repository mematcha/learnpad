'use client';

/**
 * Profile form component using react-hook-form
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/api/user';
import type { User } from '@/types/entities';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-message';

const profileSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  notifications_enabled: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
  settings?: {
    theme: 'dark' | 'light' | 'system';
    notifications_enabled: boolean;
  };
}

export function ProfileForm({ user, settings }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      theme: settings?.theme || 'dark',
      notifications_enabled: settings?.notifications_enabled ?? true,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(data);
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg">
      <div>
        <h2 className="text-lg font-semibold mb-3 text-primary">
          Account Information
        </h2>
        <div className="space-y-md">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-0.5 text-secondary"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="w-full px-3 py-1 bg-primary border border-color rounded-md text-sm text-secondary cursor-not-allowed"
              aria-label="Email address (read-only)"
            />
            <p className="text-xs text-secondary mt-xs">
              Email is managed by Google OAuth
            </p>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-0.5 text-secondary"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={user.name}
              disabled
              className="w-full px-3 py-1 bg-primary border border-color rounded-md text-sm text-secondary cursor-not-allowed"
              aria-label="Name (read-only)"
            />
            <p className="text-xs text-secondary mt-xs">
              Name is managed by Google OAuth
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 text-primary">
          Preferences
        </h2>
        <div className="space-y-md">
          <div>
            <label
              htmlFor="theme"
              className="block text-sm font-medium mb-0.5 text-secondary"
            >
              Theme
            </label>
            <select
              id="theme"
              {...register('theme')}
              className="w-full px-3 py-1 bg-primary border border-color rounded-md text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
              aria-label="Select theme preference"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
            {errors.theme && (
              <p className="text-xs text-red-400 mt-xs" role="alert">
                {errors.theme.message}
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('notifications_enabled')}
                className="w-4 h-4 rounded border-color bg-primary text-primary focus:ring-2 focus:ring-primary"
                aria-label="Enable notifications"
              />
              <span className="text-sm text-secondary">
                Enable notifications
              </span>
            </label>
            {errors.notifications_enabled && (
              <p className="text-xs text-red-400 mt-xs" role="alert">
                {errors.notifications_enabled.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div
          className="p-3 border border-green-500/50 rounded-md bg-green-900/20 text-sm text-green-400"
          role="alert"
          aria-live="polite"
        >
          Profile updated successfully
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-text-primary text-bg-primary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
        aria-label="Save profile settings"
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
  );
}

