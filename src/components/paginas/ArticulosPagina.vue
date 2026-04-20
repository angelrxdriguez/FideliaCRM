<template>
  <div class="contenedor-pagina">
    <section class="rejilla-modulo">
      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>{{ articuloEditandoId ? 'Editar articulo' : 'Crear articulo' }}</h3>
          </div>
        </div>

        <article v-if="alertaSuccess" class="alerta alerta-success">
          {{ alertaSuccess }}
        </article>

        <article v-if="alertaDanger" class="alerta alerta-danger">
          {{ alertaDanger }}
        </article>

        <form class="formulario" @submit.prevent="guardarArticulo">
          <label>
            Tipo de familia
            <select v-model="formulario.id_tipo" required>
              <option value="">Selecciona un tipo</option>
              <option v-for="tipo in tiposFamilia" :key="tipo.id" :value="String(tipo.id)">
                {{ tipo.nombre }}
              </option>
            </select>
          </label>

          <label>
            Familia
            <select v-model="formulario.familia_id" :disabled="!formulario.id_tipo" required>
              <option value="">
                {{ formulario.id_tipo ? 'Selecciona una familia' : 'Primero selecciona un tipo' }}
              </option>
              <option v-for="familia in familiasFiltradas" :key="familia.id" :value="String(familia.id)">
                {{ familia.nombre }}
              </option>
            </select>
          </label>

          <label>
            Nombre
            <input v-model.trim="formulario.nombre" type="text" required />
          </label>

          <label>
            SKU
            <input v-model.trim="formulario.sku" type="text" />
          </label>

          <label>
            Formato
            <input v-model.trim="formulario.formato" type="text" />
          </label>

          <label>
            Unidad de medida
            <input v-model.trim="formulario.unidad_medida" type="text" />
          </label>

          <label>
            Precio base
            <input v-model.number="formulario.precio_base" type="number" min="0" step="0.01" />
          </label>

          <label>
            Stock
            <input v-model.number="formulario.stock" type="number" min="0" step="1" />
          </label>

          <label>
            Descripcion
            <textarea v-model.trim="formulario.descripcion" rows="3"></textarea>
          </label>

          <label class="campo-checkbox">
            <input v-model="formulario.activo" type="checkbox" />
            <span>Articulo activo</span>
          </label>

          <div class="acciones-formulario">
            <button
              type="submit"
              class="boton-principal"
              :disabled="guardando || tiposFamilia.length === 0 || familiasFiltradas.length === 0"
            >
              {{ guardando ? 'Guardando...' : articuloEditandoId ? 'Guardar cambios' : 'Crear articulo' }}
            </button>
            <button type="button" class="boton-secundario" @click="reiniciarFormulario">
              {{ articuloEditandoId ? 'Cancelar edicion' : 'Limpiar' }}
            </button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Articulos por familia</h3>
          </div>
        </div>

        <div v-if="cargando" class="estado-carga">Cargando articulos...</div>

        <div v-else class="grupos-familias">
          <section v-for="familia in familiasConArticulos" :key="familia.id" class="bloque-familia">
            <div class="titulo-familia">
              <div>
                <h4>{{ familia.nombre }}</h4>
                <span class="etiqueta-tipo">{{ familia.tipo }}</span>
                <p>{{ familia.descripcion || 'Sin descripcion' }}</p>
              </div>
            </div>

            <table v-if="familia.articulos.length > 0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>SKU</th>
                  <th>Unidad</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="articulo in familia.articulos" :key="articulo.id">
                  <td>{{ construirNombreArticulo(articulo) }}</td>
                  <td>{{ articulo.sku || '-' }}</td>
                  <td>{{ articulo.unidad_medida || '-' }}</td>
                  <td>{{ articulo.stock }}</td>
                  <td>{{ formatearMoneda(articulo.precio_base) }}</td>
                  <td>
                    <span
                      class="badge-estado"
                      :class="articulo.activo ? 'estado-activo' : 'estado-bloqueado'"
                    >
                      {{ articulo.activo ? 'activo' : 'inactivo' }}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="boton-tabla" @click="editarArticulo(articulo)">
                      Editar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <p v-else class="sin-resultados">Esta familia todavia no tiene articulos.</p>
          </section>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { actualizar, enviar, obtener } from '../../servicios/api'

const cargando = ref(false)
const guardando = ref(false)
const alertaSuccess = ref('')
const alertaDanger = ref('')
const familiasConArticulos = ref([])
const familiasDisponibles = ref([])
const tiposFamilia = ref([])
const articuloEditandoId = ref(null)
const sincronizandoFormulario = ref(false)

const formulario = reactive({
  id_tipo: '',
  familia_id: '',
  nombre: '',
  descripcion: '',
  sku: '',
  formato: '',
  unidad_medida: '',
  precio_base: 0,
  stock: 0,
  activo: true,
})

