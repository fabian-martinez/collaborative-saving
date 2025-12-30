<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <h1 class="nav-title">Collaborative Saving</h1>
        <ul class="nav-links">
          <li><router-link to="/members">Miembros</router-link></li>
          <li><router-link to="/meetings">Reuniones</router-link></li>
          <li><router-link to="/loans">Préstamos</router-link></li>
          <li><router-link to="/stocks">Acciones</router-link></li>
          <li><router-link to="/contributions">Contribuciones</router-link></li>
          <li><router-link to="/ledger">Libro Contable</router-link></li>
        </ul>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// App component
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-title {
  margin: 0;
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: white;
  text-decoration: none;
  transition: opacity 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  opacity: 0.8;
  text-decoration: underline;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}
</style>

