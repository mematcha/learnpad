/**
 * Error message component for consistent error display
 */

interface ErrorMessageProps {
  message: string;
  title?: string;
}

export function ErrorMessage({ message, title = 'Error' }: ErrorMessageProps) {
  return (
    <div
      className="p-3 border border-red-500/50 rounded-md bg-red-900/20"
      role="alert"
      aria-live="polite"
    >
      <h3 className="text-sm font-semibold mb-0.5 text-red-400">{title}</h3>
      <p className="text-sm text-red-300">{message}</p>
    </div>
  );
}

