<template>
  <div class="marca-empresa">
    <p class="nombre-empresa">{{ nombreEmpresaMostrado }}</p>

    <div class="contenedor-imagen">
      <img
        v-if="imagenEmpresaUrl"
        :src="imagenEmpresaUrl"
        :alt="`Logo de ${nombreEmpresaMostrado}`"
        class="imagen-empresa"
      />
      <p v-else class="sin-imagen">Sin foto</p>
    </div>

    <h1>Fidelia CRM</h1>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { obtener } from '../../servicios/api'

const nombreEmpresa = ref('')
const imagenEmpresaUrl = ref('')

const nombreEmpresaMostrado = computed(() => nombreEmpresa.value || 'Empresa')

async function cargarIdentidadEmpresa() {
  const [resultadoParametros, resultadoImagen] = await Promise.allSettled([
    obtener('/api/empresa-parametros'),
    obtener('/api/empresa-imagen'),
  ])

  if (resultadoParametros.status === 'fulfilled') {
    const parametros = resultadoParametros.value?.parametros || {}
    nombreEmpresa.value = parametros.nombre_comercial || parametros.razon_social || ''
  }

  if (resultadoImagen.status === 'fulfilled') {
    const imagen = resultadoImagen.value?.imagen || {}
    imagenEmpresaUrl.value = imagen.existe ? imagen.url || '' : ''
  }
}

onMounted(() => {
  cargarIdentidadEmpresa()
})
</script>

<style scoped>
.marca-empresa {
  display: grid;
  gap: 0.45rem;
  text-align: center;
}

.nombre-empresa {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
  color: #f5fbfc;
}

.contenedor-imagen {
  min-height: 84px;
  display: grid;
  place-items: center;
}

.imagen-empresa {
  width: 100%;
  max-width: 150px;
  max-height: 88px;
  object-fit: contain;
  border-radius: 0.5rem;
}

.sin-imagen {
  margin: 0;
  font-size: 0.82rem;
  opacity: 0.7;
}

h1 {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  opacity: 0.7;
}
</style>
