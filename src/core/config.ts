import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { M365Config } from './types.js';

const CONFIG_DIR = join(homedir(), '.m365');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const TOKEN_CACHE_FILE = join(CONFIG_DIR, 'token-cache.json');

export const DEFAULT_CLIENT_ID = process.env.M365_CLIENT_ID ?? '';
export const DEFAULT_TENANT_ID = process.env.M365_TENANT_ID ?? 'common';

// Default Microsoft Graph scopes for productivity use-cases
export const DEFAULT_SCOPES = [
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.ReadWrite',
  'Files.ReadWrite',
  'Contacts.ReadWrite',
  'User.Read',
  'offline_access',
];

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getTokenCachePath(): string {
  return TOKEN_CACHE_FILE;
}

export async function loadConfig(): Promise<M365Config | null> {
  try {
    const content = await readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as M365Config;
  } catch {
    return null;
  }
}

export async function saveConfig(config: M365Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

export async function deleteConfig(): Promise<void> {
  try {
    await rm(CONFIG_FILE);
  } catch { /* already gone */ }
  try {
    await rm(TOKEN_CACHE_FILE);
  } catch { /* already gone */ }
}

export async function loadTokenCache(): Promise<string> {
  try {
    return await readFile(TOKEN_CACHE_FILE, 'utf-8');
  } catch {
    return '';
  }
}

export async function saveTokenCache(data: string): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(TOKEN_CACHE_FILE, data, { mode: 0o600 });
}
