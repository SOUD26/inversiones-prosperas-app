import { MODULOS } from '../modulos.js';
import { puede, esAdmin } from '../permisos.js';
import { esc, icono } from '../ui.js';

export function vistaMenu(el) {
  const visibles = MODULOS.filter((m) => puede(m.clave + '.ver'));
  const admin = esAdmin();

  const tiles = visibles.map((m) => `
    <a class="tile" href="#/${m.ruta}">
      <span class="ico">${icono(m.icono)}</span>
      <span class="nombre">${esc(m.nombre)}</span>
    </a>`).join('');

  const tileAdmin = admin ? `
    <a class="tile tile-admin" href="#/admin">
      <span class="ico">${icono('admin')}</span>
      <span class="nombre">Panel de accesos</span>
    </a>` : '';

  el.innerHTML = `
    <div class="saludo">
      <h1>Menú principal</h1>
      <p>Elige un módulo para trabajar.</p>
    </div>
    ${tiles || tileAdmin
      ? `<nav class="grilla">${tiles}${tileAdmin}</nav>`
      : `<div class="vacio"><h2>Aún no tienes accesos</h2><p>Pide al administrador que active tus módulos.</p></div>`}`;
}
