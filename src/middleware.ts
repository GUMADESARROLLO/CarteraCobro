import { defineMiddleware } from 'astro:middleware';
import { validateSession, type SessionUser } from './lib/session';
import { initDatabase } from './lib/db';

let dbInitialized = false;

export const onRequest = defineMiddleware(async (context, next) => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }

  const publicPaths = ['/login', '/api/auth/login'];
  const isPublic =
    publicPaths.includes(context.url.pathname) ||
    context.url.pathname.startsWith('/_astro');

  const token = context.cookies.get('session')?.value;

  if (token) {
    const user = await validateSession(token);
    if (user) {
      context.locals.user = user;
      context.locals.session = token;
    } else {
      context.cookies.delete('session', { path: '/' });
    }
  }

  if (!isPublic && !context.locals.user) {
    if (context.url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }

  return next();
});
