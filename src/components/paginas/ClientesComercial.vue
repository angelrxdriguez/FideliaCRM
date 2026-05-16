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
          </tr>
        </thead>
        <tbody>
          <tr v-for="cliente in clientes" :key="cliente.id">
            <td>{{ cliente.nombre }}</td>
            <td>{{ cliente.cif || '-' }}</td>
            <td>{{ cliente.telefono || '-' }}</td>
            <td>{{ cliente.email || '-' }}</td>
            <td>{{ cliente.tarifa }}</td>
            <td>
              <span class="badge-estado" :class="cliente.activo ? 'estado-activo' : 'estado-bloqueado'">
                {{ cliente.activo ? 'activo' : 'inactivo' }}
              </span>
            </td>
          </tr>
          <tr v-if="clientes.length === 0">
            <td colspan="6" class="sin-resultados">No tienes clientes asociados.</td>
          </tr>
        </tbody>
      </table>
    </article>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { obtener } from '../../servicios/api'

const props = defineProps({
  usuario: {
    type: Object,
    required: true,
  },
})

const cargando = ref(false)
const alertaDanger = ref('')
const clientes = ref([])

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
