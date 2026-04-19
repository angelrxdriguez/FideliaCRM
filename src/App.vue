<script setup>
import { computed, ref } from 'vue'
import FideliaCRMView from './views/FideliaCRMView.vue'
import LoginView from './views/LoginView.vue'

const claveSesion = 'fidelia_usuario_autenticado'

function leerSesion() {
  const sesionGuardada = localStorage.getItem(claveSesion)

  if (!sesionGuardada) return null

  try {
    return JSON.parse(sesionGuardada)
  } catch {
    localStorage.removeItem(claveSesion)
    return null
  }
}

const usuarioAutenticado = ref(leerSesion())

const haySesion = computed(() => Boolean(usuarioAutenticado.value))

function manejarAutenticacion(usuario) {
  usuarioAutenticado.value = usuario
  localStorage.setItem(claveSesion, JSON.stringify(usuario))
}

function cerrarSesion() {
  usuarioAutenticado.value = null
  localStorage.removeItem(claveSesion)
}
</script>

<template>
  <LoginView v-if="!haySesion" @autenticado="manejarAutenticacion" />
  <FideliaCRMView v-else :usuario="usuarioAutenticado" @cerrar-sesion="cerrarSesion" />
</template>
