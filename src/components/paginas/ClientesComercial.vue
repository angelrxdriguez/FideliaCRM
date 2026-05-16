<template>
  <div class="contenedor-pagina">
    <article class="panel">
      <div class="cabecera-panel">
        <div>
          <h3>Mis clientes</h3>
        </div>
      </div>

      <article v-if="alertaDanger" class="alerta alerta-danger">
        {{ alertaDanger }}
      </article>

      <article v-if="alertaSuccess" class="alerta alerta-success">
        {{ alertaSuccess }}
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
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cliente in clientes" :key="cliente.id">
            <td>{{ cliente.nombre }}</td>
            <td>{{ cliente.cif || '-' }}</td>
            <td>
              <template v-if="clienteEditandoId === cliente.id">
                <input v-model.trim="formularioEdicion.telefono" class="campo-tabla" type="text" />
              </template>
              <template v-else>
                {{ cliente.telefono || '-' }}
              </template>
            </td>
            <td>
              <template v-if="clienteEditandoId === cliente.id">
                <input v-model.trim="formularioEdicion.email" class="campo-tabla" type="email" />
              </template>
              <template v-else>
                {{ cliente.email || '-' }}
              </template>
            </td>
            <td>{{ cliente.tarifa }}</td>
            <td>
              <span class="badge-estado" :class="cliente.activo ? 'estado-activo' : 'estado-bloqueado'">
                {{ cliente.activo ? 'activo' : 'inactivo' }}
              </span>
            </td>
            <td class="acciones-tabla">
              <template v-if="clienteEditandoId === cliente.id">
                <button type="button" class="boton-tabla" :disabled="guardando" @click="guardarCliente(cliente)">
                  {{ guardando ? 'Guardando...' : 'Guardar' }}
                </button>
                <button type="button" class="boton-tabla boton-tabla-secundario" :disabled="guardando" @click="cancelarEdicion">
                  Cancelar
                </button>
              </template>
              <template v-else>
                <button type="button" class="boton-tabla" :disabled="guardando" @click="editarCliente(cliente)">
                  Editar
                </button>
              </template>
            </td>
          </tr>
          <tr v-if="clientes.length === 0">
            <td colspan="7" class="sin-resultados">No tienes clientes asociados.</td>
          </tr>
        </tbody>
      </table>
    </article>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { actualizar, obtener } from '../../servicios/api'

const props = defineProps({
  usuario: {
    type: Object,
    required: true,
  },
})

const cargando = ref(false)
const guardando = ref(false)
const alertaSuccess = ref('')
const alertaDanger = ref('')
const clientes = ref([])
const clienteEditandoId = ref(null)
const formularioEdicion = reactive({
  telefono: '',
  email: '',
})

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function reiniciarEdicion() {
  clienteEditandoId.value = null
  formularioEdicion.telefono = ''
  formularioEdicion.email = ''
}

function normalizarCampo(valor) {
  const valorNormalizado = (valor || '').trim()
  return valorNormalizado === '' ? null : valorNormalizado
}

async function cargarClientes() {
  cargando.value = true
  alertaDanger.value = ''

  try {
    const payload = await obtener(
      `/api/clientes/comercial/${props.usuario.id}`,
      'No se pudieron cargar tus clientes.'
    )
    clientes.value = payload.clientes
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

function editarCliente(cliente) {
  if (guardando.value) {
    return
  }

  limpiarAlertas()
  clienteEditandoId.value = cliente.id
  formularioEdicion.telefono = cliente.telefono || ''
  formularioEdicion.email = cliente.email || ''
}

function cancelarEdicion() {
  if (guardando.value) {
    return
  }

  reiniciarEdicion()
}

async function guardarCliente(cliente) {
  if (guardando.value || clienteEditandoId.value !== cliente.id) {
    return
  }

  guardando.value = true
  limpiarAlertas()

  try {
    const payload = {
      nombre: cliente.nombre,
      nombre_fiscal: cliente.nombre_fiscal || null,
      cif: cliente.cif || null,
      telefono: normalizarCampo(formularioEdicion.telefono),
      email: normalizarCampo(formularioEdicion.email),
      direccion: cliente.direccion || null,
      ciudad: cliente.ciudad || null,
      provincia: cliente.provincia || null,
      codigo_postal: cliente.codigo_postal || null,
      latitud: cliente.latitud ?? null,
      longitud: cliente.longitud ?? null,
      id_tarifa: Number(cliente.id_tarifa),
      id_comercial: cliente.id_comercial ?? null,
      activo: Boolean(cliente.activo),
    }

    await actualizar(`/api/clientes/${cliente.id}`, payload, 'No se pudo actualizar el cliente.')

    cliente.telefono = payload.telefono
    cliente.email = payload.email
    alertaSuccess.value = 'Cliente actualizado correctamente.'
    reiniciarEdicion()
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarClientes()
})
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
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

.alerta-success {
  background: #e7f7ec;
  border: 1px solid #2f9e58;
  color: #1f6d3d;
}

.estado-carga,
.sin-resultados {
  color: #607077;
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
  vertical-align: middle;
}

.campo-tabla {
  width: 100%;
  min-width: 180px;
  padding: 0.5rem 0.6rem;
  border: 1px solid #b7c9cf;
  border-radius: 0.5rem;
  font: inherit;
}

.acciones-tabla {
  white-space: nowrap;
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

.boton-tabla + .boton-tabla {
  margin-left: 0.45rem;
}

.boton-tabla-secundario {
  border-color: #607077;
  color: #32464d;
}

.boton-tabla:disabled {
  cursor: not-allowed;
  opacity: 0.7;
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

@media (max-width: 640px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
