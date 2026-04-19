<template>
  <div class="contenedor-pagina">
    <section class="rejilla-modulo">
      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Crear tarifa</h3>
            <p class="texto-ayuda">Define el nombre y el porcentaje de beneficio de la tarifa.</p>
          </div>
        </div>

        <form class="formulario" @submit.prevent="guardarTarifa">
          <label>
            Nombre
            <input v-model.trim="formulario.nombre" type="text" required />
          </label>

          <label>
            Porcentaje de beneficio
            <input v-model.number="formulario.porcentaje_beneficio" type="number" step="0.01" required />
          </label>

          <label class="campo-checkbox">
            <input v-model="formulario.activa" type="checkbox" />
            <span>Tarifa activa</span>
          </label>

          <div class="acciones-formulario">
            <button type="submit" class="boton-principal" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Crear tarifa' }}
            </button>
            <button type="button" class="boton-secundario" @click="reiniciarFormulario">
              Limpiar
            </button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Tarifas disponibles</h3>
            <p class="texto-ayuda">Listado de tarifas y cantidad de clientes asociados.</p>
          </div>
          <span class="contador-panel">{{ tarifas.length }}</span>
        </div>

        <article v-if="alertaSuccess" class="alerta alerta-success">
          {{ alertaSuccess }}
        </article>

        <article v-if="alertaDanger" class="alerta alerta-danger">
          {{ alertaDanger }}
        </article>

        <div v-if="cargando" class="estado-carga">Cargando tarifas...</div>

        <table v-else>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Beneficio</th>
              <th>Clientes</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tarifa in tarifas" :key="tarifa.id">
              <td>{{ tarifa.nombre }}</td>
              <td>{{ formatearPorcentaje(tarifa.porcentaje_beneficio) }}</td>
              <td>{{ tarifa.total_clientes }}</td>
              <td>
                <span class="badge-estado" :class="tarifa.activa ? 'estado-activo' : 'estado-bloqueado'">
                  {{ tarifa.activa ? 'activa' : 'inactiva' }}
                </span>
              </td>
            </tr>
            <tr v-if="tarifas.length === 0">
              <td colspan="4" class="sin-resultados">No hay tarifas creadas.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { enviar, obtener } from '../../servicios/api'

const cargando = ref(false)
const guardando = ref(false)
const alertaSuccess = ref('')
const alertaDanger = ref('')
const tarifas = ref([])

const formulario = reactive({
  nombre: '',
  porcentaje_beneficio: 0,
  activa: true,
})

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function reiniciarFormulario() {
  formulario.nombre = ''
  formulario.porcentaje_beneficio = 0
  formulario.activa = true
}

function formatearPorcentaje(valor) {
  return `${Number(valor || 0).toFixed(2)}%`
}

async function cargarTarifas() {
  cargando.value = true

  try {
    const payload = await obtener('/api/tarifas', 'No se pudieron cargar las tarifas.')
    tarifas.value = payload.tarifas
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function guardarTarifa() {
  guardando.value = true
  limpiarAlertas()

  try {
    await enviar('/api/tarifas', { ...formulario }, 'No se pudo crear la tarifa.')
    alertaSuccess.value = 'Tarifa creada correctamente.'
    reiniciarFormulario()
    await cargarTarifas()
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarTarifas()
})
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
}

.rejilla-modulo {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 1rem;
}

.panel {
  background: #ffffff;
  border: 1px solid #d4e3e8;
  border-radius: 1rem;
  padding: 1rem;
}

.cabecera-panel {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.cabecera-panel h3 {
  margin: 0;
  color: #114b5f;
}

.texto-ayuda {
  margin: 0.35rem 0 0;
  color: #4d626a;
}

.contador-panel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #e5eff2;
  color: #114b5f;
  font-weight: 700;
}

.formulario {
  display: grid;
  gap: 0.85rem;
}

.formulario label {
  display: grid;
  gap: 0.35rem;
  color: #32464d;
}

input {
  width: 100%;
  border: 1px solid #c7d8de;
  border-radius: 0.55rem;
  padding: 0.65rem 0.7rem;
  font: inherit;
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.campo-checkbox input {
  width: auto;
}

.acciones-formulario {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.boton-principal,
.boton-secundario {
  padding: 0.7rem 1rem;
  border-radius: 0.6rem;
  border: 1px solid transparent;
  cursor: pointer;
}

.boton-principal {
  background: #114b5f;
  color: #f5fbfc;
}

.boton-secundario {
  background: #ffffff;
  color: #114b5f;
  border-color: #114b5f;
}

.alerta {
  border-radius: 0.75rem;
  padding: 0.8rem 0.9rem;
  margin-bottom: 0.8rem;
}

.alerta-success {
  background: #e7f7ec;
  border: 1px solid #2f9e58;
  color: #1f6d3d;
}

.alerta-danger {
  background: #fdeceb;
  border: 1px solid #c3423f;
  color: #8f2623;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.8rem 0.65rem;
  text-align: left;
  border-bottom: 1px solid #e2ecef;
}

.badge-estado {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.estado-activo {
  background: #ddf7e6;
  color: #116b39;
}

.estado-bloqueado {
  background: #fde4e2;
  color: #b42318;
}

.estado-carga,
.sin-resultados {
  color: #607077;
}

@media (max-width: 980px) {
  .rejilla-modulo {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
