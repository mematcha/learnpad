/**
 * Hero section component with value proposition and call-to-action
 */

import Link from 'next/link';

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-3 text-primary">
          LearnPad
        </h1>
        <p className="text-lg mb-4 text-secondary">
          AI-powered adaptive learning system that delivers fully personalized,
          notebook-based educational content tailored to your experience level and
          learning goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/login"
            className="px-4 py-2 bg-primary text-secondary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] flex items-center justify-center"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            aria-label="Get started with LearnPad"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="px-4 py-2 border border-color rounded-md font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] flex items-center justify-center"
            aria-label="Learn more about features"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}

