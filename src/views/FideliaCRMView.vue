<template>
  <div class="pagina-crm">
    <aside class="menu-izquierdo">
      <div class="logo-crm">
        <span class="logo-icono">FDB</span>
        <div>
          <h1>Fidelia CRM</h1>
          <p>Gestion comercial conectada a MySQL</p>
        </div>
      </div>

      <nav class="navegacion-menu">
        <button
          v-for="pagina in paginas"
          :key="pagina.id"
          type="button"
          class="boton-menu"
          :class="{ activo: paginaActiva === pagina.id }"
          @click="paginaActiva = pagina.id"
        >
          <span>{{ pagina.nombre }}</span>
          <small>{{ pagina.descripcion }}</small>
        </button>
      </nav>

      <section class="panel-informativo">
        <p class="etiqueta-panel">Modulos</p>
        <strong>{{ paginaActual.nombre }}</strong>
        <span>{{ paginaActual.descripcion }}</span>
      </section>
    </aside>

    <main class="contenido-principal">
      <header class="cabecera-contenido">
        <div>
          <p class="etiqueta-panel contenido-etiqueta">Modulo activo</p>
          <h2>{{ paginaActual.nombre }}</h2>
          <p class="texto-ayuda">{{ paginaActual.ayuda }}</p>
        </div>
      </header>

      <component :is="componenteActivo" />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ArticulosPagina from '../components/paginas/ArticulosPagina.vue'
import FamiliasPagina from '../components/paginas/FamiliasPagina.vue'
import InicioPagina from '../components/paginas/InicioPagina.vue'
import UsuariosPagina from '../components/paginas/UsuariosPagina.vue'

const paginas = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    descripcion: 'Resumen general',
    ayuda: 'Vision general de conexion, volumen y ultimos registros.',
    componente: InicioPagina,
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Alta segura',
    ayuda: 'Creacion de usuarios con password hasheada mediante bcrypt con 12 rondas.',
    componente: UsuariosPagina,
  },
  {
    id: 'familias',
    nombre: 'Familias',
    descripcion: 'Clasificacion',
    ayuda: 'Gestion de familias para organizar el catalogo de articulos.',
    componente: FamiliasPagina,
  },
  {
    id: 'articulos',
    nombre: 'Articulos',
    descripcion: 'Catalogo por familia',
    ayuda: 'Alta de articulos y visualizacion agrupada por familias.',
    componente: ArticulosPagina,
  },
]

const paginaActiva = ref('inicio')

const paginaActual = computed(
  () => paginas.find((pagina) => pagina.id === paginaActiva.value) || paginas[0]
)

const componenteActivo = computed(() => paginaActual.value.componente)
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
  opacity: 0.85;
  font-size: 0.9rem;
}

.logo-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(245, 251, 252, 0.45);
  border-radius: 0.8rem;
  font-size: 0.88rem;
  font-weight: 700;
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

.boton-menu small {
  opacity: 0.78;
}

.boton-menu:hover,
.boton-menu.activo {
  background: rgba(245, 251, 252, 0.14);
  transform: translateY(-1px);
}

.panel-informativo {
  display: grid;
  gap: 0.25rem;
  padding: 0.95rem;
  border: 1px solid rgba(245, 251, 252, 0.2);
  border-radius: 0.85rem;
  background: rgba(245, 251, 252, 0.08);
}

.etiqueta-panel {
  margin: 0;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.82;
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

.cabecera-contenido h2 {
  margin: 0;
  color: var(--color-principal);
}

.contenido-etiqueta {
  color: var(--color-principal);
  opacity: 1;
}

.texto-ayuda {
  margin: 0.35rem 0 0;
  color: #4d626a;
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
