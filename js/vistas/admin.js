import { db } from '../supabase.js';
import { esc, icono, toast } from '../ui.js';
import { usuarioActual } from '../permisos.js';
import { MODULOS } from '../modulos.js';

export async function vistaAdmin(el) {
  el.innerHTML = `
    <a class="volver" href="#/">${icono('atras')} Menú</a>
    <div class="saludo">
      <h1>Panel de accesos</h1>
      <p>Marca qué puede ver cada usuario. Los cambios se guardan al instante.</p>
    </div>
    <div class="admin">
      <aside class="lista" id="lista"></aside>
      <section class="panel" id="panel"></section>
    </div>`;
  const lista = el.querySelector('#lista');
  const panel = el.querySelector('#panel');

  const [u, c, p] = await Promise.all([
    db.from('profiles').select('*').order('creado'),
    db.from('permisos').select('*').order('clave'),
    db.from('usuario_permisos').select('user_id, permiso')
  ]);
  const fallo = u.error || c.error || p.error;
  if (fallo) {
    panel.innerHTML = `<p class="msg">${esc(fallo.message)}</p>`;
    return;
  }

  const usuarios = u.data;
  const catalogo = c.data;
  const mapa = new Map(); // user_id -> Set de permisos
  p.data.forEach((x) => {
    if (!mapa.has(x.user_id)) mapa.set(x.user_id, new Set());
    mapa.get(x.user_id).add(x.permiso);
  });

  const yo = usuarioActual().perfil.id;
  // Primero los pendientes de aprobar; si no hay, el primer usuario que no soy yo
  let sel = (usuarios.find((x) => !x.activo)
    ?? usuarios.find((x) => x.id !== yo)
    ?? usuarios[0])?.id;

  function pintarLista() {
    lista.innerHTML = usuarios.map((x) => `
      <button class="fila ${x.id === sel ? 'activa' : ''}" data-id="${esc(x.id)}" type="button">
        <span class="avatar">${esc((x.nombre || x.email || '?').trim()[0]?.toUpperCase() ?? '?')}</span>
        <span class="datos"><strong>${esc(x.nombre || x.email)}</strong><small>${esc(x.email)}</small></span>
        ${!x.activo ? '<span class="etiqueta pendiente">Pendiente</span>'
          : x.es_admin ? '<span class="etiqueta admin">Admin</span>' : ''}
      </button>`).join('');
    lista.querySelectorAll('.fila').forEach((b) => {
      b.onclick = () => { sel = b.dataset.id; pintarLista(); pintarPanel(); };
    });
  }

  async function actualizarPerfil(x, cambio) {
    const { data, error } = await db.from('profiles').update(cambio).eq('id', x.id).select();
    if (error || !data?.length) toast('No se pudo guardar' + (error ? ': ' + error.message : ''), 'error');
    else { Object.assign(x, data[0]); toast('Guardado'); }
    pintarLista();
    pintarPanel();
  }

  async function alternar(x, clave, marcado) {
    const { error } = marcado
      ? await db.from('usuario_permisos').insert({ user_id: x.id, permiso: clave })
      : await db.from('usuario_permisos').delete().eq('user_id', x.id).eq('permiso', clave);
    if (error) { toast('No se pudo guardar: ' + error.message, 'error'); pintarPanel(); return; }
    const s = mapa.get(x.id) ?? new Set();
    if (marcado) s.add(clave); else s.delete(clave);
    mapa.set(x.id, s);
    toast('Guardado');
  }

  async function marcarTodos(x, marcar) {
    const actuales = mapa.get(x.id) ?? new Set();
    let error;
    if (marcar) {
      const faltan = catalogo.map((q) => q.clave).filter((k) => !actuales.has(k));
      if (faltan.length) ({ error } = await db.from('usuario_permisos')
        .insert(faltan.map((k) => ({ user_id: x.id, permiso: k }))));
    } else {
      ({ error } = await db.from('usuario_permisos').delete().eq('user_id', x.id));
    }
    if (error) toast('No se pudo guardar: ' + error.message, 'error');
    else { mapa.set(x.id, marcar ? new Set(catalogo.map((q) => q.clave)) : new Set()); toast('Guardado'); }
    pintarPanel();
  }

  function pintarPanel() {
    const x = usuarios.find((z) => z.id === sel);
    if (!x) { panel.innerHTML = '<p class="nota">No hay usuarios todavía.</p>'; return; }
    const marcados = mapa.get(x.id) ?? new Set();
    const soyYo = x.id === yo;

    const grupos = new Map();
    catalogo.forEach((pm) => {
      if (!grupos.has(pm.modulo)) grupos.set(pm.modulo, []);
      grupos.get(pm.modulo).push(pm);
    });

    panel.innerHTML = `
      <div>
        <h2>${esc(x.nombre || x.email)}</h2>
        <p class="nota">${esc(x.email)}</p>
      </div>
      <div class="interruptores">
        <label class="interruptor">
          <input type="checkbox" id="activo" ${x.activo ? 'checked' : ''} ${soyYo ? 'disabled' : ''}>
          <span class="pista"></span><span>Cuenta activa</span>
        </label>
        <label class="interruptor">
          <input type="checkbox" id="admin" ${x.es_admin ? 'checked' : ''} ${soyYo ? 'disabled' : ''}>
          <span class="pista"></span><span>Administrador (acceso total)</span>
        </label>
      </div>
      ${soyYo ? '<p class="nota">No puedes quitarte tu propio acceso de administrador.</p>' : ''}
      <div class="permisos-cab">
        <h3>Accesos del menú</h3>
        ${x.es_admin ? '' : `<div class="acciones">
          <button class="enlace" id="todos" type="button">Marcar todos</button>
          <button class="enlace" id="ninguno" type="button">Quitar todos</button></div>`}
      </div>
      ${x.es_admin ? '<p class="nota">Los administradores ven todo; las casillas individuales no aplican.</p>' : ''}
      <div class="checklist ${x.es_admin ? 'bloqueado' : ''}">
        ${[...grupos].map(([mod, items]) => {
          const m = MODULOS.find((k) => k.clave === mod);
          return `<div class="grupo"><h4>${esc(m?.nombre ?? mod)}</h4>
            ${items.map((pm) => `
              <label class="casilla">
                <input type="checkbox" data-permiso="${esc(pm.clave)}" ${marcados.has(pm.clave) ? 'checked' : ''} ${x.es_admin ? 'disabled' : ''}>
                <span class="marca-casilla"></span><span>${esc(pm.descripcion)}</span>
              </label>`).join('')}
          </div>`;
        }).join('')}
      </div>`;

    panel.querySelector('#activo').onchange = (e) => actualizarPerfil(x, { activo: e.target.checked });
    panel.querySelector('#admin').onchange = (e) => actualizarPerfil(x, { es_admin: e.target.checked });
    panel.querySelectorAll('[data-permiso]').forEach((i) => {
      i.onchange = () => alternar(x, i.dataset.permiso, i.checked);
    });
    panel.querySelector('#todos')?.addEventListener('click', () => marcarTodos(x, true));
    panel.querySelector('#ninguno')?.addEventListener('click', () => marcarTodos(x, false));
  }

  pintarLista();
  pintarPanel();
}
