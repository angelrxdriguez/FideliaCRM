<template>
  <div class="contenedor-pagina">
    <section class="rejilla-modulo">
      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Generar venta</h3>
          </div>
        </div>

        <article v-if="alertaSuccess" class="alerta alerta-success">
          {{ alertaSuccess }}
        </article>

        <article v-if="alertaDanger" class="alerta alerta-danger">
          {{ alertaDanger }}
        </article>

        <div v-if="cargando" class="estado-carga">Cargando datos de venta...</div>

        <form v-else class="formulario" @submit.prevent="registrarVenta">
          <label>
            Cliente de cartera
            <select v-model="formulario.id_cliente" required>
              <option value="">Selecciona un cliente</option>
              <option v-for="cliente in clientes" :key="cliente.id" :value="String(cliente.id)">
                {{ cliente.nombre }} · {{ cliente.tarifa }} ({{ formatearPorcentaje(cliente.porcentaje_beneficio) }})
              </option>
            </select>
          </label>

          <article v-if="clienteSeleccionado" class="resumen-cliente">
            <h4>Datos del cliente</h4>
            <p><strong>CIF:</strong> {{ clienteSeleccionado.cif || '-' }}</p>
            <p><strong>Telefono:</strong> {{ clienteSeleccionado.telefono || '-' }}</p>
            <p><strong>Email:</strong> {{ clienteSeleccionado.email || '-' }}</p>
          </article>

          <label>
            Observaciones
            <textarea v-model.trim="formulario.observaciones" rows="2" maxlength="255"></textarea>
          </label>

          <div class="separador"></div>

          <h4>Agregar productos</h4>

          <label>
            Buscar articulo
            <input
              v-model.trim="filtroArticulo"
              type="text"
              placeholder="Escribe al menos 3 letras"
            />
          </label>

          <div class="buscador-articulos">
            <p v-if="filtroArticulo.trim().length < 3" class="sin-resultados">
              Escribe al menos 3 letras para buscar articulos.
            </p>
            <ul v-else-if="articulosFiltrados.length > 0" class="lista-resultados">
              <li v-for="articulo in articulosFiltrados" :key="articulo.id">
                <span>{{ construirNombreArticulo(articulo) }} · SKU {{ articulo.sku || '-' }} · Stock {{ articulo.stock }}</span>
                <button type="button" class="boton-tabla" @click="agregarLinea(articulo.id)">
                  Agregar
                </button>
              </li>
            </ul>
            <p v-else class="sin-resultados">No se encontraron articulos con ese termino.</p>
          </div>

          <table v-if="lineasVenta.length > 0">
            <thead>
              <tr>
                <th>Articulo</th>
                <th>Stock</th>
                <th>Base</th>
                <th>Tarifa</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(linea, indice) in lineasVenta" :key="linea.articulo_id">
                <td>{{ construirNombreArticulo(linea) }}</td>
                <td>{{ linea.stock }}</td>
                <td>{{ formatearMoneda(linea.precio_base) }}</td>
                <td>{{ formatearMoneda(precioTarifaUnitario(linea)) }}</td>
                <td class="celda-cantidad">
                  <input
                    :value="linea.cantidad"
                    type="number"
                    min="1"
                    :max="linea.stock"
                    step="1"
                    @input="actualizarCantidad(indice, $event.target.value)"
                  />
                </td>
                <td>{{ formatearMoneda(subtotalLinea(linea)) }}</td>
                <td>
                  <button type="button" class="boton-tabla" @click="eliminarLinea(indice)">Quitar</button>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-else class="sin-resultados">Todavia no agregaste productos a la venta.</p>

          <div class="totales">
            <p><strong>Subtotal base:</strong> {{ formatearMoneda(subtotalBase) }}</p>
            <p><strong>Total venta:</strong> {{ formatearMoneda(totalVenta) }}</p>
          </div>

          <button type="submit" class="boton-principal" :disabled="guardando || !puedeRegistrarVenta">
            {{ guardando ? 'Registrando...' : 'Registrar venta' }}
          </button>
        </form>
      </article>

      <article class="panel">
        <div class="cabecera-panel">
          <div>
            <h3>Ventas recientes</h3>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Subtotal</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venta in ventasRecientes" :key="venta.id">
              <td>#{{ venta.id }}</td>
              <td>{{ formatearFecha(venta.fecha_venta) }}</td>
              <td>{{ venta.cliente }}</td>
              <td>{{ formatearMoneda(venta.subtotal_base) }}</td>
              <td>{{ formatearMoneda(venta.total_venta) }}</td>
            </tr>
            <tr v-if="ventasRecientes.length === 0">
              <td colspan="5" class="sin-resultados">No hay ventas registradas.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { enviar, obtener } from '../../servicios/api'

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
const articulos = ref([])
const ventasRecientes = ref([])
const lineasVenta = ref([])
const filtroArticulo = ref('')

const formulario = reactive({
  id_cliente: '',
  observaciones: '',
})

const clienteSeleccionado = computed(() =>
  clientes.value.find((cliente) => String(cliente.id) === formulario.id_cliente) || null
)

const porcentajeTarifa = computed(() => Number(clienteSeleccionado.value?.porcentaje_beneficio || 0))

const articulosFiltrados = computed(() => {
  const termino = filtroArticulo.value.trim().toLowerCase()

  if (termino.length < 3) {
    return []
  }

  return articulos.value.filter((articulo) => {
    const texto = `${articulo.nombre || ''} ${articulo.sku || ''} ${articulo.familia || ''} ${articulo.formato || ''}`
      .toLowerCase()
    return texto.includes(termino)
  })
})

const subtotalBase = computed(() =>
  lineasVenta.value.reduce((acumulado, linea) => acumulado + Number(linea.precio_base || 0) * linea.cantidad, 0)
)

