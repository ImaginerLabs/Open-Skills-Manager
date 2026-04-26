import { open } from '@tauri-apps/plugin-dialog';
import type { ImportItem } from './ImportDialog';

export async function selectFolders(): Promise<ImportItem[]> {
  const selected = await open({
    directory: true,
    multiple: true,
    title: 'Select skill folder(s)',
  });

  if (!selected) return [];

  const paths = Array.isArray(selected) ? selected : [selected];
  return paths.map((path) => {
    const parts = path.split(/[/\\]/);
    const name = parts[parts.length - 1] ?? 'Unknown';
    return {
      id: crypto.randomUUID(),
      path,
      name,
      type: 'folder' as const,
      status: 'pending' as const,
    };
  });
}

export async function selectZipFiles(): Promise<ImportItem[]> {
  const selected = await open({
    multiple: true,
    filters: [{ name: 'Zip Files', extensions: ['zip'] }],
    title: 'Select skill zip file(s)',
  });

  if (!selected) return [];

  const paths = Array.isArray(selected) ? selected : [selected];
  return paths.map((path) => {
    const parts = path.split(/[/\\]/);
    const name = (parts[parts.length - 1] ?? 'Unknown').replace(/\.zip$/i, '');
    return {
      id: crypto.randomUUID(),
      path,
      name,
      type: 'zip' as const,
      status: 'pending' as const,
    };
  });
}

export function validateFolderName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * Process dropped file paths from Tauri's onDragDropEvent
 * This is the correct way to handle drag-drop in Tauri apps
 */
export function processDroppedPaths(paths: string[]): ImportItem[] {
  const items: ImportItem[] = [];

  for (const path of paths) {
    const parts = path.split(/[/\\]/);
    const name = parts[parts.length - 1] ?? 'Unknown';
    const isZip = name.toLowerCase().endsWith('.zip');
    const displayName = isZip ? name.replace(/\.zip$/i, '') : name;

    items.push({
      id: crypto.randomUUID(),
      path,
      name: displayName,
      type: isZip ? 'zip' : 'folder',
      status: 'pending',
    });
  }

  return items;
}

/**
 * @deprecated Use processDroppedPaths instead for Tauri apps
 * This function is kept for backwards compatibility but may not work correctly
 * because HTML5 FileList doesn't have reliable path information in Tauri
 */
export function processDroppedFiles(files: FileList): ImportItem[] {
  const items: ImportItem[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) {
      const isZip = file.name.toLowerCase().endsWith('.zip');
      const name = isZip ? file.name.replace(/\.zip$/i, '') : file.name;
      const path = (file as File & { path?: string }).path ?? file.name;
      items.push({
        id: crypto.randomUUID(),
        path,
        name,
        type: isZip ? 'zip' : 'folder',
        status: 'pending',
      });
    }
  }

  return items;
}