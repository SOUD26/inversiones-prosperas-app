// Los botones del menú. Para agregar uno nuevo:
// 1) agregarlo aquí, 2) agregar su permiso '<clave>.ver' en la tabla `permisos`.
export const MODULOS = [
  { clave: 'caja_chica', ruta: 'caja-chica', nombre: 'Caja chica', icono: 'caja' },
  { clave: 'personal',   ruta: 'personal',   nombre: 'Personal',   icono: 'personal' },
  { clave: 'planilla',   ruta: 'planilla',   nombre: 'Planilla',   icono: 'planilla' },
  { clave: 'compras',    ruta: 'compras',    nombre: 'Compras',    icono: 'compras' },
  { clave: 'bitacora',   ruta: 'bitacora',   nombre: 'Bitácora',   icono: 'bitacora' },
  { clave: 'eventos',    ruta: 'eventos',    nombre: 'Eventos',    icono: 'eventos' },
  { clave: 'pendientes', ruta: 'pendientes', nombre: 'Pendientes', icono: 'pendientes' }
];
