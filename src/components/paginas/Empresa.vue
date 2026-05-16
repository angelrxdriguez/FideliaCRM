<template>
  <div class="contenedor-pagina">
    <article class="panel">
      <div class="cabecera-panel">
        <div>
          <h3>Configuracion de empresa</h3>
          <p>Actualiza los datos fiscales, sociales y de contacto de la empresa.</p>
        </div>
      </div>

      <article v-if="alertaSuccess" class="alerta alerta-success">
        {{ alertaSuccess }}
      </article>

      <article v-if="alertaDanger" class="alerta alerta-danger">
        {{ alertaDanger }}
      </article>

      <div v-if="cargando" class="estado-carga">Cargando parametros de empresa...</div>

      <form v-else class="formulario" @submit.prevent="guardarParametros">
        <section class="bloque-imagen-empresa">
          <div class="cabecera-imagen-empresa">
            <div>
              <h4>Foto de empresa</h4>
              <p>Solo se guarda un archivo con nombre "empresa" dentro de `src/assets/img`.</p>
            </div>
            <button
              type="button"
              class="boton-secundario"
              :disabled="subiendoImagen"
              @click="abrirSelectorImagenEmpresa"
            >
              {{ subiendoImagen ? 'Subiendo...' : imagenEmpresaUrl ? 'Modificar foto' : 'Cargar foto' }}
            </button>
            <input
              ref="inputImagenEmpresa"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              class="input-oculto"
              @change="manejarCambioImagen"
            />
          </div>

          <div class="contenido-imagen-empresa">
            <img v-if="imagenEmpresaUrl" :src="imagenEmpresaUrl" :alt="imagenEmpresaNombre || 'Foto de empresa'" />
            <p v-else class="estado-imagen-vacia">No hay foto cargada.</p>
          </div>
        </section>

        <div class="formulario-rejilla">
          <label>
            Nombre comercial
            <input v-model.trim="formulario.nombre_comercial" type="text" />
          </label>

          <label>
            Razon social
            <input v-model.trim="formulario.razon_social" type="text" />
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
            Web
            <input v-model.trim="formulario.web" type="text" placeholder="https://..." />
          </label>

          <label class="campo-completo">
            Direccion fiscal
            <textarea v-model.trim="formulario.direccion_fiscal" rows="3"></textarea>
          </label>

          <label class="campo-completo">
            Direccion social
            <textarea v-model.trim="formulario.direccion_social" rows="3"></textarea>
          </label>

          <label>
            Ciudad
            <input v-model.trim="formulario.ciudad" type="text" list="lista-ciudades-cp-empresa" />
          </label>

          <label>
            Provincia
            <input v-model.trim="formulario.provincia" type="text" />
          </label>

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

          <label>
            Pais
            <input v-model.trim="formulario.pais" type="text" />
          </label>
        </div>

        <datalist id="lista-ciudades-cp-empresa">
          <option v-for="ciudad in ciudadesSugeridas" :key="ciudad" :value="ciudad"></option>
        </datalist>

        <div class="acciones-formulario">
          <button type="submit" class="boton-principal" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Guardar parametros' }}
          </button>
          <button type="button" class="boton-secundario" :disabled="guardando" @click="reiniciarFormulario">
            Restablecer
          </button>
        </div>
      </form>
    </article>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { actualizar, obtener } from '../../servicios/api'

const cargando = ref(false)
const guardando = ref(false)
const alertaSuccess = ref('')
const alertaDanger = ref('')
const parametrosIniciales = ref(null)
const cargandoCodigoPostal = ref(false)
const ciudadesSugeridas = ref([])
const subiendoImagen = ref(false)
const imagenEmpresaUrl = ref('')
const imagenEmpresaNombre = ref('')
const inputImagenEmpresa = ref(null)
let temporizadorCodigoPostal = null

const formulario = reactive({
  nombre_comercial: '',
  razon_social: '',
  cif: '',
  telefono: '',
  email: '',
  web: '',
  direccion_fiscal: '',
  direccion_social: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  pais: '',
})

function limpiarAlertas() {
  alertaSuccess.value = ''
  alertaDanger.value = ''
}

function aplicarParametros(parametros = {}) {
  formulario.nombre_comercial = parametros.nombre_comercial || ''
  formulario.razon_social = parametros.razon_social || ''
  formulario.cif = parametros.cif || ''
  formulario.telefono = parametros.telefono || ''
  formulario.email = parametros.email || ''
  formulario.web = parametros.web || ''
  formulario.direccion_fiscal = parametros.direccion_fiscal || ''
  formulario.direccion_social = parametros.direccion_social || ''
  formulario.ciudad = parametros.ciudad || ''
  formulario.provincia = parametros.provincia || ''
  formulario.codigo_postal = parametros.codigo_postal || ''
  formulario.pais = parametros.pais || ''
}

