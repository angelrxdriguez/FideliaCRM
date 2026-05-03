<template>
  <div class="contenedor-pagina">
    <section class="rejilla-modulo">
      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Crear usuario</h3>
          </div>
        </div>

        <form class="formulario" @submit.prevent="guardarUsuario">
          <label>
            Rol
            <select v-model="formulario.rol_id">
              <option value="">Sin rol</option>
              <option v-for="rol in roles" :key="rol.id" :value="String(rol.id)">
                {{ rol.nombre }}
              </option>
            </select>
          </label>

          <label>
            Nombre completo
            <input v-model.trim="formulario.nombre_completo" type="text" required />
          </label>

          <label>
            Correo
            <input v-model.trim="formulario.correo" type="email" required />
          </label>

          <label>
            Contraseña
            <input v-model="formulario.password" type="password" minlength="6" required />
          </label>

          <div class="acciones-formulario">
            <button type="submit" class="boton-principal" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Crear usuario' }}
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
            <h3>Usuarios registrados</h3>
          </div>
        </div>

        <article v-if="alertaSuccess" class="alerta alerta-success">
          {{ alertaSuccess }}
        </article>

        <article v-if="alertaDanger" class="alerta alerta-danger">
          {{ alertaDanger }}
        </article>

        <div v-if="cargando" class="estado-carga">Cargando usuarios...</div>

        <table v-else>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id">
              <td>{{ usuario.nombre_completo }}</td>
              <td>{{ usuario.correo }}</td>
              <td>{{ usuario.rol || 'Sin rol' }}</td>
            </tr>
            <tr v-if="usuarios.length === 0">
              <td colspan="3" class="sin-resultados">No hay usuarios cargados.</td>
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
const usuarios = ref([])
const roles = ref([])

const formulario = reactive({
  rol_id: '',
  nombre_completo: '',
  correo: '',
  password: '',
})

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function reiniciarFormulario() {
  formulario.rol_id = ''
  formulario.nombre_completo = ''
  formulario.correo = ''
  formulario.password = ''
}

async function cargarUsuarios() {
  cargando.value = true

  try {
    const payload = await obtener('/api/usuarios', 'No se pudieron cargar los usuarios.')
    usuarios.value = payload.usuarios
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function cargarRoles() {
  try {
    const payload = await obtener('/api/roles-usuarios', 'No se pudieron cargar los roles.')
    roles.value = payload.roles
  } catch (error) {
    alertaDanger.value = error.message
  }
}

async function guardarUsuario() {
  guardando.value = true
  limpiarAlertas()

  try {
    await enviar(
      '/api/usuarios',
      {
        ...formulario,
        rol_id: formulario.rol_id ? Number(formulario.rol_id) : null,
      },
      'No se pudo crear el usuario.'
    )
    alertaSuccess.value = 'Usuario creado correctamente con password hasheada.'
    reiniciarFormulario()
    await Promise.all([cargarUsuarios(), cargarRoles()])
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  Promise.all([cargarUsuarios(), cargarRoles()])
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


.formulario {
  display: grid;
  gap: 0.85rem;
}

.formulario label {
  display: grid;
  gap: 0.35rem;
  color: #32464d;
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
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.boton-principal {
  background: #114b5f;
  color: #f5fbfc;
}

.boton-principal:hover {
  background: #0d3c4c;
  transform: translateY(-1px);
}

.boton-principal:disabled {
  opacity: 0.7;
  cursor: wait;
}

.boton-secundario {
  background: #ffffff;
  color: #114b5f;
  border-color: #114b5f;
}

.boton-secundario:hover {
  background: #f1f7f9;
  color: #0d3c4c;
  border-color: #0d3c4c;
  transform: translateY(-1px);
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

thead th {
  color: #114b5f;
  font-size: 0.86rem;
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

