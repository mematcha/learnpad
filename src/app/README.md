# Learnpad Frontend

A comprehensive adaptive learning platform built with Next.js, TypeScript, and modern UI components.

## 🚀 Features Implemented

### ✅ Design System Foundation
- **Typography**: Roboto (primary) and JetBrains Mono (code) fonts
- **Theme System**: Dark, Light, and High Contrast modes with CSS variables
- **Component Library**: Radix UI primitives with Tailwind CSS styling
- **Icons**: Lucide React for consistent iconography

### ✅ Core UI Components
- **Button**: Multiple variants (default, outline, ghost, etc.) with size options
- **Input**: Accessible form inputs with proper focus management
- **Card**: Flexible card components for content organization
- **Dialog/Modal**: Accessible modal dialogs with focus trapping
- **Switch**: Toggle switches for settings
- **Tooltip**: Contextual help and information
- **Select**: Dropdown selections with keyboard navigation
- **Badge**: Status indicators and labels
- **Separator**: Visual content dividers
- **ScrollArea**: Custom scrollable areas

### ✅ Layout Architecture
- **App Shell**: Responsive layout with header, sidebar, and main content
- **Header**: Logo, workspace switcher, theme toggle, and user controls
- **Sidebar**: Collapsible navigation with project tree and quick actions
- **Status Bar**: Connection status, save indicators, and progress tracking

### ✅ Workspace Dashboard
- **Project Cards**: Visual project previews with metadata
- **Grid/List Views**: Flexible project organization
- **Search & Filter**: Find projects by name, tags, or content
- **Quick Stats**: Learning progress and activity metrics
- **Project Management**: Create, organize, and access learning projects

### ✅ Notebook Editor
- **Rich Text Editor**: Tiptap-based editor with formatting toolbar
- **Mathematical Notation**: KaTeX integration for LaTeX formulas
- **Cell-Based Structure**: Text and code cells like Jupyter notebooks
- **Real-time Editing**: Live preview and auto-save functionality
- **Toolbar**: Comprehensive formatting options (bold, italic, headings, lists, math)

### ✅ AI Assistant
- **Chat Interface**: Conversational AI assistant panel
- **Message History**: Persistent chat with copy and feedback options
- **Floating Panel**: Resizable, minimizable assistant window
- **Contextual Help**: Inline suggestions and adaptive recommendations
- **Voice & File Support**: Placeholder for multimedia interactions

### ✅ Code Sandbox
- **Monaco Editor**: VS Code-like editing experience with IntelliSense
- **Multi-Language Support**: JavaScript, TypeScript, Python, HTML, CSS, JSON, Markdown
- **Code Execution**: Simulated code running with output display
- **Language Templates**: Starter code for each supported language
- **Download & Reset**: Code management utilities

### ✅ Accessibility Features
- **WCAG Compliance**: Proper ARIA labels, focus management, and keyboard navigation
- **Skip Links**: Quick navigation for screen reader users
- **Keyboard Shortcuts**: Comprehensive hotkey system with help dialog
- **Screen Reader Support**: Announcements and semantic markup
- **High Contrast Mode**: Enhanced visibility theme option
- **Focus Management**: Proper tab order and focus trapping in modals

## 🛠 Technical Stack

### Core Technologies
- **Next.js 15**: App Router with Server Components
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS v4**: Utility-first styling with custom design tokens
- **Radix UI**: Accessible component primitives

### Rich Text & Code Editing
- **Tiptap**: Extensible rich text editor with mathematical notation
- **Monaco Editor**: Advanced code editing with IntelliSense
- **KaTeX**: Mathematical notation rendering
- **Syntax Highlighting**: Multi-language code support

### State Management & Utilities
- **Zustand**: Lightweight state management (ready for integration)
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling with validation
- **Class Variance Authority**: Type-safe component variants

## 📁 Project Structure

```
src/app/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Homepage with feature overview
│   ├── workspace/         # Project management dashboard
│   ├── notebook/          # Interactive notebook editor
│   └── sandbox/           # Code sandbox environment
├── components/
│   ├── ui/               # Reusable UI primitives
│   ├── layout/           # Application shell components
│   ├── workspace/        # Project management UI
│   ├── editor/           # Notebook and text editing
│   ├── ai/              # AI assistant components
│   ├── sandbox/         # Code execution environment
│   └── accessibility/   # A11y utilities and components
├── lib/
│   ├── themes/          # Theme configuration and provider
│   ├── utils/           # Utility functions and helpers
│   └── types/           # TypeScript type definitions
└── styles/
    └── globals.css      # Global styles and CSS variables
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue tones for main actions and branding
- **Secondary**: Purple accents for secondary actions
- **Success**: Green for positive feedback
- **Warning**: Amber for caution states
- **Error**: Red for error states
- **Muted**: Subtle grays for secondary content

### Typography Scale
- **Font Families**: Roboto (UI), JetBrains Mono (code)
- **Responsive Scaling**: 14px base with 1.25 ratio
- **Semantic Headings**: H1-H6 with consistent spacing

### Spacing & Layout
- **Grid System**: CSS Grid and Flexbox layouts
- **Responsive Breakpoints**: Mobile-first approach
- **Component Spacing**: Consistent padding and margins

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 🔧 Configuration

### Theme Customization
Themes are configured in `lib/themes/theme-config.ts` and can be extended with additional color schemes.

### Component Variants
Components use Class Variance Authority for type-safe variant management. Extend variants in individual component files.

### Accessibility Settings
Keyboard shortcuts and accessibility features are configured in `lib/utils/keyboard.ts` and can be customized per user preferences.

## 📱 Responsive Design

The application is fully responsive with:
- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Adapted layouts with collapsible elements
- **Mobile**: Essential features with optimized touch interactions

## 🎯 Next Steps

The frontend is now ready for backend integration:
1. **API Integration**: Connect to FastAPI backend services
2. **Authentication**: Implement user authentication and authorization
3. **Real AI Integration**: Connect to actual AI/ML services
4. **Code Execution**: Implement real code execution environments
5. **Data Persistence**: Connect to database for project storage
6. **Collaborative Features**: Add real-time collaboration capabilities

## 🧪 Testing

The codebase is structured for easy testing:
- **Component Testing**: Individual UI component tests
- **Integration Testing**: Feature workflow tests
- **Accessibility Testing**: A11y compliance verification
- **Performance Testing**: Core Web Vitals monitoring

---

Built with ❤️ for adaptive learning and educational excellence.