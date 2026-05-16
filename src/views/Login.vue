<template>
  <div class="pagina-login">
    <section class="panel-login">
      <div class="cabecera-login">
        <h1>Entrar en Fidelia CRM</h1>
        <p>Introduce tu correo y contrasena para continuar.</p>
      </div>

      <article v-if="error" class="alerta alerta-danger">
        {{ error }}
      </article>

      <form class="formulario-login" @submit.prevent="iniciarSesion">
        <label>
          Correo
          <input v-model.trim="formulario.correo" type="email" autocomplete="username" required />
        </label>

        <label>
          Password
          <input
            v-model="formulario.password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>

        <button type="submit" class="boton-principal" :disabled="cargando">
          {{ cargando ? 'Validando...' : 'Entrar' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { enviar } from '../servicios/api'

const emit = defineEmits(['autenticado'])
const cargando = ref(false)
const error = ref('')

const formulario = reactive({
  correo: '',
  password: '',
})

function normalizarRol(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

async function iniciarSesion() {
  cargando.value = true
  error.value = ''

  try {
    const payload = await enviar('/api/auth/login', { ...formulario }, 'No se pudo iniciar sesion.')
    const usuario = payload.usuario
    const rol = normalizarRol(usuario?.rol)

    if (!esRolAutorizado(rol)) {
      error.value = 'Tu usuario no tiene un rol autorizado para acceder al sistema.'
      return
    }

    emit('autenticado', usuario)
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

function esRolAutorizado(rol) {
  return rol === 'administrador' || rol === 'comercial' || rol === 'gestor_comercial'
}
</script>

<style scoped>
.pagina-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: #f3f5f7;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.panel-login {
  width: min(420px, 100%);
  background: #ffffff;
  border: 1px solid #d9dee3;
  border-radius: 0.9rem;
  padding: 1.3rem;
  box-shadow: 0 8px 24px rgba(25, 39, 52, 0.08);
}

.cabecera-login {
  display: grid;
  gap: 0.3rem;
  margin-bottom: 1.2rem;
}

.cabecera-login h1 {
  margin: 0;
  color: #1f2d3d;
  font-size: 1.5rem;
}

.cabecera-login p {
  margin: 0;
  color: #5b6978;
  font-size: 0.95rem;
}

.formulario-login {
  display: grid;
  gap: 0.85rem;
}

.formulario-login label {
  display: grid;
  gap: 0.32rem;
  color: #2f3c4a;
  font-size: 0.95rem;
}

.formulario-login input {
  border: 1px solid #c9d1d8;
  border-radius: 0.55rem;
  padding: 0.62rem 0.7rem;
  font-size: 0.95rem;
}

.formulario-login input:focus {
  outline: 2px solid #cddfeb;
  outline-offset: 1px;
}

.boton-principal {
  padding: 0.72rem 1rem;
  border-radius: 0.55rem;
  border: 1px solid transparent;
  background: #2d5f77;
  color: #f5fbfc;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.boton-principal:hover {
  background: #234b5e;
}

.boton-principal:disabled {
  opacity: 0.75;
  cursor: wait;
}

.alerta {
  border-radius: 0.8rem;
  padding: 0.85rem 0.95rem;
  margin-bottom: 1rem;
}

.alerta-danger {
  background: #fdeceb;
  border: 1px solid #c3423f;
  color: #8f2623;
}
</style>

