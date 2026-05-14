<template>
  <div class="contenedor-pagina">
    <section class="contenedor-alertas">
      <article v-if="alertaDanger" class="alerta alerta-danger">
        <div>
          <strong>Error de conexion</strong>
          <p>{{ alertaDanger }}</p>
        </div>
        <button type="button" class="cerrar-alerta" @click="alertaDanger = ''">x</button>
      </article>
    </section>

    <section class="bloque-estado">
      <article class="tarjeta-estado">
        <div>
          <p class="etiqueta-panel">Base de datos</p>
          <h3>{{ conexion.baseDeDatos || 'fidelia' }}</h3>
        </div>
        <span class="badge-conexion" :class="conexionActiva ? 'ok' : 'ko'">
          {{ conexionActiva ? 'conectado' : 'sin conexion' }}
        </span>
      </article>
    </section>

    <section class="rejilla-estadisticas">
      <article class="tarjeta-estadistica">
        <h3>Articulos</h3>
        <p class="numero-estadistica">{{ resumen.articulos }}</p>
        <small>Registros disponibles en catalogo.</small>
      </article>

      <article class="tarjeta-estadistica">
        <h3>Familias</h3>
        <p class="numero-estadistica">{{ resumen.familias }}</p>
        <small>Grupos activos en la base de datos.</small>
      </article>

      <article class="tarjeta-estadistica">
        <h3>Usuarios</h3>
        <p class="numero-estadistica">{{ resumen.usuarios }}</p>
        <small>Usuarios registrados en el sistema.</small>
      </article>

      <article class="tarjeta-estadistica">
        <h3>Articulos activos</h3>
        <p class="numero-estadistica">{{ articulosActivos }}</p>
        <small>Calculado sobre los ultimos articulos cargados.</small>
      </article>
    </section>

    <section class="paneles-resumen">
      <article class="panel-tabla">
        <div class="cabecera-panel">
          <div>
            <h3>Ultimos articulos</h3>
          </div>
        </div>

        <div v-if="cargando" class="estado-carga">Cargando datos...</div>

        <table v-else>
          <thead>
            <tr>
              <th>Articulo</th>
              <th>Familia</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="articulo in articulos" :key="articulo.id">
              <td>{{ articulo.nombre }}</td>
              <td>{{ articulo.familia || 'Sin familia' }}</td>
              <td>{{ articulo.sku || '-' }}</td>
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
            <tr v-if="!cargando && articulos.length === 0">
              <td colspan="6" class="sin-resultados">No hay articulos disponibles.</td>
            </tr>
          </tbody>
        </table>
      </article>

      <div class="columna-secundaria">
        <article class="panel-tabla">
          <div class="cabecera-panel">
            <h3>Familias</h3>
          </div>

          <ul class="lista-simple">
            <li v-for="familia in familias" :key="familia.id">
              <strong>{{ familia.nombre }}</strong>
              <span class="etiqueta-tipo">{{ familia.tipo || 'Sin tipo' }}</span>
              <span>{{ familia.descripcion || 'Sin descripcion' }}</span>
            </li>
            <li v-if="!cargando && familias.length === 0" class="sin-resultados-lista">
              No hay familias cargadas.
            </li>
          </ul>
        </article>

        <article class="panel-tabla">
          <div class="cabecera-panel">
            <h3>Usuarios</h3>
          </div>

          <ul class="lista-simple">
            <li v-for="usuario in usuarios" :key="usuario.id">
              <strong>{{ usuario.nombre_completo }}</strong>
              <span>{{ usuario.correo }}</span>
            </li>
            <li v-if="!cargando && usuarios.length === 0" class="sin-resultados-lista">
              No hay usuarios cargados.
            </li>
          </ul>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { obtener } from '../../servicios/api'

const cargando = ref(false)
const alertaDanger = ref('')
const conexionActiva = ref(false)

const conexion = reactive({
  baseDeDatos: '',
  servidor: '',
})

const resumen = reactive({
  articulos: 0,
  familias: 0,
  usuarios: 0,
})

const articulos = ref([])
const familias = ref([])
const usuarios = ref([])

const articulosActivos = computed(() => articulos.value.filter((articulo) => articulo.activo).length)

function limpiarAlertas() {
  alertaDanger.value = ''
}

function aplicarDatos(payload) {
  conexion.baseDeDatos = payload.conexion.baseDeDatos
  conexion.servidor = payload.conexion.servidor
  resumen.articulos = payload.resumen.articulos
  resumen.familias = payload.resumen.familias
  resumen.usuarios = payload.resumen.usuarios
  articulos.value = payload.articulos
  familias.value = payload.familias
  usuarios.value = payload.usuarios
}

async function cargarInicio() {
  cargando.value = true
  limpiarAlertas()

  try {
    const payload = await obtener('/api/inicio', 'No se pudo cargar el inicio.')
    aplicarDatos(payload)
    conexionActiva.value = true
  } catch (error) {
    conexionActiva.value = false
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(valor || 0))
}

onMounted(() => {
  cargarInicio()
})
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
  gap: 1rem;
}

.contenedor-alertas {
  display: grid;
  gap: 0.75rem;
}

.alerta {
  border-radius: 0.8rem;
  padding: 0.9rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.alerta p {
  margin: 0.2rem 0 0;
}

.alerta-danger {
  background: #fdeceb;
  border: 1px solid #c3423f;
  color: #8f2623;
}

.cerrar-alerta {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
}

.bloque-estado {
  display: grid;
}

.tarjeta-estado {
  background: #ffffff;
  border: 1px solid #d4e3e8;
  border-radius: 1rem;
  padding: 1.1rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.etiqueta-panel {
  margin: 0;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6a7b81;
}


.badge-conexion {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 130px;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.badge-conexion.ok {
  background: #ddf7e6;
  color: #116b39;
}

.badge-conexion.ko {
  background: #fde4e2;
  color: #b42318;
}

.rejilla-estadisticas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
}

.tarjeta-estadistica,
.panel-tabla {
  background: #ffffff;
  border: 1px solid #d4e3e8;
  border-radius: 1rem;
  padding: 1rem;
}

.tarjeta-estadistica h3,
.cabecera-panel h3 {
  margin: 0;
  color: #114b5f;
}

.numero-estadistica {
  margin: 0.45rem 0 0.2rem;
  font-size: 2rem;
  font-weight: 700;
  color: #114b5f;
}

.paneles-resumen {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.9fr);
  gap: 1rem;
}

.columna-secundaria {
  display: grid;
  gap: 1rem;
}

.cabecera-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.9rem;
}


.estado-carga {
  padding: 1.2rem 0;
  color: #5f7077;
}

.lista-simple {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.lista-simple li {
  display: grid;
  gap: 0.2rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2ecef;
}

.lista-simple li:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.lista-simple span {
  color: #607077;
  word-break: break-word;
}

.etiqueta-tipo {
  display: inline-flex;
  width: fit-content;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #edf5f7;
  color: #114b5f;
  font-size: 0.78rem;
  font-weight: 700;
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

.sin-resultados,
.sin-resultados-lista {
  color: #607077;
}

@media (max-width: 1180px) {
  .rejilla-estadisticas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .paneles-resumen {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .tarjeta-estado {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .rejilla-estadisticas {
    grid-template-columns: 1fr;
  }

  table {
    display: block;
    overflow-x: auto;
  }
}
</style>


