import { accessSync, type PathLike } from 'node:fs';

/**
 * Checks if a file path is accessible.
 * @example
 * access('./package.json');
 */
export function access(path: PathLike) {
  try {
    accessSync(path);
    return true;
  } catch {
    return false;
  }
}
