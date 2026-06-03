import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env'), debug: false });

export function getEnv(name: string): string {
  return process.env[name] || '';
}
