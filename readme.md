# Inversiones Prósperas · Base (login, roles, menú)

JavaScript puro, sin instalar nada. Base de datos y login en Supabase.

## Puesta en marcha

1. **Supabase**: crea un proyecto. En *SQL Editor* pega y ejecuta `supabase/schema.sql`.
2. **Claves**: en *Project Settings > API* copia `Project URL` y la clave `anon`, y pégalas en `js/config.js`.
3. **Google**: *Authentication > Providers > Google*. Necesita un Client ID y Secret creados en Google Cloud Console
   (tipo "Aplicación web"). Como URI de redirección autorizada usa la que Supabase te muestra en esa pantalla.
4. **URLs permitidas**: *Authentication > URL Configuration*. Agrega `http://localhost:5173` en *Redirect URLs*.
5. **Correr la app**: desde esta carpeta ejecuta `python3 -m http.server 5173` y abre http://localhost:5173
6. **Primer admin**: entra una vez, quedarás "pendiente". Luego en el SQL Editor ejecuta (con tu correo):
   `update public.profiles set es_admin = true, activo = true where email = 'TU_CORREO@gmail.com';`

## Estructura

- `js/modulos.js`: botones del menú (agregar uno = una línea + un permiso en la tabla `permisos`)
- `js/vistas/`: una pantalla por archivo (login, menu, admin, modulo)
- `js/permisos.js`: `puede('caja_chica.ver')`
- `supabase/schema.sql`: tablas, trigger de alta y políticas de seguridad (RLS)

## Regla de oro

Ocultar botones no protege nada. Cada tabla nueva debe llevar su política RLS con
`public.tiene_permiso('<modulo>.ver')`.
