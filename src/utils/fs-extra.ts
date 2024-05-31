import { accessSync, type PathLike } from 'node:fs';

export function access(path: PathLike) {
  try {
    accessSync(path);
    return true;
  } catch {
    return false;
  }
}
