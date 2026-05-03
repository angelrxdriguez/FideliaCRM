<template>
  <div class="pagina-login">
    <section class="panel-login">
      <div class="cabecera-login">
        <span class="logo-login">FDB</span>
        <div>
          <p class="eyebrow">Acceso restringido</p>
          <h1>Entrar en Fidelia CRM</h1>
        </div>
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

    if (rol !== 'administrador' && rol !== 'comercial') {
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
</script>

<style scoped>
.pagina-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(circle at top left, rgba(17, 75, 95, 0.14), transparent 28%),
    linear-gradient(180deg, #edf5f7 0%, #e5eff2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.panel-login {
  width: min(460px, 100%);
  background: #ffffff;
  border: 1px solid #d4e3e8;
  border-radius: 1.2rem;
  padding: 1.4rem;
  box-shadow: 0 18px 45px rgba(17, 75, 95, 0.12);
}

.cabecera-login {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  margin-bottom: 1.2rem;
}

.logo-login {
  width: 48px;
  height: 48px;
  border-radius: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #114b5f;
  color: #f5fbfc;
  font-weight: 700;
  flex-shrink: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6c7a80;
}

.cabecera-login h1 {
  margin: 0.2rem 0 0;
  color: #114b5f;
  font-size: 1.8rem;
}


.formulario-login {
  display: grid;
  gap: 0.9rem;
}

.formulario-login label {
  display: grid;
  gap: 0.35rem;
  color: #32464d;
}

.boton-principal {
  padding: 0.78rem 1rem;
  border-radius: 0.65rem;
  border: 1px solid transparent;
  background: #114b5f;
  color: #f5fbfc;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.boton-principal:hover {
  background: #0d3c4c;
  transform: translateY(-1px);
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