const totalArticulos = computed(() =>
  familiasConArticulos.value.reduce((total, familia) => total + familia.articulos.length, 0)
)
const familiasFiltradas = computed(() =>
  familiasDisponibles.value.filter((familia) => String(familia.id_tipo) === formulario.id_tipo)
)

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function reiniciarFormulario() {
  articuloEditandoId.value = null
  formulario.id_tipo = ''
  formulario.familia_id = ''
  formulario.nombre = ''
  formulario.descripcion = ''
  formulario.sku = ''
  formulario.formato = ''
  formulario.unidad_medida = ''
  formulario.precio_base = 0
  formulario.stock = 0
  formulario.activo = true
}

watch(
  () => formulario.id_tipo,
  () => {
    if (!sincronizandoFormulario.value) {
      formulario.familia_id = ''
    }
  }
)

async function cargarArticulos() {
  cargando.value = true

  try {
    const payload = await obtener('/api/articulos', 'No se pudieron cargar los articulos.')
    familiasConArticulos.value = payload.familias
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function cargarFamilias() {
  try {
    const payload = await obtener('/api/familias', 'No se pudieron cargar las familias.')
    familiasDisponibles.value = payload.familias
  } catch (error) {
    alertaDanger.value = error.message
  }
}

async function cargarTiposFamilia() {
  try {
    const payload = await obtener('/api/tipos-familia', 'No se pudieron cargar los tipos de familia.')
    tiposFamilia.value = payload.tiposFamilia
  } catch (error) {
    alertaDanger.value = error.message
  }
}

async function guardarArticulo() {
  guardando.value = true
  limpiarAlertas()

  try {
    const payload = {
      ...formulario,
      familia_id: Number(formulario.familia_id),
    }

    if (articuloEditandoId.value) {
      await actualizar(
        `/api/articulos/${articuloEditandoId.value}`,
        payload,
        'No se pudo actualizar el articulo.'
      )
      alertaSuccess.value = 'Articulo actualizado correctamente.'
    } else {
      await enviar('/api/articulos', payload, 'No se pudo crear el articulo.')
      alertaSuccess.value = 'Articulo creado correctamente.'
    }

    reiniciarFormulario()
    await Promise.all([cargarArticulos(), cargarFamilias(), cargarTiposFamilia()])
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

async function editarArticulo(articulo) {
  const familia = familiasDisponibles.value.find((item) => item.id === articulo.familia_id)

  if (!familia) {
    alertaDanger.value = 'No se pudo preparar la edicion porque la familia del articulo no existe.'
    return
  }

  limpiarAlertas()
  articuloEditandoId.value = articulo.id
  sincronizandoFormulario.value = true
  formulario.id_tipo = String(familia.id_tipo)
  await nextTick()
  formulario.familia_id = String(articulo.familia_id)
  formulario.nombre = articulo.nombre || ''
  formulario.descripcion = articulo.descripcion || ''
  formulario.sku = articulo.sku || ''
  formulario.formato = articulo.formato || ''
  formulario.unidad_medida = articulo.unidad_medida || ''
  formulario.precio_base = Number(articulo.precio_base || 0)
  formulario.stock = Number(articulo.stock || 0)
  formulario.activo = Boolean(articulo.activo)
  sincronizandoFormulario.value = false
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(valor || 0))
}

function construirNombreArticulo(articulo) {
  const nombre = articulo.nombre || ''
  const formato = articulo.formato || ''

  return formato ? `${nombre} - ${formato}` : nombre
}

onMounted(() => {
  Promise.all([cargarArticulos(), cargarFamilias(), cargarTiposFamilia()])
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

.cabecera-panel h3,
.titulo-familia h4 {
  margin: 0;
  color: #114b5f;
}

.titulo-familia p {
  margin: 0.35rem 0 0;
  color: #4d626a;
}

.etiqueta-tipo {
  display: inline-flex;
  margin-top: 0.45rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #edf5f7;
  color: #114b5f;
  font-size: 0.78rem;
  font-weight: 700;
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
  cursor: not-allowed;
}

.boton-tabla {
  padding: 0.45rem 0.7rem;
  border-radius: 0.55rem;
  border: 1px solid #114b5f;
  background: #ffffff;
  color: #114b5f;
  font: inherit;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.boton-tabla:hover {
  background: #f1f7f9;
  color: #0d3c4c;
  transform: translateY(-1px);
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

.grupos-familias {
  display: grid;
  gap: 1rem;
}

.bloque-familia {
  border: 1px solid #e2ecef;
  border-radius: 0.9rem;
  padding: 0.9rem;
  background: #fbfdfd;
}

.titulo-familia {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.85rem;
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

@media (max-width: 1080px) {
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


