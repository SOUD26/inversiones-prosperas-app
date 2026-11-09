import { esc, icono } from '../ui.js';

// Pantalla provisional: cada módulo se reemplaza cuando lo definamos.
export function vistaModulo(el, modulo) {
  el.innerHTML = `
    <a class="volver" href="#/">${icono('atras')} Menú</a>
    <div class="vacio">
      <span class="ico grande">${icono(modulo.icono)}</span>
      <h1>${esc(modulo.nombre)}</h1>
      <p>Módulo pendiente de definir.</p>
    </div>`;
}

export function vistaDenegado(el) {
  el.innerHTML = `
    <a class="volver" href="#/">${icono('atras')} Menú</a>
    <div class="vacio">
      <h1>Sin acceso</h1>
      <p>Tu usuario no tiene permiso para esta sección.</p>
    </div>`;
}
