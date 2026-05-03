<template>
  <div class="contenedor-pagina">
    <section class="rejilla-modulo">
      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>{{ clienteEditandoId ? 'Editar cliente' : 'Crear cliente' }}</h3>
          </div>
        </div>

        <form class="formulario" @submit.prevent="guardarCliente">
          <label>
            Nombre
            <input v-model.trim="formulario.nombre" type="text" required />
          </label>

          <label>
            Tarifa
            <select v-model="formulario.id_tarifa" required>
              <option value="">Selecciona una tarifa</option>
              <option v-for="tarifa in tarifas" :key="tarifa.id" :value="String(tarifa.id)">
                {{ tarifa.nombre }} ({{ formatearPorcentaje(tarifa.porcentaje_beneficio) }})
              </option>
            </select>
          </label>

          <label>
            Comercial
            <select v-model="formulario.id_comercial">
              <option value="">Sin comercial</option>
              <option v-for="usuario in usuarios" :key="usuario.id" :value="String(usuario.id)">
                {{ usuario.nombre_completo }}
              </option>
            </select>
          </label>

          <label>
            Nombre fiscal
            <input v-model.trim="formulario.nombre_fiscal" type="text" />
          </label>

          <label>
            CIF
            <input v-model.trim="formulario.cif" type="text" />
          </label>

          <label>
            Telefono
            <input v-model.trim="formulario.telefono" type="text" />
          </label>

          <label>
            Email
            <input v-model.trim="formulario.email" type="email" />
          </label>

          <label>
            Direccion
            <input v-model.trim="formulario.direccion" type="text" />
          </label>

          <div class="fila-doble">
            <label>
              Ciudad
              <input v-model.trim="formulario.ciudad" type="text" list="lista-ciudades-cp" />
            </label>

            <label>
              Provincia
              <input v-model.trim="formulario.provincia" type="text" />
            </label>
          </div>

          <label>
            Codigo postal
            <div class="campo-cp">
              <input v-model.trim="formulario.codigo_postal" type="text" maxlength="5" />
              <button
                type="button"
                class="boton-cp"
                :disabled="cargandoCodigoPostal || formulario.codigo_postal.length !== 5"
                @click="autocompletarPorCodigoPostal"
              >
                {{ cargandoCodigoPostal ? 'Buscando...' : 'Completar' }}
              </button>
            </div>
          </label>

          <datalist id="lista-ciudades-cp">
            <option v-for="ciudad in ciudadesSugeridas" :key="ciudad" :value="ciudad"></option>
          </datalist>

          <div class="fila-doble">
            <label>
              Latitud
              <input v-model.number="formulario.latitud" type="number" step="0.0000001" />
            </label>

            <label>
              Longitud
              <input v-model.number="formulario.longitud" type="number" step="0.0000001" />
            </label>
          </div>

          <label class="campo-checkbox">
            <input v-model="formulario.activo" type="checkbox" />
            <span>Cliente activo</span>
          </label>

          <div class="acciones-formulario">
            <button type="submit" class="boton-principal" :disabled="guardando || tarifas.length === 0">
              {{ guardando ? 'Guardando...' : clienteEditandoId ? 'Guardar cambios' : 'Crear cliente' }}
            </button>
            <button type="button" class="boton-secundario" @click="reiniciarFormulario">
              {{ clienteEditandoId ? 'Cancelar edicion' : 'Limpiar' }}
            </button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Clientes registrados</h3>
          </div>
        </div>

        <article v-if="alertaSuccess" class="alerta alerta-success">
          {{ alertaSuccess }}
        </article>

        <article v-if="alertaDanger" class="alerta alerta-danger">
          {{ alertaDanger }}
        </article>

        <div v-if="cargando" class="estado-carga">Cargando clientes...</div>

        <table v-else>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CIF</th>
              <th>Telefono</th>
              <th>Email</th>
              <th>Tarifa</th>
              <th>Comercial</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in clientes" :key="cliente.id">
              <td>{{ cliente.nombre }}</td>
              <td>{{ cliente.cif || '-' }}</td>
              <td>{{ cliente.telefono || '-' }}</td>
              <td>{{ cliente.email || '-' }}</td>
              <td>{{ cliente.tarifa }}</td>
              <td>{{ cliente.comercial || '-' }}</td>
              <td>
                <span class="badge-estado" :class="cliente.activo ? 'estado-activo' : 'estado-bloqueado'">
                  {{ cliente.activo ? 'activo' : 'inactivo' }}
                </span>
              </td>
              <td>
                <button type="button" class="boton-tabla" @click="editarCliente(cliente)">
                  Editar
                </button>
              </td>
            </tr>
            <tr v-if="clientes.length === 0">
              <td colspan="8" class="sin-resultados">No hay clientes creados.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { actualizar, enviar, obtener } from '../../servicios/api'

const cargando = ref(false)
const guardando = ref(false)
const alertaSuccess = ref('')
const alertaDanger = ref('')
const clientes = ref([])
const tarifas = ref([])
const usuarios = ref([])
const clienteEditandoId = ref(null)
const cargandoCodigoPostal = ref(false)
const ciudadesSugeridas = ref([])
let temporizadorCodigoPostal = null

const formulario = reactive({
  nombre: '',
  nombre_fiscal: '',
  cif: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  latitud: '',
  longitud: '',
  id_tarifa: '',
  id_comercial: '',
  activo: true,
})

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function formatearPorcentaje(valor) {
  return `${Number(valor || 0).toFixed(2)}%`
}

