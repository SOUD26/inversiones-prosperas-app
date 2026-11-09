import { db } from './supabase.js';

export const loginGoogle = () =>
  db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + location.pathname }
  });

export const loginCorreo = (email, password) =>
  db.auth.signInWithPassword({ email, password });

export const registrar = (email, password, nombre) =>
  db.auth.signUp({ email, password, options: { data: { full_name: nombre } } });

export const salir = () => db.auth.signOut();

export const obtenerSesion = async () => (await db.auth.getSession()).data.session;

export const alCambiarSesion = (cb) =>
  db.auth.onAuthStateChange((evento, sesion) => cb(evento, sesion));

// Perfil + lista de permisos del usuario
export async function cargarUsuario(userId) {
  const [p, q] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).single(),
    db.from('usuario_permisos').select('permiso').eq('user_id', userId)
  ]);
  if (p.error) throw p.error;
  if (q.error) throw q.error;
  return { perfil: p.data, permisos: new Set(q.data.map((x) => x.permiso)) };
}
