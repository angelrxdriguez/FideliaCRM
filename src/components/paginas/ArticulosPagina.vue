<template>
  <div class="contenedor-pagina">
    <section class="rejilla-modulo">
      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Crear articulo</h3>
            <p class="texto-ayuda">Selecciona una familia y registra el articulo en el catalogo.</p>
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
            Familia
            <select v-model="formulario.familia_id" required>
              <option value="">Selecciona una familia</option>
              <option v-for="familia in familiasDisponibles" :key="familia.id" :value="String(familia.id)">
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
            <button type="submit" class="boton-principal" :disabled="guardando || familiasDisponibles.length === 0">
              {{ guardando ? 'Guardando...' : 'Crear articulo' }}
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
            <h3>Articulos por familia</h3>
            <p class="texto-ayuda">Tabla seccionada para revisar el catalogo agrupado.</p>
          </div>
          <span class="contador-panel">{{ totalArticulos }}</span>
        </div>

        <div v-if="cargando" class="estado-carga">Cargando articulos...</div>

        <div v-else class="grupos-familias">
          <section v-for="familia in familiasConArticulos" :key="familia.id" class="bloque-familia">
            <div class="titulo-familia">
              <div>
                <h4>{{ familia.nombre }}</h4>
                <p>{{ familia.descripcion || 'Sin descripcion' }}</p>
              </div>
              <span class="badge-total">{{ familia.articulos.length }}</span>
            </div>

            <table v-if="familia.articulos.length > 0">
              <thead>
                <tr>
                  <th>Articulo</th>
                  <th>SKU</th>
                  <th>Formato</th>
                  <th>Unidad</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="articulo in familia.articulos" :key="articulo.id">
                  <td>{{ articulo.nombre }}</td>
                  <td>{{ articulo.sku || '-' }}</td>
                  <td>{{ articulo.formato || '-' }}</td>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { enviar, obtener } from '../../servicios/api'

const cargando = ref(false)
const guardando = ref(false)
const alertaSuccess = ref('')
const alertaDanger = ref('')
const familiasConArticulos = ref([])
const familiasDisponibles = ref([])

const formulario = reactive({
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

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function reiniciarFormulario() {
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

async function guardarArticulo() {
  guardando.value = true
  limpiarAlertas()

  try {
    await enviar(
      '/api/articulos',
      {
        ...formulario,
        familia_id: Number(formulario.familia_id),
      },
      'No se pudo crear el articulo.'
    )
    alertaSuccess.value = 'Articulo creado correctamente.'
    reiniciarFormulario()
    await Promise.all([cargarArticulos(), cargarFamilias()])
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(valor || 0))
}

onMounted(() => {
  Promise.all([cargarArticulos(), cargarFamilias()])
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

.texto-ayuda,
.titulo-familia p {
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
  gap: 0.8rem;
}

.formulario label {
  display: grid;
  gap: 0.35rem;
  color: #32464d;
}

input,
select,
textarea {
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
