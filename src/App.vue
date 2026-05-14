<script setup>
import { computed, ref } from 'vue'
import ComercialCRMView from './views/ComercialCRMView.vue'
import FideliaCRMView from './views/FideliaCRMView.vue'
import GestorComercialCRMView from './views/GestorComercialCRMView.vue'
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

const rolUsuario = computed(() => normalizarRol(usuarioAutenticado.value?.rol))
const rolValido = computed(
  () =>
    rolUsuario.value === 'administrador' ||
    rolUsuario.value === 'comercial' ||
    rolUsuario.value === 'gestor_comercial'
)
const haySesion = computed(() => Boolean(usuarioAutenticado.value) && rolValido.value)
const esComercial = computed(() => rolUsuario.value === 'comercial')
const esGestorComercial = computed(() => rolUsuario.value === 'gestor_comercial')
const vistaAutenticada = computed(() => {
  if (esGestorComercial.value) return GestorComercialCRMView
  if (esComercial.value) return ComercialCRMView
  return FideliaCRMView
})

function manejarAutenticacion(usuario) {
  usuarioAutenticado.value = usuario
  localStorage.setItem(claveSesion, JSON.stringify(usuario))
}

function cerrarSesion() {
  usuarioAutenticado.value = null
  localStorage.removeItem(claveSesion)
}

function normalizarRol(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
</script>

<template>
  <LoginView v-if="!haySesion" @autenticado="manejarAutenticacion" />
  <component :is="vistaAutenticada" v-else :usuario="usuarioAutenticado" @cerrar-sesion="cerrarSesion" />
</template>
