<template>
  <div class="contenedor-pagina">
    <section class="rejilla-perfil">
      <article class="panel panel-destacado">
        <div class="cabecera-perfil">
          <div class="avatar-perfil">
            {{ iniciales }}
          </div>
          <div>
            <p class="eyebrow">Perfil</p>
            <h3>{{ usuario.nombre_completo }}</h3>
          </div>
        </div>

        <dl class="datos-perfil">
          <div>
            <dt>Correo</dt>
            <dd>{{ usuario.correo }}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{{ usuario.rol || 'Sin rol asignado' }}</dd>
          </div>
          <div>
            <dt>ID de usuario</dt>
            <dd>#{{ usuario.id }}</dd>
          </div>
        </dl>

        <button type="button" class="boton-cerrar-sesion" @click="$emit('cerrar-sesion')">
          Cerrar sesion
        </button>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  usuario: {
    type: Object,
    required: true,
  },
})

defineEmits(['cerrar-sesion'])

const iniciales = computed(() =>
  (props.usuario.nombre_completo || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || '')
    .join('') || 'U'
)
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
}

.rejilla-perfil {
  display: grid;
  grid-template-columns: minmax(320px, 680px);
}

.panel {
  background: #ffffff;
  border: 1px solid #d4e3e8;
  border-radius: 1rem;
  padding: 1.2rem;
}

.panel-destacado {
  background:
    radial-gradient(circle at top right, rgba(17, 75, 95, 0.09), transparent 32%),
    #ffffff;
}

.cabecera-perfil {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-perfil {
  width: 68px;
  height: 68px;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #114b5f;
  color: #f5fbfc;
  font-size: 1.2rem;
  font-weight: 700;
  flex-shrink: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6a7b81;
}

.cabecera-perfil h3 {
  margin: 0.3rem 0 0;
  color: #114b5f;
}


.datos-perfil {
  display: grid;
  gap: 0.9rem;
  margin: 1.3rem 0 0;
}

.datos-perfil div {
  padding: 0.9rem 0;
  border-bottom: 1px solid #e2ecef;
}

.datos-perfil div:last-child {
  border-bottom: 0;
}

.datos-perfil dt {
  color: #6a7b81;
  font-size: 0.82rem;
  margin-bottom: 0.28rem;
}

.datos-perfil dd {
  margin: 0;
  color: #24343a;
  font-weight: 600;
}

.boton-cerrar-sesion {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.65rem;
  border: 1px solid #114b5f;
  background: #114b5f;
  color: #f5fbfc;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.boton-cerrar-sesion:hover {
  background: #0d3c4c;
  transform: translateY(-1px);
}

@media (max-width: 760px) {
  .rejilla-perfil {
    grid-template-columns: 1fr;
  }

  .cabecera-perfil {
    align-items: flex-start;
  }
}
</style>

