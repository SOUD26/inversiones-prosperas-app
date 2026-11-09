import { obtenerSesion, alCambiarSesion, cargarUsuario, salir } from './auth.js';
import { fijarUsuario, usuarioActual, puede, esAdmin } from './permisos.js';
import { MODULOS } from './modulos.js';
import { esc, icono } from './ui.js';
import { vistaLogin } from './vistas/login.js';
import { vistaMenu } from './vistas/menu.js';
import { vistaModulo, vistaDenegado } from './vistas/modulo.js';
import { vistaAdmin } from './vistas/admin.js';

const app = document.getElementById('app');
let idActual = null;
let shellListo = false;

async function iniciar() {
  shellListo = false;
  const sesion = await obtenerSesion();
  if (!sesion) {
    idActual = null;
    fijarUsuario(null);
    return vistaLogin(app);
  }
  idActual = sesion.user.id;
  try {
    fijarUsuario(await cargarUsuario(idActual));
  } catch (err) {
    return vistaFallo(err);
  }
  if (!usuarioActual().perfil.activo) return vistaPendiente();
  montarShell();
}

function tarjeta(html) {
  app.innerHTML = `<div class="login"><div class="login-tarjeta">${html}</div></div>`;
  app.querySelector('#salir')?.addEventListener('click', salir);
  app.querySelector('#reintentar')?.addEventListener('click', iniciar);
}

function vistaPendiente() {
  const { perfil } = usuarioActual();
  tarjeta(`
    <div class="marca"><span class="logo">IP</span><div><strong>Inversiones Prósperas</strong></div></div>
    <h1>Cuenta pendiente</h1>
    <p class="nota">Hola ${esc(perfil.nombre || perfil.email)}. Un administrador debe activar tu cuenta antes de que puedas entrar.</p>
    <button class="btn btn-primario" id="reintentar" type="button">Revisar de nuevo</button>
    <button class="btn btn-fantasma" id="salir" type="button">Salir</button>`);
}

function vistaFallo(err) {
  tarjeta(`
    <h1>No se pudo cargar tu perfil</h1>
    <p class="msg">${esc(err.message)}</p>
    <p class="nota">Si es la primera vez, confirma que ejecutaste supabase/schema.sql y que el correo se registró después de crear el trigger.</p>
    <button class="btn btn-primario" id="reintentar" type="button">Reintentar</button>
    <button class="btn btn-fantasma" id="salir" type="button">Salir</button>`);
}

function montarShell() {
  const { perfil } = usuarioActual();
  app.innerHTML = `
    <header class="barra">
      <a class="marca" href="#/"><span class="logo">IP</span><strong>Inversiones Prósperas</strong></a>
      <div class="barra-der">
        <div class="usuario">
          <span class="usuario-nombre">${esc(perfil.nombre || perfil.email)}</span>
          <span class="rol ${perfil.es_admin ? 'rol-admin' : ''}">${perfil.es_admin ? 'Administrador' : 'Usuario'}</span>
        </div>
        <button class="btn btn-fantasma" id="salir" type="button">${icono('salir')}<span class="txt-salir">Salir</span></button>
      </div>
    </header>
    <main id="vista" class="contenedor"></main>`;
  app.querySelector('#salir').onclick = salir;
  shellListo = true;
  enrutar();
}

function enrutar() {
  if (!shellListo) return;
  const main = document.getElementById('vista');
  const ruta = location.hash.replace(/^#\/?/, '');

  if (ruta === 'admin') return esAdmin() ? vistaAdmin(main) : vistaDenegado(main);

  const modulo = MODULOS.find((m) => m.ruta === ruta);
  if (modulo) return puede(modulo.clave + '.ver') ? vistaModulo(main, modulo) : vistaDenegado(main);

  vistaMenu(main);
}

window.addEventListener('hashchange', enrutar);

// Cambios de sesión (login/logout). Se ignora el SIGNED_IN repetido del mismo usuario.
alCambiarSesion((evento, sesion) => {
  const nuevoId = sesion?.user?.id ?? null;
  if (evento === 'SIGNED_OUT' || (evento === 'SIGNED_IN' && nuevoId !== idActual)) {
    setTimeout(iniciar, 0);
  }
});

iniciar();
