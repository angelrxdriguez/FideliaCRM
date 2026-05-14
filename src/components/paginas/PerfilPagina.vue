<template>
  <div class="contenedor-pagina">
    <section class="rejilla-perfil">
      <article class="panel">
        <div class="cabecera-perfil">
          <h3>Tu perfil</h3>
          <p>Informacion basica de tu cuenta.</p>
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
defineProps({
  usuario: {
    type: Object,
    required: true,
  },
})

defineEmits(['cerrar-sesion'])
</script>

<style scoped>
.contenedor-pagina {
  display: grid;
}

.rejilla-perfil {
  display: grid;
  grid-template-columns: minmax(320px, 620px);
}

.panel {
  background: #ffffff;
  border: 1px solid #d9dee3;
  border-radius: 0.9rem;
  padding: 1.1rem;
}

.cabecera-perfil {
  display: grid;
  gap: 0.25rem;
}

.cabecera-perfil h3 {
  margin: 0;
  color: #1f2d3d;
  font-size: 1.25rem;
}

.cabecera-perfil p {
  margin: 0;
  color: #5b6978;
  font-size: 0.94rem;
}

.datos-perfil {
  display: grid;
  gap: 0.8rem;
  margin: 1rem 0 0;
}

.datos-perfil div {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e4eaef;
}

.datos-perfil div:last-child {
  border-bottom: 0;
}

.datos-perfil dt {
  color: #617181;
  font-size: 0.82rem;
  margin-bottom: 0.26rem;
}

.datos-perfil dd {
  margin: 0;
  color: #1f2d3d;
  font-weight: 600;
}

.boton-cerrar-sesion {
  margin-top: 1rem;
  padding: 0.7rem 0.95rem;
  border-radius: 0.55rem;
  border: 1px solid #2d5f77;
  background: #2d5f77;
  color: #f5fbfc;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.boton-cerrar-sesion:hover {
  background: #234b5e;
}

@media (max-width: 760px) {
  .rejilla-perfil {
    grid-template-columns: 1fr;
  }
}
</style>

