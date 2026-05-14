<template>
  <div class="pagina-gestor">
    <header class="barra-superior">
      <div class="marca">
        <h1>Fidelia CRM</h1>
        <p>Gestor comercial</p>
      </div>

      <nav class="navegacion-principal">
        <button
          v-for="pagina in paginas"
          :key="pagina.id"
          type="button"
          class="boton-nav"
          :class="{ activo: paginaActiva === pagina.id }"
          @click="paginaActiva = pagina.id"
        >
          {{ pagina.nombre }}
        </button>
      </nav>
    </header>

    <main class="contenido-principal">
      <header class="cabecera-contenido">
        <h2>{{ paginaActual.nombre }}</h2>
      </header>

      <component
        :is="componenteActivo"
        :usuario="usuario"
        @cerrar-sesion="$emit('cerrar-sesion')"
      />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import GestorVentasComercialesPagina from '../components/paginas/GestorVentasComercialesPagina.vue'
import PerfilPagina from '../components/paginas/PerfilPagina.vue'

const props = defineProps({
  usuario: {
    type: Object,
    required: true,
  },
})

defineEmits(['cerrar-sesion'])

const paginas = [
  {
    id: 'ventas-comerciales',
    nombre: 'Ventas por comercial',
    componente: GestorVentasComercialesPagina,
  },
  {
    id: 'perfil',
    nombre: 'Perfil',
    componente: PerfilPagina,
  },
]

const paginaActiva = ref('ventas-comerciales')
const paginaActual = computed(
  () => paginas.find((pagina) => pagina.id === paginaActiva.value) || paginas[0]
)
const componenteActivo = computed(() => paginaActual.value.componente)
const usuario = computed(() => props.usuario)
</script>

<style scoped>
.pagina-gestor {
  min-height: 100vh;
  background: #f3f5f7;
  color: #24343a;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

* {
  box-sizing: border-box;
}

.barra-superior {
  border-bottom: 1px solid #d9dee3;
  background: #ffffff;
  padding: 0.95rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.marca h1 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2d3d;
}

.marca p {
  margin: 0.2rem 0 0;
  color: #5b6978;
  font-size: 0.9rem;
}

.navegacion-principal {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.boton-nav {
  border: 1px solid #cad3db;
  background: #ffffff;
  border-radius: 0.55rem;
  padding: 0.55rem 0.75rem;
  color: #2f3c4a;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.boton-nav:hover,
.boton-nav.activo {
  border-color: #7f95a8;
  background: #eef4f8;
}

.contenido-principal {
  padding: 1.3rem;
  display: grid;
  gap: 0.9rem;
}

.cabecera-contenido h2 {
  margin: 0;
  color: #1f2d3d;
}

@media (max-width: 640px) {
  .barra-superior {
    padding: 0.9rem 1rem;
  }

  .contenido-principal {
    padding: 1rem;
  }
}
</style>