function reiniciarFormulario() {
  clienteEditandoId.value = null
  formulario.nombre = ''
  formulario.nombre_fiscal = ''
  formulario.cif = ''
  formulario.telefono = ''
  formulario.email = ''
  formulario.direccion = ''
  formulario.ciudad = ''
  formulario.provincia = ''
  formulario.codigo_postal = ''
  formulario.latitud = ''
  formulario.longitud = ''
  formulario.id_tarifa = ''
  formulario.id_comercial = ''
  formulario.activo = true
  ciudadesSugeridas.value = []
}

async function cargarClientes() {
  cargando.value = true

  try {
    const payload = await obtener('/api/clientes', 'No se pudieron cargar los clientes.')
    clientes.value = payload.clientes
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function cargarTarifas() {
  try {
    const payload = await obtener('/api/tarifas', 'No se pudieron cargar las tarifas.')
    tarifas.value = payload.tarifas
  } catch (error) {
    alertaDanger.value = error.message
  }
}

async function cargarUsuarios() {
  try {
    const payload = await obtener('/api/usuarios', 'No se pudieron cargar los usuarios.')
    usuarios.value = payload.usuarios
  } catch (error) {
    alertaDanger.value = error.message
  }
}

function editarCliente(cliente) {
  limpiarAlertas()
  clienteEditandoId.value = cliente.id
  formulario.nombre = cliente.nombre || ''
  formulario.nombre_fiscal = cliente.nombre_fiscal || ''
  formulario.cif = cliente.cif || ''
  formulario.telefono = cliente.telefono || ''
  formulario.email = cliente.email || ''
  formulario.direccion = cliente.direccion || ''
  formulario.ciudad = cliente.ciudad || ''
  formulario.provincia = cliente.provincia || ''
  formulario.codigo_postal = cliente.codigo_postal || ''
  formulario.latitud = cliente.latitud ?? ''
  formulario.longitud = cliente.longitud ?? ''
  formulario.id_tarifa = cliente.id_tarifa ? String(cliente.id_tarifa) : ''
  formulario.id_comercial = cliente.id_comercial ? String(cliente.id_comercial) : ''
  formulario.activo = Boolean(cliente.activo)
}

async function guardarCliente() {
  guardando.value = true
  limpiarAlertas()

  try {
    const payload = {
      ...formulario,
      id_tarifa: Number(formulario.id_tarifa),
      id_comercial: formulario.id_comercial ? Number(formulario.id_comercial) : null,
    }

    if (clienteEditandoId.value) {
      await actualizar(`/api/clientes/${clienteEditandoId.value}`, payload, 'No se pudo actualizar el cliente.')
      alertaSuccess.value = 'Cliente actualizado correctamente.'
    } else {
      await enviar('/api/clientes', payload, 'No se pudo crear el cliente.')
      alertaSuccess.value = 'Cliente creado correctamente.'
    }

    reiniciarFormulario()
    await Promise.all([cargarClientes(), cargarTarifas(), cargarUsuarios()])
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

async function autocompletarPorCodigoPostal() {
  const cp = formulario.codigo_postal.trim()

  if (!/^\d{5}$/.test(cp)) {
    return
  }

  cargandoCodigoPostal.value = true

  try {
    const payload = await obtener(`/api/codigos-postales/${cp}`, 'No se pudo consultar el codigo postal.')
    ciudadesSugeridas.value = payload.ciudades || []

    if (payload.provincia) {
      formulario.provincia = payload.provincia
    }

    if ((!formulario.ciudad || formulario.ciudad.trim() === '') && payload.ciudad_principal) {
      formulario.ciudad = payload.ciudad_principal
    }
  } catch (error) {
    ciudadesSugeridas.value = []
    alertaDanger.value = error.message
  } finally {
    cargandoCodigoPostal.value = false
  }
}

watch(
  () => formulario.codigo_postal,
  (nuevoValor) => {
    if (temporizadorCodigoPostal) {
      clearTimeout(temporizadorCodigoPostal)
    }

    if (!/^\d{5}$/.test((nuevoValor || '').trim())) {
      ciudadesSugeridas.value = []
      return
    }

    temporizadorCodigoPostal = setTimeout(() => {
      autocompletarPorCodigoPostal()
    }, 450)
  }
)

onMounted(() => {
  Promise.all([cargarClientes(), cargarTarifas(), cargarUsuarios()])
})
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
}

.rejilla-modulo {
  display: grid;
  grid-template-columns: minmax(340px, 460px) minmax(0, 1fr);
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


.formulario {
  display: grid;
  gap: 0.8rem;
}

.formulario label {
  display: grid;
  gap: 0.35rem;
  color: #32464d;
}

.fila-doble {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}

.campo-cp {
  display: flex;
  gap: 0.55rem;
}

.boton-cp {
  border: 1px solid #114b5f;
  background: #ffffff;
  color: #114b5f;
  border-radius: 0.55rem;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.boton-cp:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 0.55rem;
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

.boton-tabla {
  padding: 0.45rem 0.7rem;
  border-radius: 0.55rem;
  border: 1px solid #114b5f;
  background: #ffffff;
  color: #114b5f;
  font: inherit;
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

@media (max-width: 1080px) {
  .rejilla-modulo {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .fila-doble {
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

