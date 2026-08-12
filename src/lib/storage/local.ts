import { mkdir, writeFile, readFile, unlink, access } from "fs/promises";
import path from "path";
import type { StorageAdapter } from "./types";

export function createLocalStorage(basePath: string): StorageAdapter {
  async function resolve(key: string) {
    const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
    const full = path.join(basePath, safe);
    await mkdir(path.dirname(full), { recursive: true });
    return full;
  }

  return {
    async put(key, data) {
      const full = await resolve(key);
      await writeFile(full, data);
    },
    async get(key) {
      try {
        const full = await resolve(key);
        return await readFile(full);
      } catch {
        return null;
      }
    },
    async delete(key) {
      try {
        const full = await resolve(key);
        await unlink(full);
      } catch {
        /* ignore */
      }
    },
    async exists(key) {
      try {
        const full = await resolve(key);
        await access(full);
        return true;
      } catch {
        return false;
      }
    },
  };
}
