<template>
  <div class="contenedor-pagina">
    <section class="rejilla-modulo">
      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Crear tipo de familia</h3>
            <p class="texto-ayuda">Define las clasificaciones base que luego se asignan al crear cada familia.</p>
          </div>
        </div>

        <form class="formulario" @submit.prevent="guardarTipoFamilia">
          <label>
            Nombre
            <input v-model.trim="formulario.nombre" type="text" required />
          </label>

          <label>
            Descripcion
            <textarea v-model.trim="formulario.descripcion" rows="4"></textarea>
          </label>

          <div class="acciones-formulario">
            <button type="submit" class="boton-principal" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Crear tipo' }}
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
            <h3>Tipos disponibles</h3>
            <p class="texto-ayuda">Cada tipo muestra cuantas familias lo tienen asignado.</p>
          </div>
          <span class="contador-panel">{{ tiposFamilia.length }}</span>
        </div>

        <article v-if="alertaSuccess" class="alerta alerta-success">
          {{ alertaSuccess }}
        </article>

        <article v-if="alertaDanger" class="alerta alerta-danger">
          {{ alertaDanger }}
        </article>

        <div v-if="cargando" class="estado-carga">Cargando tipos...</div>

        <ul v-else class="lista-tipos">
          <li v-for="tipo in tiposFamilia" :key="tipo.id">
            <div>
              <strong>{{ tipo.nombre }}</strong>
              <p>{{ tipo.descripcion || 'Sin descripcion' }}</p>
            </div>
            <span class="badge-total">{{ tipo.total_familias }}</span>
          </li>
          <li v-if="tiposFamilia.length === 0" class="sin-resultados">
            No hay tipos de familia creados.
          </li>
        </ul>
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
const tiposFamilia = ref([])

const formulario = reactive({
  nombre: '',
  descripcion: '',
})

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function reiniciarFormulario() {
  formulario.nombre = ''
  formulario.descripcion = ''
}

async function cargarTiposFamilia() {
  cargando.value = true

  try {
    const payload = await obtener('/api/tipos-familia', 'No se pudieron cargar los tipos de familia.')
    tiposFamilia.value = payload.tiposFamilia
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function guardarTipoFamilia() {
  guardando.value = true
  limpiarAlertas()

  try {
    await enviar('/api/tipos-familia', { ...formulario }, 'No se pudo crear el tipo de familia.')
    alertaSuccess.value = 'Tipo de familia creado correctamente.'
    reiniciarFormulario()
    await cargarTiposFamilia()
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarTiposFamilia()
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

.contador-panel,
.badge-total {
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

input,
textarea {
  width: 100%;
  border: 1px solid #c7d8de;
  border-radius: 0.55rem;
  padding: 0.65rem 0.7rem;
  font: inherit;
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

.lista-tipos {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.lista-tipos li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding: 0.8rem 0;
  border-bottom: 1px solid #e2ecef;
}

.lista-tipos li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.lista-tipos p {
  margin: 0.25rem 0 0;
  color: #607077;
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
</style>
