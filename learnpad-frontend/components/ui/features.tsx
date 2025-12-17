/**
 * Feature showcase component highlighting key features
 */

export function Features() {
  const features = [
    {
      title: 'Personalized Learning',
      description:
        'AI-powered assessment identifies your experience level and creates customized learning paths.',
    },
    {
      title: 'Interactive Notebooks',
      description:
        'Complete study notebooks with structured content, exercises, and progress tracking.',
    },
    {
      title: 'Adaptive Content',
      description:
        'Content evolves as you learn, building progressively on previous topics.',
    },
  ];

  return (
    <section id="features" className="py-6 px-4">
      <h2 className="text-2xl font-semibold mb-4 text-center text-primary">
        Key Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 border border-color rounded-md bg-secondary"
          >
            <h3 className="text-lg font-medium mb-1 text-primary">
              {feature.title}
            </h3>
            <p className="text-sm text-secondary">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

