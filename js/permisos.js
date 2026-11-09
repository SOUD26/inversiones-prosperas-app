// Estado del usuario en sesión + preguntas de acceso.
// OJO: esto solo decide qué se MUESTRA. La protección real de los datos
// la hacen las políticas RLS en Supabase (ver supabase/schema.sql).
let usuario = null; // { perfil, permisos:Set }

export const fijarUsuario = (u) => { usuario = u; };
export const usuarioActual = () => usuario;

export const esAdmin = () =>
  !!usuario && usuario.perfil.activo && usuario.perfil.es_admin;

export const puede = (clave) =>
  !!usuario && usuario.perfil.activo &&
  (usuario.perfil.es_admin || usuario.permisos.has(clave));
