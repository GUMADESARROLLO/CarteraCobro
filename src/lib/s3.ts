import * as Minio from 'minio';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvVar(name: string): string {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      if (key === name) {
        let val = trimmed.slice(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        return val;
      }
    }
  } catch (e: any) {
    throw new Error(`Error leyendo .env: ${e.message}`);
  }
  throw new Error(`Variable ${name} no encontrada en .env`);
}

let _client: Minio.Client | null = null;
let _bucket: string | null = null;

function ensure(): { client: Minio.Client; bucket: string } {
  if (!_client || !_bucket) {
    const endpoint = loadEnvVar('AWS_ENDPOINT');
    const parsed = new URL(endpoint);
    _client = new Minio.Client({
      endPoint: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80),
      useSSL: parsed.protocol === 'https:',
      accessKey: loadEnvVar('AWS_ACCESS_KEY_ID'),
      secretKey: loadEnvVar('AWS_SECRET_ACCESS_KEY'),
    });
    _bucket = loadEnvVar('AWS_BUCKET');
  }
  return { client: _client, bucket: _bucket };
}

export async function getPresignedUrl(filename: string): Promise<string> {
  const { client, bucket } = ensure();
  return client.presignedGetObject(bucket, `Recibos/${filename}`, 24 * 60 * 60);
}

export async function getPresignedUrls(filenames: string[]): Promise<{ url: string; name: string }[]> {
  return Promise.all(
    filenames.map(async (name) => {
      const url = await getPresignedUrl(name);
      return { url, name };
    })
  );
}
