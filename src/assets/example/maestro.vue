<template>
  <div class="pagina-crm">
    <aside class="menu-izquierdo">
      <div class="logo-crm">
        <span class="logo-icono">FDB</span>
        <div>
          <h1>Fidelia CRM</h1>
          <p>Inicio conectado a MySQL</p>
        </div>
      </div>

      <nav class="navegacion-menu">
        <button
          v-for="seccion in secciones"
          :key="seccion.id"
          type="button"
          class="boton-menu"
          :class="{ activo: seccionActiva === seccion.id }"
          @click="seccionActiva = seccion.id"
        >
          {{ seccion.nombre }}
        </button>
      </nav>

      <section class="panel-servidor">
        <p class="etiqueta-panel">Servidor</p>
        <strong>{{ conexion.servidor || 'Sin verificar' }}</strong>
        <span>{{ conexion.baseDeDatos || 'fidelia' }}</span>
      </section>

      <div class="resumen-menu">
        <button type="button" class="boton-principal" @click="cargarInicio">
          Recargar datos
        </button>
        <button type="button" class="boton-secundario" @click="verificarConexion">
          Probar conexion
        </button>
      </div>
    </aside>

    <main class="contenido-principal">
      <header class="cabecera-contenido">
        <div>
          <h2>Panel inicial</h2>
          <p class="texto-ayuda">
            Primera pantalla de la web leyendo datos reales desde tu base de datos WAMP `fidelia`.
          </p>
        </div>
        <div class="grupo-botones-cabecera">
          <button type="button" class="boton-secundario" @click="verificarConexion">
            Verificar SQL
          </button>
          <button type="button" class="boton-principal" @click="cargarInicio">
            Actualizar
          </button>
        </div>
      </header>

      <section class="contenedor-alertas">
        <article v-if="alertaSuccess" class="alerta alerta-success">
          <div>
            <strong>Conexion correcta</strong>
            <p>{{ alertaSuccess }}</p>
          </div>
          <button type="button" class="cerrar-alerta" @click="alertaSuccess = ''">x</button>
        </article>

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
            <p class="texto-ayuda">Estado actual del acceso a MySQL desde la API local.</p>
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
              <p class="texto-ayuda">Consulta directa desde MySQL.</p>
            </div>
            <span class="contador-panel">{{ articulos.length }}</span>
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
              <span class="contador-panel">{{ familias.length }}</span>
            </div>

            <ul class="lista-simple">
              <li v-for="familia in familias" :key="familia.id">
                <strong>{{ familia.nombre }}</strong>
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
              <span class="contador-panel">{{ usuarios.length }}</span>
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
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const secciones = [
  { id: 'resumen', nombre: 'Resumen' },
  { id: 'articulos', nombre: 'Articulos' },
  { id: 'familias', nombre: 'Familias' },
  { id: 'usuarios', nombre: 'Usuarios' },
]

const seccionActiva = ref('resumen')
const cargando = ref(false)
const alertaSuccess = ref('')
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
  alertaSuccess.value = ''
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
    const respuesta = await fetch('/api/inicio')
    const payload = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(payload.mensaje || 'No se pudo cargar el inicio.')
    }

    aplicarDatos(payload)
    conexionActiva.value = true
    alertaSuccess.value = 'La portada se ha sincronizado con la base de datos fidelia.'
  } catch (error) {
    conexionActiva.value = false
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function verificarConexion() {
  limpiarAlertas()

  try {
    const respuesta = await fetch('/api/salud')
    const payload = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(payload.mensaje || 'No se pudo validar la conexion.')
    }

    conexion.baseDeDatos = payload.baseDeDatos
    conexion.servidor = payload.servidor
    conexionActiva.value = true
    alertaSuccess.value = 'La conexion con MySQL responde correctamente.'
  } catch (error) {
    conexionActiva.value = false
    alertaDanger.value = error.message
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
.pagina-crm {
  --color-principal: #114b5f;
  --color-sobre-principal: #f5fbfc;
  --color-fondo-suave: #e5eff2;
  --color-texto-base: #24343a;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  background:
    radial-gradient(circle at top right, rgba(17, 75, 95, 0.08), transparent 22%),
    linear-gradient(180deg, #edf5f7 0%, var(--color-fondo-suave) 100%);
  color: var(--color-texto-base);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

* {
  box-sizing: border-box;
}

.menu-izquierdo {
  background: var(--color-principal);
  color: var(--color-sobre-principal);
  padding: 1.4rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logo-crm {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.logo-crm h1,
.logo-crm p {
  margin: 0;
}

.logo-crm p {
  opacity: 0.8;
  font-size: 0.9rem;
}

.logo-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(245, 251, 252, 0.45);
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.navegacion-menu {
  display: grid;
  gap: 0.45rem;
}

.boton-menu,
.boton-principal,
.boton-secundario {
  border-radius: 0.6rem;
  cursor: pointer;
  font: inherit;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.boton-menu {
  text-align: left;
  border: 1px solid rgba(245, 251, 252, 0.25);
  background: transparent;
  color: var(--color-sobre-principal);
  padding: 0.75rem 0.8rem;
}

.boton-menu.activo,
.boton-menu:hover {
  background: rgba(245, 251, 252, 0.14);
}

.panel-servidor {
  display: grid;
  gap: 0.2rem;
  padding: 0.9rem;
  border: 1px solid rgba(245, 251, 252, 0.2);
  border-radius: 0.8rem;
  background: rgba(245, 251, 252, 0.08);
}

.etiqueta-panel {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
}

.resumen-menu {
  display: grid;
  gap: 0.6rem;
}

.contenido-principal {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.cabecera-contenido {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.cabecera-contenido h2,
.cabecera-panel h3,
.tarjeta-estadistica h3,
.tarjeta-estado h3 {
  margin: 0;
  color: var(--color-principal);
}

.texto-ayuda {
  margin: 0.35rem 0 0;
  color: #4d626a;
}

.grupo-botones-cabecera {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
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

.cerrar-alerta {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1rem;
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

.numero-estadistica {
  margin: 0.45rem 0 0.2rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-principal);
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

.contador-panel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #e5eff2;
  color: var(--color-principal);
  font-weight: 700;
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
  color: var(--color-principal);
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

.boton-principal,
.boton-secundario {
  padding: 0.7rem 1rem;
  border: 1px solid transparent;
}

.boton-principal {
  background: var(--color-principal);
  color: var(--color-sobre-principal);
  box-shadow: 0 8px 18px rgba(17, 75, 95, 0.16);
}

.boton-principal:hover {
  background: #0d3c4c;
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(17, 75, 95, 0.22);
}

.boton-secundario {
  background: #ffffff;
  color: var(--color-principal);
  border-color: var(--color-principal);
}

.boton-secundario:hover {
  background: #f1f7f9;
  color: #0d3c4c;
  border-color: #0d3c4c;
  transform: translateY(-1px);
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
  .pagina-crm {
    grid-template-columns: 1fr;
  }

  .cabecera-contenido,
  .tarjeta-estado {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .contenido-principal {
    padding: 1rem;
  }

  .rejilla-estadisticas {
    grid-template-columns: 1fr;
  }

  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