function reiniciarFormulario() {
  limpiarAlertas()
  aplicarParametros(parametrosIniciales.value || {})
  ciudadesSugeridas.value = []
}

function abrirSelectorImagenEmpresa() {
  inputImagenEmpresa.value?.click()
}

function archivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()

    lector.onload = () => {
      const resultado = String(lector.result || '')
      const partes = resultado.split(',')
      const contenido = partes.length > 1 ? partes[1] : ''

      if (!contenido) {
        reject(new Error('No se pudo procesar la imagen seleccionada.'))
        return
      }

      resolve(contenido)
    }

    lector.onerror = () => {
      reject(new Error('No se pudo leer la imagen seleccionada.'))
    }

    lector.readAsDataURL(archivo)
  })
}

async function cargarImagenEmpresa() {
  try {
    const payload = await obtener('/api/empresa-imagen', 'No se pudo cargar la imagen de empresa.')
    const imagen = payload.imagen || {}

    if (!imagen.existe) {
      imagenEmpresaUrl.value = ''
      imagenEmpresaNombre.value = ''
      return
    }

    imagenEmpresaUrl.value = imagen.url || ''
    imagenEmpresaNombre.value = imagen.nombre || ''
  } catch (error) {
    imagenEmpresaUrl.value = ''
    imagenEmpresaNombre.value = ''
    alertaDanger.value = error.message
  }
}

async function manejarCambioImagen(evento) {
  const input = evento.target
  const archivo = input?.files?.[0]

  if (!archivo) {
    return
  }

  limpiarAlertas()

  subiendoImagen.value = true

  try {
    const contenidoBase64 = await archivoABase64(archivo)
    const payload = await actualizar(
      '/api/empresa-imagen',
      {
        nombre_archivo: archivo.name,
        mime_type: archivo.type,
        contenido_base64: contenidoBase64,
      },
      'No se pudo guardar la imagen de empresa.'
    )

    const imagen = payload.imagen || {}
    imagenEmpresaUrl.value = imagen.url || ''
    imagenEmpresaNombre.value = imagen.nombre || ''
    alertaSuccess.value = 'Imagen de empresa actualizada correctamente.'
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    subiendoImagen.value = false
    input.value = ''
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

async function cargarParametros() {
  cargando.value = true

  try {
    const payload = await obtener('/api/empresa-parametros', 'No se pudieron cargar los parametros de empresa.')
    parametrosIniciales.value = payload.parametros || {}
    aplicarParametros(parametrosIniciales.value)
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    cargando.value = false
  }
}

async function guardarParametros() {
  guardando.value = true
  limpiarAlertas()

  try {
    const payload = await actualizar(
      '/api/empresa-parametros',
      { ...formulario },
      'No se pudieron guardar los parametros de empresa.'
    )

    parametrosIniciales.value = payload.parametros || { ...formulario }
    aplicarParametros(parametrosIniciales.value)
    alertaSuccess.value = 'Parametros de empresa actualizados correctamente.'
  } catch (error) {
    alertaDanger.value = error.message
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarParametros()
  cargarImagenEmpresa()
})

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
  margin-bottom: 1rem;
}

.cabecera-panel h3 {
  margin: 0;
  color: #114b5f;
}

.cabecera-panel p {
  margin: 0.35rem 0 0;
  color: #607077;
}

.formulario {
  display: grid;
  gap: 1rem;
}

.formulario-rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 0.85rem;
}

.formulario label {
  display: grid;
  gap: 0.35rem;
  color: #32464d;
}

.campo-completo {
  grid-column: 1 / -1;
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

.boton-principal:disabled,
.boton-secundario:disabled {
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

.estado-carga {
  color: #607077;
}

.bloque-imagen-empresa {
  border: 1px dashed #b8ccd3;
  border-radius: 0.8rem;
  padding: 0.85rem;
  display: grid;
  gap: 0.7rem;
}

.cabecera-imagen-empresa {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cabecera-imagen-empresa h4 {
  margin: 0;
  color: #114b5f;
}

.cabecera-imagen-empresa p {
  margin: 0.25rem 0 0;
  color: #607077;
  font-size: 0.92rem;
}

.input-oculto {
  display: none;
}

.contenido-imagen-empresa {
  background: #f7fbfc;
  border: 1px solid #d4e3e8;
  border-radius: 0.75rem;
  min-height: 180px;
  padding: 0.65rem;
  display: grid;
  place-items: center;
}

.contenido-imagen-empresa img {
  max-width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: 0.55rem;
}

.estado-imagen-vacia {
  margin: 0;
  color: #607077;
  text-align: center;
}

@media (max-width: 820px) {
  .formulario-rejilla {
    grid-template-columns: 1fr;
  }
}
</style>
