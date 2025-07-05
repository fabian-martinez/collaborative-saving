# 📝 Plan de Validación: API vs. Caso de Uso de Negocio

Este documento describe el plan para validar los endpoints de la API del backend contra el escenario de negocio definido en `docs/business-use-case-scenario.md`.

El objetivo es configurar el **"1. Estado Inicial"** del caso de uso utilizando la API que hemos construido.

---

## ✅ Tareas de Validación

### Fase 1: Creación de Entidades Principales

- [ ] **Crear Socios:**
    - [ ] Crear "Socio 1" usando `POST /members`.
    - [ ] Crear "Socio 2" usando `POST /members`.

- [ ] **Crear Catálogo de Acciones:**
    - [ ] Crear "Acción Grande" (`valor: 10000`) usando `POST /stocks`.
    - [ ] Crear "Acción Mediana" (`valor: 5000`) usando `POST /stocks`.
    - [ ] Crear "Acción Pequeña" (`valor: 2000`) usando `POST /stocks`.
    - [ ] Crear "Bono Navideño" (`valor: 500`) usando `POST /stocks`.

- [ ] **Crear Catálogo de Contribuciones Obligatorias:**
    - [ ] Crear "Aporte Acción Grande" (`monto: 100`) usando `POST /meetings/mandatory-contributions`.
    - [ ] Crear "Aporte Acción Mediana" (`monto: 100`) usando `POST /meetings/mandatory-contributions`.
    - [ ] Crear "Aporte Bono Navideño" (`monto: 50`) usando `POST /meetings/mandatory-contributions`.
    - [ ] Crear "Aporte Administrativo" (`monto: 5`) usando `POST /meetings/mandatory-contributions`.

---

## 🚀 Próximos Pasos (Fuera de esta validación)

Una vez completada esta validación, las siguientes tareas implicarán desarrollar nueva lógica de negocio:

-   **Implementar `StockSubscriptions`:** Crear endpoints para que un socio pueda suscribirse a una acción.
-   **Implementar el Módulo de `Loans`:** Desarrollar el CRUD completo para la gestión de préstamos.
-   **Implementar el Módulo de `Operations` y `LedgerEntries`:** Construir el núcleo del sistema contable para registrar las transacciones complejas. 