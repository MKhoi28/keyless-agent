import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

// Filesystem JSON store. Survives Next.js dev hot reload; in-memory stores reset on every file change.
// shortcut: plain JSON files, no locking — fine for a single-user demo, use a database for real users.
const DATA_DIR = join(process.cwd(), "data");

export function readJson<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, name), "utf-8"));
  } catch {
    return fallback;
  }
}

export function writeJson(name: string, value: unknown): void {
  const filePath = join(DATA_DIR, name);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export interface VaultEntry {
  id: string;
  label: string;
  ciphertext: string;
  createdAt: string;
}

export const readEntries = (userId: string) => readJson<VaultEntry[]>(`vault/${userId}.json`, []);
export const writeEntries = (userId: string, entries: VaultEntry[]) => writeJson(`vault/${userId}.json`, entries);

export interface OutboxMessage {
  to: string;
  from: string;
  label: string;
  body: string;
  sentAt: string;
}

export const readOutbox = (userId: string) => readJson<OutboxMessage[]>(`outbox/${userId}.json`, []);
export function sendMessage(userId: string, msg: Omit<OutboxMessage, "sentAt">) {
  writeJson(`outbox/${userId}.json`, [...readOutbox(userId), { ...msg, sentAt: new Date().toISOString() }]);
}
