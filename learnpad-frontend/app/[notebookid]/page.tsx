import { getServerUser } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import { NotebookView } from '@/components/notebook/notebook-view';
import type { Notebook, FileTree } from '@/types/entities';

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
 * Generate dummy file tree for a notebook
 */
function getDummyFileTree(notebookId: string): FileTree {
  return {
    notebook_id: notebookId,
    root: {
      name: 'root',
      type: 'directory',
      path: '/',
      children: [
        {
          name: 'README.md',
          type: 'file',
          path: '/README.md',
          size: 2048,
          modified_at: new Date().toISOString(),
        },
        {
          name: 'chapters',
          type: 'directory',
          path: '/chapters',
          children: [
            {
              name: '01-introduction.md',
              type: 'file',
              path: '/chapters/01-introduction.md',
              size: 5120,
              modified_at: new Date().toISOString(),
            },
            {
              name: '02-fundamentals.md',
              type: 'file',
              path: '/chapters/02-fundamentals.md',
              size: 8192,
              modified_at: new Date().toISOString(),
            },
            {
              name: '03-advanced.md',
              type: 'file',
              path: '/chapters/03-advanced.md',
              size: 6144,
              modified_at: new Date().toISOString(),
            },
          ],
        },
        {
          name: 'examples',
          type: 'directory',
          path: '/examples',
          children: [
            {
              name: 'example1.py',
              type: 'file',
              path: '/examples/example1.py',
              size: 1024,
              modified_at: new Date().toISOString(),
            },
            {
              name: 'example2.py',
              type: 'file',
              path: '/examples/example2.py',
              size: 1536,
              modified_at: new Date().toISOString(),
            },
          ],
        },
        {
          name: 'resources',
          type: 'directory',
          path: '/resources',
          children: [
            {
              name: 'references.md',
              type: 'file',
              path: '/resources/references.md',
              size: 3072,
              modified_at: new Date().toISOString(),
            },
          ],
        },
      ],
    },
  };
}

/**
 * Get dummy file content map
 */
function getDummyFileContents(): Record<string, string> {
  return {
    '/README.md': `# Introduction to Machine Learning

Welcome to this comprehensive guide on **Machine Learning**!

This notebook covers:
- Basic concepts and terminology
- Supervised and unsupervised learning
- Practical examples and code snippets

## Getting Started

To get started, navigate through the chapters using the file tree on the left.

## Table of Contents

1. [Introduction](./chapters/01-introduction.md)
2. [Fundamentals](./chapters/02-fundamentals.md)
3. [Advanced Topics](./chapters/03-advanced.md)
`,

    '/chapters/01-introduction.md': `# Chapter 1: Introduction to Machine Learning

## What is Machine Learning?

**Machine Learning** is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

### Key Concepts

- **Training Data**: The dataset used to teach the model
- **Model**: The algorithm that makes predictions
- **Features**: Input variables used for prediction
- **Labels**: The output we want to predict

## Types of Machine Learning

### Supervised Learning
Learning with labeled examples. The algorithm learns from input-output pairs.

### Unsupervised Learning
Finding patterns in data without labeled examples.

### Reinforcement Learning
Learning through interaction with an environment, receiving rewards or penalties.
`,

    '/chapters/02-fundamentals.md': `# Chapter 2: Fundamentals

## Linear Regression

Linear regression is one of the simplest machine learning algorithms.

### Formula

\`\`\`
y = mx + b
\`\`\`

Where:
- **y** is the predicted value
- **m** is the slope
- **x** is the input feature
- **b** is the y-intercept

## Classification

Classification involves predicting discrete categories.

### Common Algorithms

1. **Logistic Regression**: For binary classification
2. **Decision Trees**: Tree-based models
3. **Support Vector Machines**: For complex boundaries
`,

    '/chapters/03-advanced.md': `# Chapter 3: Advanced Topics

## Neural Networks

Neural networks are inspired by the human brain and consist of interconnected nodes (neurons).

### Architecture

- **Input Layer**: Receives the input features
- **Hidden Layers**: Process the information
- **Output Layer**: Produces the final prediction

## Deep Learning

Deep learning uses neural networks with multiple hidden layers to learn complex patterns.

### Applications

- Image recognition
- Natural language processing
- Speech recognition
`,

    '/examples/example1.py': `# Example 1: Simple Linear Regression

import numpy as np
from sklearn.linear_model import LinearRegression

# Sample data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

# Create and train the model
model = LinearRegression()
model.fit(X, y)

# Make a prediction
prediction = model.predict([[6]])
print(f"Prediction for x=6: {prediction[0]}")
`,

    '/examples/example2.py': `# Example 2: Classification with Decision Tree

from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris

# Load the iris dataset
iris = load_iris()
X, y = iris.data, iris.target

# Create and train the classifier
clf = DecisionTreeClassifier()
clf.fit(X, y)

# Make predictions
predictions = clf.predict(X[:5])
print(f"Predictions: {predictions}")
`,

    '/resources/references.md': `# References and Resources

## Books

1. "Hands-On Machine Learning" by Aurélien Géron
2. "Pattern Recognition and Machine Learning" by Christopher Bishop

## Online Resources

- [Scikit-learn Documentation](https://scikit-learn.org/)
- [TensorFlow Tutorials](https://www.tensorflow.org/tutorials)
- [Kaggle Learn](https://www.kaggle.com/learn)

## Papers

- "Deep Residual Learning for Image Recognition" (2015)
- "Attention Is All You Need" (2017)
`,
  };
}

interface NotebookPageProps {
  params: Promise<{ notebookid: string }>;
}

/**
 * Notebook detail page
 * Shows notebook content with file tree and markdown rendering
 */
export default async function NotebookPage({ params }: NotebookPageProps) {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/login');
  }

  const { notebookid } = await params;
  
  // Get dummy notebook data
  const notebook = getDummyNotebook(notebookid);
  
  const fileTree = getDummyFileTree(notebookid);
  const fileContents = getDummyFileContents();

  if (!notebook) {
    // If notebook not found, show a generic one
    return (
      <NotebookView
        notebook={{
          notebook_id: notebookid,
          user_id: user.user_id,
          title: 'Sample Notebook',
          subject: 'General',
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_shared: false,
        }}
        fileTree={fileTree}
        fileContents={fileContents}
      />
    );
  }

  return (
    <NotebookView
      notebook={notebook}
      fileTree={fileTree}
      fileContents={fileContents}
    />
  );
}
