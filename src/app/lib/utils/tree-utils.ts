/**
 * Utility functions for transforming file tree structures
 */

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  updated?: string;
  children?: FileTreeNode[];
}

export interface ApiTreeItem {
  type: 'file' | 'folder';
  path: string;
  size?: number;
  updated?: string;
  children?: Record<string, ApiTreeItem>;
}

/**
 * Transform API tree structure to react-arborist format
 * API returns: { "folder1": { type: "folder", children: {...} }, "file1.md": { type: "file", ... } }
 * react-arborist expects: [{ id: "...", name: "...", type: "...", children: [...] }]
 */
export function transformApiTreeToArborist(
  apiTree: Record<string, ApiTreeItem>,
  parentPath: string = ''
): FileTreeNode[] {
  const nodes: FileTreeNode[] = [];

  for (const [name, item] of Object.entries(apiTree)) {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    const nodeId = fullPath;

    const node: FileTreeNode = {
      id: nodeId,
      name,
      type: item.type,
      path: item.path,
      size: item.size,
      updated: item.updated,
    };

    if (item.type === 'folder' && item.children) {
      node.children = transformApiTreeToArborist(item.children, fullPath);
    }

    nodes.push(node);
  }

  // Sort: folders first, then files, both alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

