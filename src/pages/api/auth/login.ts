import type { APIRoute } from 'astro';
import { loginUser } from '../../../lib/auth';
import { createSession } from '../../../lib/session';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString().trim();
    const password = formData.get('password')?.toString() ?? '';
    const redirectTo = formData.get('redirect')?.toString() ?? '/';

    if (!email || !password) {
      return redirect(`/login?error=${encodeURIComponent('Email y contraseña requeridos')}`);
    }

    const user = await loginUser(email, password);
    if (!user) {
      return redirect(`/login?error=${encodeURIComponent('Credenciales invalidas')}`);
    }

    const token = await createSession(user);

    const secure = new URL(request.url).protocol === 'https:';
    cookies.set('session', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return redirect(redirectTo);
  } catch (err) {
    console.error('Login error:', err);
    return redirect('/login?error=' + encodeURIComponent('Error interno'));
  }
};
