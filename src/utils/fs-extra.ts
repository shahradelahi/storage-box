import { promises, type PathLike } from 'node:fs';

export async function access(path: PathLike) {
  try {
    await promises.access(path);
    return true;
  } catch {
    return false;
  }
}
