'use client';

import * as React from 'react';
import { Search, FileText, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RecentProject {
  id: string;
  name: string;
  lastModified: Date;
  description?: string;
}

interface RecentProjectsListProps {
  projects?: RecentProject[];
  onProjectClick?: (project: RecentProject) => void;
  className?: string;
}

// Mock recent projects data
const mockProjects: RecentProject[] = [
  {
    id: '1',
    name: 'Introduction to Python',
    lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    description: 'Learn Python fundamentals with interactive examples',
  },
  {
    id: '2',
    name: 'Data Structures & Algorithms',
    lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    description: 'Master essential data structures and algorithmic thinking',
  },
  {
    id: '3',
    name: 'Machine Learning Basics',
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    description: 'Introduction to ML concepts, models, and practical applications',
  },
  {
    id: '4',
    name: 'Web Development with React',
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    description: 'Build modern web applications using React and TypeScript',
  },
  {
    id: '5',
    name: 'Advanced TypeScript',
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    description: 'Deep dive into TypeScript advanced features and patterns',
  },
  {
    id: '6',
    name: 'Database Design',
    lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    description: 'Learn database design principles and SQL optimization',
  },
  {
    id: '7',
    name: 'System Design',
    lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    description: 'Design scalable and distributed systems',
  },
  {
    id: '8',
    name: 'DevOps Fundamentals',
    lastModified: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
    description: 'Introduction to CI/CD, containers, and cloud infrastructure',
  },
];

export function RecentProjectsList({ 
  projects = mockProjects,
  onProjectClick,
  className 
}: RecentProjectsListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredProjects, setFilteredProjects] = React.useState<RecentProject[]>(projects);

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects.slice(0, 8));
    } else {
      const filtered = projects
        .filter((project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 8);
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleProjectClick = (project: RecentProject) => {
    onProjectClick?.(project);
  };

  return (
    <div className={cn('flex flex-col h-full w-full', className)}>
      {/* Search Bar */}
      <div className="mb-4 w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recent projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors',
                'hover:bg-muted/70 active:bg-muted',
                'border border-transparent hover:border-border'
              )}
            >
              <div className="flex-shrink-0">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{project.name}</div>
                {project.description && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {project.description}
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTime(project.lastModified)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {searchQuery ? 'No projects found' : 'No recent projects'}
          </div>
        )}
      </div>
    </div>
  );
}

