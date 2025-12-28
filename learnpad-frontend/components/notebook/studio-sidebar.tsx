'use client';

/**
 * Studio sidebar component
 * Displays studio-related content and tools
 */

import { useState } from 'react';

interface StudioSidebarProps {
  notebookId: string;
}

export function StudioSidebar({ notebookId }: StudioSidebarProps) {
  const [isStudioExpanded, setIsStudioExpanded] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');

  const studioItems = [
    'Quizzes',
    'Flashcards',
    'Slides',
    'Labs',
    'Mindmaps',
  ];

  const isDifficultyBased = selectedItem === 'Quizzes' || selectedItem === 'Flashcards';
  const isStyleBased = selectedItem === 'Slides' || selectedItem === 'Mindmaps';

  const difficultyOptions = ['EASY', 'MEDIUM', 'HARD'];
  const styleOptions = ['LIGHT', 'DENSE'];

  const handleItemClick = (item: string) => {
    setSelectedItem(item);
    setPrompt(''); // Clear prompt when switching items
    // Set default option based on item type
    if (item === 'Quizzes' || item === 'Flashcards') {
      setSelectedOption('MEDIUM');
    } else if (item === 'Slides' || item === 'Mindmaps') {
      setSelectedOption('LIGHT');
    } else {
      setSelectedOption('');
    }
  };

  const handleGenerate = () => {
    // Handle generate - can be implemented later
    const options = {
      item: selectedItem,
      prompt,
      ...(isDifficultyBased && { difficulty: selectedOption }),
      ...(isStyleBased && { style: selectedOption }),
    };
    console.log('Generating with options:', options);
  };

  const handleBack = () => {
    setSelectedItem(null);
    setPrompt('');
  };

  return (
    <nav
      className="border border-color rounded-md bg-secondary p-4 h-full overflow-y-auto flex flex-col"
      aria-label="Studio sidebar"
    >
      {/* Studio Section */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setIsStudioExpanded(!isStudioExpanded)}
          className="w-full text-left text-sm font-semibold mb-3 text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 rounded flex items-center gap-2 py-1"
          aria-expanded={isStudioExpanded}
          aria-label="Toggle Studio section"
        >
          <span className="text-xs" aria-hidden="true">
            {isStudioExpanded ? '▼' : '▶'}
          </span>
          <span>Studio</span>
        </button>
        {isStudioExpanded && (
          <div className="flex flex-col gap-4">
            {selectedItem ? (
              <>
                {/* Back button */}
                <button
                  onClick={handleBack}
                  className="text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1 self-start"
                  aria-label="Back to studio items"
                >
                  ← Back
                </button>

                {/* Selected item header */}
                <h3 className="text-sm font-semibold text-primary">
                  {selectedItem}
                </h3>

                {/* Divider */}
                <div className="border-t border-color my-2" />

                {/* Radio button options */}
                {(isDifficultyBased || isStyleBased) && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-secondary">
                      {isDifficultyBased ? 'Difficulty' : 'Style'}
                    </label>
                    <div className="flex gap-2">
                      {(isDifficultyBased ? difficultyOptions : styleOptions).map((option) => (
                        <label
                          key={option}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-color rounded-md cursor-pointer transition-colors hover:bg-primary hover:bg-opacity-10 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:ring-offset-2"
                        >
                          <input
                            type="radio"
                            name={isDifficultyBased ? 'difficulty' : 'style'}
                            value={option}
                            checked={selectedOption === option}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="sr-only"
                          />
                          <span
                            className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                              selectedOption === option
                                ? 'border-primary bg-primary'
                                : 'border-color'
                            }`}
                          >
                            {selectedOption === option && (
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            )}
                          </span>
                          <span className={selectedOption === option ? 'text-primary' : 'text-secondary'}>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Textarea for prompting */}
                <div className="flex-shrink-0 w-full">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Enter your prompt for generating ${selectedItem.toLowerCase()}...`}
                    className="w-full px-3 py-2 text-sm text-primary bg-primary bg-opacity-10 border border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 placeholder:text-secondary resize-y min-h-[200px]"
                    aria-label={`Prompt for ${selectedItem}`}
                  />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  className="w-full px-4 py-2.5 text-sm font-medium text-bg-primary bg-text-primary rounded-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  aria-label={`Generate ${selectedItem}`}
                  disabled={!prompt.trim()}
                >
                  Generate {selectedItem}
                </button>
              </>
            ) : (
              <>
                {/* 2x3 Grid of Buttons */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  {studioItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleItemClick(item)}
                      className="w-full min-w-0 px-2 py-2 text-xs font-medium text-primary bg-primary bg-opacity-10 hover:bg-opacity-20 border border-color rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 truncate"
                      aria-label={`Open ${item}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-color my-2" />

                {/* Search Bar */}
                <div className="flex-shrink-0 w-full">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full px-3 py-2 text-sm text-primary bg-primary bg-opacity-10 border border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 placeholder:text-secondary"
                    aria-label="Search studio items"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

