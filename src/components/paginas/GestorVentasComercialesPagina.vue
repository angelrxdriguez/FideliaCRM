<template>
  <div class="contenedor-pagina">
    <section class="panel">
      <div class="cabecera-panel">
        <h3>Ventas de comerciales</h3>
      </div>

      <article v-if="alerta" class="alerta alerta-danger">
        {{ alerta }}
      </article>

      <div v-if="cargandoComerciales" class="estado-carga">Cargando comerciales...</div>

      <template v-else>
        <label class="campo">
          Comercial
          <select v-model="comercialSeleccionadoId" @change="cargarVentasComercial">
            <option value="">Selecciona un comercial</option>
            <option v-for="comercial in comerciales" :key="comercial.id" :value="String(comercial.id)">
              {{ comercial.nombre_completo }}
            </option>
          </select>
        </label>

        <p v-if="comerciales.length === 0" class="sin-resultados">
          No hay usuarios con rol comercial disponibles.
        </p>

        <div v-if="resumenComercial" class="resumen">
          <article>
            <p class="titulo">Ventas</p>
            <strong>{{ resumenComercial.total_ventas }}</strong>
          </article>
          <article>
            <p class="titulo">Total facturado</p>
            <strong>{{ formatearMoneda(resumenComercial.total_venta) }}</strong>
          </article>
          <article>
            <p class="titulo">Ultima venta</p>
            <strong>{{ formatearFecha(resumenComercial.ultima_venta) }}</strong>
          </article>
        </div>

        <div v-if="cargandoVentas" class="estado-carga">Cargando ventas...</div>

        <table v-else>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Subtotal</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venta in ventas" :key="venta.id">
              <td>#{{ venta.id }}</td>
              <td>{{ formatearFecha(venta.fecha_venta) }}</td>
              <td>{{ venta.cliente }}</td>
              <td>{{ formatearMoneda(venta.subtotal_base) }}</td>
              <td>{{ formatearMoneda(venta.total_venta) }}</td>
            </tr>
            <tr v-if="ventas.length === 0">
              <td colspan="5" class="sin-resultados">No hay ventas para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </template>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { obtener } from '../../servicios/api'

const comerciales = ref([])
const ventas = ref([])
const comercialSeleccionadoId = ref('')
const resumenComercial = ref(null)
const cargandoComerciales = ref(false)
const cargandoVentas = ref(false)
const alerta = ref('')

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(valor || 0))
}

function formatearFecha(valor) {
  if (!valor) return '-'
  return new Date(valor).toLocaleString('es-ES')
}

function limpiarEstadoVentas() {
  ventas.value = []
  resumenComercial.value = null
}

async function cargarComerciales() {
  cargandoComerciales.value = true
  alerta.value = ''

  try {
    const payload = await obtener(
      '/api/ventas/gestor/comerciales',
      'No se pudieron cargar los comerciales.'
    )

    comerciales.value = payload.comerciales || []

    if (comerciales.value.length > 0) {
      comercialSeleccionadoId.value = String(comerciales.value[0].id)
      await cargarVentasComercial()
    } else {
      limpiarEstadoVentas()
    }
  } catch (error) {
    alerta.value = error.message
    limpiarEstadoVentas()
  } finally {
    cargandoComerciales.value = false
  }
}

async function cargarVentasComercial() {
  if (!comercialSeleccionadoId.value) {
    limpiarEstadoVentas()
    return
  }

  cargandoVentas.value = true
  alerta.value = ''

  try {
    const payload = await obtener(
      `/api/ventas/gestor/comercial/${Number(comercialSeleccionadoId.value)}`,
      'No se pudieron cargar las ventas del comercial.'
    )

    ventas.value = payload.ventas || []
    resumenComercial.value = payload.resumen || null
  } catch (error) {
    alerta.value = error.message
    limpiarEstadoVentas()
  } finally {
    cargandoVentas.value = false
  }
}

onMounted(() => {
  cargarComerciales()
})
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
}

.panel {
  background: #ffffff;
  border: 1px solid #d9dee3;
  border-radius: 0.9rem;
  padding: 1rem;
}

.cabecera-panel {
  margin-bottom: 0.9rem;
}

.cabecera-panel h3 {
  margin: 0;
  color: #1f2d3d;
}

.campo {
  display: grid;
  gap: 0.35rem;
  max-width: 420px;
  margin-bottom: 0.9rem;
  color: #2f3c4a;
}

.campo select {
  border: 1px solid #c9d1d8;
  border-radius: 0.55rem;
  padding: 0.6rem 0.7rem;
  font-size: 0.95rem;
}

.resumen {
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, 1fr));
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.resumen article {
  border: 1px solid #dbe2e8;
  border-radius: 0.6rem;
  padding: 0.7rem;
  background: #f8fafc;
}

.resumen .titulo {
  margin: 0 0 0.3rem;
  color: #5b6978;
  font-size: 0.86rem;
}

.resumen strong {
  color: #1f2d3d;
}

.alerta {
  border-radius: 0.75rem;
  padding: 0.8rem 0.9rem;
  margin-bottom: 0.8rem;
}

.alerta-danger {
  background: #fdeceb;
  border: 1px solid #c3423f;
  color: #8f2623;
}

.estado-carga,
.sin-resultados {
  color: #5f6f7c;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 0.7rem 0.6rem;
  border-bottom: 1px solid #e4eaef;
}

@media (max-width: 760px) {
  .resumen {
    grid-template-columns: 1fr;
  }

  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
