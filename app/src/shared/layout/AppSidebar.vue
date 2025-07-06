<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <aside class="w-64 bg-base-200 text-base-content">
    <div class="p-4 text-xl font-bold">Fondo Comunitario</div>
    <ul class="menu p-4">
      <li>
        <details open>
          <summary>Principal</summary>
          <ul>
            <li><RouterLink to="/dashboard">Dashboard</RouterLink></li>
            <li><RouterLink to="/members">Socios</RouterLink></li>
            <li><RouterLink to="/stocks">Acciones</RouterLink></li>
          </ul>
        </details>
      </li>
      <li>
        <details open>
          <summary>Financiera</summary>
          <ul>
            <li><RouterLink to="/meetings">Reuniones</RouterLink></li>
            <li><RouterLink to="/loans">Préstamos</RouterLink></li>
            <li><RouterLink to="/ledger">Libro Contable</RouterLink></li>
          </ul>
        </details>
      </li>
      <li>
        <details open>
          <summary>Administración</summary>
          <ul>
            <li><RouterLink to="/fund-info">Info del Fondo</RouterLink></li>
            <li><RouterLink to="/documents">Documentos</RouterLink></li>
            <li><RouterLink to="/settings">Configuración</RouterLink></li>
          </ul>
        </details>
      </li>
    </ul>
  </aside>
</template> 