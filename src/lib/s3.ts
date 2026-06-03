import * as Minio from 'minio';
import './env';

let _client: Minio.Client | null = null;
let _bucket: string | null = null;

function ensure(): { client: Minio.Client; bucket: string } {
  if (!_client || !_bucket) {
    const endpoint = process.env.AWS_ENDPOINT || '';
    const parsed = new URL(endpoint);
    _client = new Minio.Client({
      endPoint: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80),
      useSSL: parsed.protocol === 'https:',
      accessKey: process.env.AWS_ACCESS_KEY_ID || '',
      secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    });
    _bucket = process.env.AWS_BUCKET || '';
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