const totalVenta = computed(() =>
  lineasVenta.value.reduce((acumulado, linea) => acumulado + subtotalLinea(linea), 0)
)

const puedeRegistrarVenta = computed(() => Boolean(formulario.id_cliente) && lineasVenta.value.length > 0)

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function construirNombreArticulo(articulo) {
  const nombre = articulo.nombre || ''
  const formato = articulo.formato || ''
  return formato ? `${nombre} - ${formato}` : nombre
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(valor || 0))
}

function formatearPorcentaje(valor) {
  return `${Number(valor || 0).toFixed(2)}%`
}

function formatearFecha(valor) {
  if (!valor) return '-'
  return new Date(valor).toLocaleString('es-ES')
}

function precioTarifaUnitario(linea) {
  const base = Number(linea.precio_base || 0)
  const precio = base * (1 + porcentajeTarifa.value / 100)
  return Math.round((precio + Number.EPSILON) * 100) / 100
}

function subtotalLinea(linea) {
  return precioTarifaUnitario(linea) * linea.cantidad
}

function reiniciarVenta() {
  formulario.id_cliente = ''
  formulario.observaciones = ''
  lineasVenta.value = []
  filtroArticulo.value = ''
}

function agregarLinea(articuloId) {
  limpiarAlertas()

  if (!formulario.id_cliente) {
    alertaDanger.value = 'Selecciona primero un cliente para aplicar la tarifa correspondiente.'
    return
  }

  const id = Number(articuloId)
  const cantidad = 1

  if (!Number.isInteger(id) || id <= 0) {
    alertaDanger.value = 'Selecciona un articulo valido.'
    return
  }

  const articulo = articulos.value.find((item) => item.id === id)

  if (!articulo) {
    alertaDanger.value = 'El articulo seleccionado no existe.'
    return
  }

  const existente = lineasVenta.value.find((linea) => linea.articulo_id === id)
  const cantidadObjetivo = (existente?.cantidad || 0) + cantidad

  if (cantidadObjetivo > Number(articulo.stock || 0)) {
    alertaDanger.value = `No puedes superar el stock disponible (${articulo.stock}) para ese articulo.`
    return
  }

  if (existente) {
    existente.cantidad = cantidadObjetivo
  } else {
    lineasVenta.value.push({
      articulo_id: articulo.id,
      nombre: articulo.nombre,
      sku: articulo.sku,
      formato: articulo.formato,
      unidad_medida: articulo.unidad_medida,
      familia: articulo.familia,
      stock: Number(articulo.stock || 0),
      precio_base: Number(articulo.precio_base || 0),
      cantidad,
    })
  }

  filtroArticulo.value = ''
}

function actualizarCantidad(indice, valor) {
  const linea = lineasVenta.value[indice]

  if (!linea) return

  const cantidad = Number(valor)

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    linea.cantidad = 1
    return
  }

  if (cantidad > linea.stock) {
    linea.cantidad = linea.stock
    return
  }

  linea.cantidad = cantidad
}

function eliminarLinea(indice) {
  lineasVenta.value.splice(indice, 1)
}

async function cargarDatos() {
  cargando.value = true
  limpiarAlertas()

  try {
    const payload = await obtener(
      `/api/ventas/comercial/${props.usuario.id}/datos`,
      'No se pudieron cargar los datos de ventas.'
    )

    clientes.value = payload.clientes || []
    articulos.value = payload.articulos || []
    ventasRecientes.value = payload.ventasRecientes || []
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function registrarVenta() {
  guardando.value = true
  limpiarAlertas()

  try {
    const payload = {
      id_cliente: Number(formulario.id_cliente),
      observaciones: formulario.observaciones,
      lineas: lineasVenta.value.map((linea) => ({
        articulo_id: linea.articulo_id,
        cantidad: Number(linea.cantidad),
      })),
    }

    const respuesta = await enviar(
      `/api/ventas/comercial/${props.usuario.id}`,
      payload,
      'No se pudo registrar la venta.'
    )

    alertaSuccess.value = `Venta #${respuesta.venta.id} registrada correctamente.`
    reiniciarVenta()
    await cargarDatos()
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
}

.rejilla-modulo {
  display: grid;
  grid-template-columns: minmax(360px, 500px) minmax(0, 1fr);
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

.resumen-cliente {
  border: 1px solid #d4e3e8;
  border-radius: 0.7rem;
  padding: 0.7rem;
  background: #f7fbfc;
}

.resumen-cliente h4 {
  margin: 0 0 0.45rem;
  color: #114b5f;
}

.resumen-cliente p {
  margin: 0.2rem 0;
  color: #40545b;
}

.buscador-articulos {
  border: 1px solid #d4e3e8;
  border-radius: 0.7rem;
  padding: 0.65rem;
}

.lista-resultados {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.lista-resultados li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid #e2ecef;
  border-radius: 0.55rem;
  padding: 0.45rem 0.55rem;
}

.lista-resultados li span {
  color: #32464d;
}

.totales {
  border-top: 1px solid #e2ecef;
  padding-top: 0.7rem;
}

.totales p {
  margin: 0.25rem 0;
}

.separador {
  height: 1px;
  background: #e2ecef;
  margin: 0.3rem 0;
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

.celda-cantidad input {
  max-width: 90px;
}

.boton-principal,
.boton-tabla {
  padding: 0.65rem 0.9rem;
  border-radius: 0.55rem;
  border: 1px solid transparent;
  cursor: pointer;
}

.boton-principal {
  background: #114b5f;
  color: #f5fbfc;
}

.boton-tabla {
  background: #ffffff;
  color: #114b5f;
  border-color: #114b5f;
}

.boton-principal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 1080px) {
  .rejilla-modulo {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .lista-resultados li {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
