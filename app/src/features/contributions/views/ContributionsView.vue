<template>
  <div>
    <div class="container mx-auto pt-12 pb-24">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Administración de Contribuciones Obligatorias</h1>
        <button class="btn btn-primary" @click="openCreateModal">
          Añadir Contribución
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Tipo de Activo</th>
              <th>Monto Total (Bs.)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center">Cargando contribuciones...</td>
            </tr>
            <tr v-else-if="error">
              <td colspan="3" class="text-center text-error">{{ error }}</td>
            </tr>
            <tr v-else-if="contributions.length === 0">
              <td colspan="3" class="text-center">No hay contribuciones obligatorias registradas.</td>
            </tr>
            <tr v-for="contribution in contributions" :key="contribution.id">
              <td class="font-semibold">{{ contribution.asset_type }}</td>
              <td>{{ contribution.total.toFixed(2) }}</td>
              <td>
                <button class="btn btn-sm btn-outline mr-2" @click="openEditModal(contribution)">Editar</button>
                <button class="btn btn-sm btn-error" @click="handleDelete(contribution.id)" :disabled="isDeleting">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ContributionFormModal
      v-model="isModalOpen"
      :contribution-to-edit="contributionToEdit"
      @contribution-saved="handleContributionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { contributionsService } from '../services/contributionsService';
import type { MandatoryContribution } from '../types';
import ContributionFormModal from '../components/ContributionFormModal.vue';

const contributions = ref<MandatoryContribution[]>([]);
const loading = ref(false);
const isDeleting = ref(false);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const contributionToEdit = ref<MandatoryContribution | null>(null);

async function fetchContributions() {
  loading.value = true;
  error.value = null;
  try {
    contributions.value = await contributionsService.getContributions();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    error.value = `Error al cargar las contribuciones: ${message}`;
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  contributionToEdit.value = null;
  isModalOpen.value = true;
}

function openEditModal(contribution: MandatoryContribution) {
  contributionToEdit.value = contribution;
  isModalOpen.value = true;
}

function handleContributionSaved() {
  fetchContributions();
}

async function handleDelete(id: string) {
  if (!confirm('¿Está seguro de que desea eliminar esta contribución obligatoria?')) {
    return;
  }
  isDeleting.value = true;
  error.value = null;
  try {
    await contributionsService.deleteContribution(id);
    await fetchContributions();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    error.value = `Error al eliminar la contribución: ${message}`;
    console.error(e);
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  fetchContributions();
});
</script> 