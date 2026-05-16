<template>
  <div class="pagina-crm">
    <aside class="menu-izquierdo">
      <div class="logo-crm">
        <MarcaEmpresa />
      </div>

      <nav class="navegacion-menu">
        <button
          v-for="pagina in paginasMenu"
          :key="pagina.id"
          type="button"
          class="boton-menu"
          :class="{ activo: paginaActiva === pagina.id }"
          @click="paginaActiva = pagina.id"
        >
          <span>{{ pagina.nombre }}</span>
        </button>
      </nav>
    </aside>

    <main class="contenido-principal">
      <header class="cabecera-contenido">
        <div>
          <h2>{{ paginaActual.nombre }}</h2>
        </div>

        <button
          type="button"
          class="boton-perfil"
          :class="{ activo: paginaActiva === 'perfil' }"
          aria-label="Abrir perfil"
          @click="paginaActiva = 'perfil'"
        >
          Perfil
        </button>
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
import MarcaEmpresa from '../components/comunes/MarcaEmpresa.vue'
import ClientesComercialPagina from '../components/paginas/ClientesComercial.vue'
import PerfilPagina from '../components/paginas/Perfil.vue'
import VentasComercialPagina from '../components/paginas/VentasComercial.vue'

const props = defineProps({
  usuario: {
    type: Object,
    required: true,
  },
})

defineEmits(['cerrar-sesion'])

const paginas = [
  {
    id: 'ventas',
    nombre: 'Ventas',
    componente: VentasComercialPagina,
  },
  {
    id: 'mis-clientes',
    nombre: 'Mis clientes',
    componente: ClientesComercialPagina,
  },
  {
    id: 'perfil',
    nombre: 'Perfil',
    componente: PerfilPagina,
  },
]

const paginaActiva = ref('ventas')
const paginasMenu = computed(() => paginas.filter((pagina) => pagina.id !== 'perfil'))
const paginaActual = computed(
  () => paginas.find((pagina) => pagina.id === paginaActiva.value) || paginas[0]
)
const componenteActivo = computed(() => paginaActual.value.componente)
const usuario = computed(() => props.usuario)
</script>

<style scoped>
.pagina-crm {
  --color-principal: #114b5f;
  --color-sobre-principal: #f5fbfc;
  --color-fondo-suave: #e5eff2;
  --color-texto-base: #24343a;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 290px 1fr;
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

.navegacion-menu {
  display: grid;
  gap: 0.55rem;
}

.boton-menu {
  text-align: left;
  display: grid;
  gap: 0.18rem;
  border: 1px solid rgba(245, 251, 252, 0.25);
  background: transparent;
  color: var(--color-sobre-principal);
  border-radius: 0.7rem;
  padding: 0.8rem 0.85rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease;
}

.boton-menu:hover,
.boton-menu.activo {
  background: rgba(245, 251, 252, 0.14);
  transform: translateY(-1px);
}

.contenido-principal {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.cabecera-contenido {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.cabecera-contenido h2 {
  margin: 0;
  color: var(--color-principal);
}

.boton-perfil {
  min-height: 52px;
  flex-shrink: 0;
  border: 1px solid rgba(17, 75, 95, 0.18);
  border-radius: 1rem;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
  font: inherit;
  font-weight: 600;
  color: var(--color-principal);
  padding: 0.7rem 1rem;
}

.boton-perfil:hover,
.boton-perfil.activo {
  transform: translateY(-1px);
  border-color: rgba(17, 75, 95, 0.38);
  background: #f4f9fa;
}

@media (max-width: 900px) {
  .pagina-crm {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .contenido-principal {
    padding: 1rem;
  }
}
</style>
