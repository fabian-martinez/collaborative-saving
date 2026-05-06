# Guía de Formularios

## Introducción

Esta guía explica cómo crear y manejar formularios en el proyecto, incluyendo validación, estados y mejores prácticas.

## Estructura de un Formulario

### Template Básico

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Campos del formulario -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">Nombre</span>
      </label>
      <input
        v-model="form.name"
        type="text"
        class="input input-bordered"
        :class="{ 'input-error': errors.name }"
      />
      <label v-if="errors.name" class="label">
        <span class="label-text-alt text-error">{{ errors.name }}</span>
      </label>
    </div>

    <!-- Botones -->
    <div class="form-control mt-6">
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="loading || !isValid"
      >
        <span v-if="loading" class="loading loading-spinner"></span>
        {{ loading ? 'Enviando...' : 'Enviar' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const form = ref({
  name: '',
  email: ''
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

const isValid = computed(() => {
  return form.value.name && form.value.email && Object.keys(errors.value).length === 0
})

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  try {
    await submitForm()
  } catch (e) {
    handleError(e)
  } finally {
    loading.value = false
  }
}

function validate() {
  errors.value = {}
  
  if (!form.value.name) {
    errors.value.name = 'El nombre es requerido'
  }
  
  if (!form.value.email) {
    errors.value.email = 'El email es requerido'
  } else if (!isValidEmail(form.value.email)) {
    errors.value.email = 'El email no es válido'
  }
  
  return Object.keys(errors.value).length === 0
}

async function submitForm() {
  // Llamada a API
}

function handleError(error: unknown) {
  // Manejar errores
}
</script>
```

## Validación

### Validación en Cliente

```typescript
// src/shared/utils/validators.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

export function isRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}
```

### Uso de Validadores

```vue
<script setup lang="ts">
import { isValidEmail, isRequired } from '@/shared/utils/validators'

function validate() {
  errors.value = {}
  
  if (!isRequired(form.value.name)) {
    errors.value.name = 'El nombre es requerido'
  }
  
  if (!isRequired(form.value.email)) {
    errors.value.email = 'El email es requerido'
  } else if (!isValidEmail(form.value.email)) {
    errors.value.email = 'El email no es válido'
  }
  
  return Object.keys(errors.value).length === 0
}
</script>
```

### Validación en Tiempo Real

```vue
<script setup lang="ts">
import { watch } from 'vue'

// Validar campo cuando cambia
watch(() => form.value.email, (newValue) => {
  if (newValue && !isValidEmail(newValue)) {
    errors.value.email = 'El email no es válido'
  } else {
    delete errors.value.email
  }
})
</script>
```

## Estados del Formulario

### Loading State

```vue
<template>
  <button
    type="submit"
    class="btn btn-primary"
    :disabled="loading"
  >
    <span v-if="loading" class="loading loading-spinner loading-sm"></span>
    <span v-else>Enviar</span>
  </button>
</template>
```

### Error State

```vue
<template>
  <div v-if="formError" class="alert alert-error mb-4">
    <span>{{ formError }}</span>
  </div>
  
  <!-- Errores por campo -->
  <div class="form-control">
    <input
      v-model="form.email"
      class="input input-bordered"
      :class="{ 'input-error': errors.email }"
    />
    <label v-if="errors.email" class="label">
      <span class="label-text-alt text-error">{{ errors.email }}</span>
    </label>
  </div>
</template>
```

### Success State

```vue
<template>
  <div v-if="success" class="alert alert-success mb-4">
    <span>Formulario enviado exitosamente</span>
  </div>
</template>

<script setup lang="ts">
const success = ref(false)

async function handleSubmit() {
  try {
    await submitForm()
    success.value = true
    // Resetear formulario después de éxito
    setTimeout(() => {
      success.value = false
      resetForm()
    }, 3000)
  } catch (e) {
    // ...
  }
}
</script>
```

## Integración con API

### Submit con Store

```vue
<script setup lang="ts">
import { useMemberStore } from '../stores/members'

const store = useMemberStore()
const form = ref({
  name: '',
  email: ''
})

async function handleSubmit() {
  if (!validate()) return
  
  try {
    await store.createMember(form.value)
    // Éxito - redirigir o mostrar mensaje
    router.push('/members')
  } catch (e) {
    if (e instanceof ApiException && e.errors) {
      // Errores de validación del servidor
      Object.entries(e.errors).forEach(([field, messages]) => {
        errors.value[field] = messages[0]
      })
    } else {
      formError.value = e instanceof Error ? e.message : 'Error al enviar'
    }
  }
}
</script>
```

### Submit Directo con API

```vue
<script setup lang="ts">
import { membersApi } from '@/api/members.api'

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  formError.value = null
  
  try {
    const newMember = await membersApi.createMember(form.value)
    // Éxito
    emit('member-created', newMember)
    resetForm()
  } catch (e) {
    if (e instanceof ApiException) {
      if (e.status === 400 && e.errors) {
        // Errores de validación
        Object.entries(e.errors).forEach(([field, messages]) => {
          errors.value[field] = messages[0]
        })
      } else {
        formError.value = e.message
      }
    } else {
      formError.value = 'Error al crear miembro'
    }
  } finally {
    loading.value = false
  }
}
</script>
```

## Componentes de Formulario Reutilizables

### Input Component

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
      :type="type"
      :placeholder="placeholder"
      class="input input-bordered"
      :class="{ 'input-error': error }"
      :disabled="disabled"
    />
    <label v-if="error" class="label">
      <span class="label-text-alt text-error">{{ error }}</span>
    </label>
    <label v-if="hint && !error" class="label">
      <span class="label-text-alt">{{ hint }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
```

**Uso:**
```vue
<FormInput
  v-model="form.name"
  label="Nombre"
  placeholder="Ingresa tu nombre"
  :error="errors.name"
  required
/>
```

### Select Component

```vue
<!-- src/shared/components/FormSelect.vue -->
<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text">{{ label }}</span>
    </label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="select select-bordered"
      :class="{ 'select-error': error }"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <label v-if="error" class="label">
      <span class="label-text-alt text-error">{{ error }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
  error?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
```

## Formularios Complejos

### Formulario con Múltiples Secciones

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Sección 1 -->
    <div class="card bg-base-100 shadow-lg mb-6">
      <div class="card-body">
        <h2 class="card-title">Información Personal</h2>
        <!-- Campos -->
      </div>
    </div>

    <!-- Sección 2 -->
    <div class="card bg-base-100 shadow-lg mb-6">
      <div class="card-body">
        <h2 class="card-title">Información de Contacto</h2>
        <!-- Campos -->
      </div>
    </div>

    <!-- Botones -->
    <div class="flex justify-end gap-4">
      <button type="button" @click="handleCancel" class="btn btn-ghost">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        Guardar
      </button>
    </div>
  </form>
</template>
```

### Formulario con Array de Campos

```vue
<script setup lang="ts">
const form = ref({
  name: '',
  payments: [
    { type: 'MANDATORY_CONTRIBUTION', amount: 0 },
    { type: 'LOAN_PAYMENT', amount: 0 }
  ]
})

function addPayment() {
  form.value.payments.push({ type: '', amount: 0 })
}

function removePayment(index: number) {
  form.value.payments.splice(index, 1)
}
</script>

<template>
  <div v-for="(payment, index) in form.payments" :key="index">
    <select v-model="payment.type">
      <!-- Opciones -->
    </select>
    <input v-model.number="payment.amount" type="number" />
    <button @click="removePayment(index)">Eliminar</button>
  </div>
  <button @click="addPayment">Agregar Pago</button>
</template>
```

## Best Practices

### 1. Validar Antes de Submit

```typescript
// ✅ Bueno
async function handleSubmit() {
  if (!validate()) return
  // Submit
}

// ❌ Evitar
async function handleSubmit() {
  // Submit sin validar
}
```

### 2. Mostrar Errores Claros

```vue
<!-- ✅ Bueno -->
<label class="label">
  <span class="label-text-alt text-error">El email es requerido</span>
</label>

<!-- ❌ Evitar -->
<span>Error</span>
```

### 3. Deshabilitar Submit Durante Loading

```vue
<!-- ✅ Bueno -->
<button type="submit" :disabled="loading || !isValid">

<!-- ❌ Evitar -->
<button type="submit"> <!-- Puede hacer múltiples submits -->
```

### 4. Resetear Formulario Después de Éxito

```typescript
function resetForm() {
  form.value = {
    name: '',
    email: ''
  }
  errors.value = {}
  formError.value = null
}
```

### 5. Manejar Errores del Servidor

```typescript
catch (e) {
  if (e instanceof ApiException && e.errors) {
    // Errores de validación por campo
    Object.entries(e.errors).forEach(([field, messages]) => {
      errors.value[field] = messages[0]
    })
  } else {
    // Error general
    formError.value = e.message
  }
}
```

## Anti-Patrones

### ❌ Evitar: Validación Solo en Submit

```typescript
// ❌ Malo - Usuario no sabe del error hasta submit
async function handleSubmit() {
  const result = await api.submit(form.value)
  if (result.errors) {
    // Mostrar errores después de submit
  }
}

// ✅ Bueno - Validación en tiempo real o antes de submit
function validate() {
  // Validar antes
}
```

### ❌ Evitar: Múltiples Submits

```vue
<!-- ❌ Malo -->
<button @click="submit">Enviar</button>

<!-- ✅ Bueno -->
<button type="submit" :disabled="loading">Enviar</button>
```

## Referencias

- [Guía de Componentes](./COMPONENTS_GUIDE.md)
- [Guía de Stores](./STORES_GUIDE.md)
- [Guía de API](./API_GUIDE.md)

