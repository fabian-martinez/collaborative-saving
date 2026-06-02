# Guía de Formularios

## Estructura Básica

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="formError" class="alert alert-error mb-4">{{ formError }}</div>

    <div class="form-control">
      <label class="label"><span class="label-text">Nombre</span></label>
      <input v-model="form.name" type="text" class="input input-bordered" :class="{ 'input-error': errors.name }" />
      <label v-if="errors.name" class="label"><span class="label-text-alt text-error">{{ errors.name }}</span></label>
    </div>

    <div class="form-control mt-6">
      <button type="submit" class="btn btn-primary" :disabled="loading || !isValid">
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ loading ? 'Enviando...' : 'Enviar' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const form = ref({ name: '', email: '' })
const errors = ref<Record<string, string>>({})
const formError = ref<string | null>(null)
const loading = ref(false)

const isValid = computed(() => form.value.name && form.value.email && Object.keys(errors.value).length === 0)

function validate(): boolean {
  errors.value = {}
  if (!form.value.name) errors.value.name = 'El nombre es requerido'
  if (!form.value.email) errors.value.email = 'El email es requerido'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errors.value.email = 'Email inválido'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  formError.value = null
  try {
    await submitForm()
    resetForm()
  } catch (e) {
    handleError(e)
  } finally {
    loading.value = false
  }
}

function resetForm() { form.value = { name: '', email: '' }; errors.value = {} }
</script>
```

## Validación

### Validadores Reutilizables

```typescript
// src/shared/utils/validators.ts
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const isRequired = (v: unknown) => typeof v === 'string' ? v.trim().length > 0 : v != null
```

### Validación en Tiempo Real

```vue
<script setup lang="ts">
watch(() => form.value.email, (val) => {
  if (val && !isValidEmail(val)) errors.value.email = 'Email inválido'
  else delete errors.value.email
})
</script>
```

## Integración con API

```vue
<script setup lang="ts">
async function handleSubmit() {
  if (!validate()) return
  try {
    await store.createItem(form.value)
    router.push('/items')
  } catch (e) {
    if (e instanceof ApiException && e.errors) {
      // Errores de validación del servidor por campo
      Object.entries(e.errors).forEach(([field, msgs]) => { errors.value[field] = msgs[0] })
    } else {
      formError.value = e instanceof Error ? e.message : 'Error al enviar'
    }
  }
}
</script>
```

## Componentes Reutilizables

### FormInput

```vue
<!-- src/shared/components/FormInput.vue -->
<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :type="type" :placeholder="placeholder" :disabled="disabled"
      class="input input-bordered" :class="{ 'input-error': error }"
    />
    <label v-if="error" class="label"><span class="label-text-alt text-error">{{ error }}</span></label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string; modelValue: string; type?: string; placeholder?: string
  error?: string; required?: boolean; disabled?: boolean
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
```

**Uso:**
```vue
<FormInput v-model="form.name" label="Nombre" :error="errors.name" required />
```

### FormSelect

```vue
<template>
  <div class="form-control">
    <label class="label"><span class="label-text">{{ label }}</span></label>
    <select :value="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="select select-bordered" :class="{ 'select-error': error }">
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <label v-if="error" class="label"><span class="label-text-alt text-error">{{ error }}</span></label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string; modelValue: string; options: { value: string; label: string }[]
  placeholder?: string; error?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
```

## Reglas

- Validar **antes** de submit y opcionalmente en tiempo real
- **Deshabilitar** botón de submit durante loading
- Mostrar errores **claros** por campo (no solo "Error")
- **Resetear** formulario después de éxito
- Manejar errores del servidor por campo usando `ApiException.errors`

## Referencias

- [Componentes](./COMPONENTS_GUIDE.md)
- [Stores](./STORES_GUIDE.md)
- [Errores](./ERROR_HANDLING.md)
