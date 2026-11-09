import { loginGoogle, loginCorreo, registrar } from '../auth.js';
import { GOOGLE_G } from '../ui.js';

const TRADUCCIONES = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'User already registered': 'Ese correo ya tiene cuenta. Usa "Ingresar".',
  'Email not confirmed': 'Falta confirmar tu correo. Revisa tu bandeja.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.'
};
const traducir = (m) => TRADUCCIONES[m] ?? m;

export function vistaLogin(el) {
  let modo = 'ingresar';

  function pintar() {
    const nuevo = modo === 'registro';
    el.innerHTML = `
      <div class="login">
        <div class="login-tarjeta">
          <div class="marca">
            <span class="logo">IP</span>
            <div><strong>Inversiones Prósperas</strong><small>Control de constructora</small></div>
          </div>
          <h1>${nuevo ? 'Crear cuenta' : 'Ingresar'}</h1>
          <button class="btn btn-google" id="google" type="button">${GOOGLE_G}<span>Continuar con Google</span></button>
          <div class="separador"><span>o con tu correo</span></div>
          <form id="form" novalidate>
            ${nuevo ? '<label>Nombre<input id="nombre" type="text" autocomplete="name" required></label>' : ''}
            <label>Correo<input id="correo" type="email" autocomplete="email" required></label>
            <label>Contraseña<input id="clave" type="password" minlength="6" autocomplete="${nuevo ? 'new-password' : 'current-password'}" required></label>
            <p class="msg" id="msg" role="alert"></p>
            <button class="btn btn-primario" id="enviar" type="submit">${nuevo ? 'Crear cuenta' : 'Ingresar'}</button>
          </form>
          <p class="cambio">${nuevo ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button class="enlace" id="cambiar" type="button">${nuevo ? 'Ingresar' : 'Crear cuenta'}</button></p>
        </div>
      </div>`;

    const msg = (texto, ok = false) => {
      const p = el.querySelector('#msg');
      p.textContent = texto;
      p.className = 'msg' + (ok ? ' ok' : '');
    };

    el.querySelector('#google').onclick = async () => {
      const { error } = await loginGoogle();
      if (error) msg(traducir(error.message));
    };

    el.querySelector('#cambiar').onclick = () => {
      modo = nuevo ? 'ingresar' : 'registro';
      pintar();
    };

    el.querySelector('#form').onsubmit = async (e) => {
      e.preventDefault();
      const correo = el.querySelector('#correo').value.trim();
      const clave = el.querySelector('#clave').value;
      const nombre = nuevo ? el.querySelector('#nombre').value.trim() : '';
      if (!correo || !clave || (nuevo && !nombre)) return msg('Completa todos los campos.');

      const boton = el.querySelector('#enviar');
      boton.disabled = true;
      msg('');
      if (nuevo) {
        const { data, error } = await registrar(correo, clave, nombre);
        if (error) msg(traducir(error.message));
        else if (!data.session) msg('Cuenta creada. Revisa tu correo para confirmarla y luego ingresa.', true);
      } else {
        const { error } = await loginCorreo(correo, clave);
        if (error) msg(traducir(error.message));
      }
      boton.disabled = false;
    };
  }

  pintar();
}
