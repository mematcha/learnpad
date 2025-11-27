import { AppShell } from '@/components/layout';
import { NotebookView } from '@/components/editor/notebook-view';

export default function NotebookPage() {
  // Example content - in a real app, this would come from a database/API
  const notebookContent = `
    <h1>Welcome to Learnpad</h1>
    <p>This is your interactive notebook. You can read your learning materials here with clean, readable formatting.</p>
    
    <h2>Getting Started</h2>
    <p>This notebook view is optimized for reading and comprehension. The content is displayed with:</p>
    <ul>
      <li>Clear typography and spacing</li>
      <li>Mathematical notation support</li>
      <li>Code blocks with syntax highlighting</li>
      <li>Responsive layout for all devices</li>
    </ul>
    
    <h2>Mathematical Expressions</h2>
    <p>You can include mathematical formulas using LaTeX notation. For example, the quadratic formula:</p>
    <p class="math-node">$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$</p>
    
    <h2>Code Examples</h2>
    <p>Code blocks are displayed with proper formatting. You can run code cells by clicking the "Run" button:</p>
    <pre><code class="language-python">def hello_world():
    print("Hello, Learnpad!")
    return True

hello_world()</code></pre>
    
    <p>JavaScript code blocks are also supported:</p>
    <pre><code class="language-javascript">function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("Learnpad"));</code></pre>
    
    <h2>Best Practices</h2>
    <p>When creating notebook content, keep in mind:</p>
    <ol>
      <li>Use clear headings to organize your content</li>
      <li>Break up long paragraphs for better readability</li>
      <li>Include examples and code snippets where relevant</li>
      <li>Use lists to organize information</li>
    </ol>
  `;

  return (
    <AppShell>
      <NotebookView content={notebookContent} />
    </AppShell>
  );
}
