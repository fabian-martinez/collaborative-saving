# Patrones de Testing - Collaborative Saving

Este documento define la estrategia, estructura y mejores prácticas de testing en el proyecto.

## Estrategia TDD
El flujo de desarrollo debe seguir estrictamente el ciclo:
1. **Red**: Escribir un test que falle expresando la necesidad de negocio.
2. **Green**: Escribir la implementación mínima para pasar el test.
3. **Refactor**: Limpiar y optimizar el código sin alterar su comportamiento (los tests deben seguir en verde).

---

## Estructura AAA (Arrange-Act-Assert)
Todos los tests deben estructurarse usando AAA para mejorar legibilidad:
```typescript
it('should do something', async () => {
  // ARRANGE - Preparar mocks y datos
  const dto = { name: 'Test', email: 'test@example.com' };
  const member = Member.create(dto);
  memberRepository.save.mockResolvedValue(member);

  // ACT - Ejecutar código a evaluar
  const result = await useCase.execute(dto);

  // ASSERT - Verificar resultados
  expect(memberRepository.save).toHaveBeenCalledTimes(1);
  expect(result.name).toBe('Test');
});
```

---

## Mocking de Dependencias
- **Repositories**: Mockear la interfaz completa, incluyendo métodos opcionales (ej: `findByIdWithDeleted`).
- **TypeORM**: Usar `getRepositoryToken` para inyectar mock del repositorio de persistencia en tests de adaptadores.
- **Use Cases/Queries**: Inyectar versiones mockeadas (`{ execute: jest.fn() }`) en tests de controladores.

### Solución a Error de ESLint: `@typescript-eslint/unbound-method`
**CRÍTICO**: Referenciar métodos de mocks directamente en aserciones causa errores de linting. La solución recomendada es usar **Spies** creados en `beforeEach`:

```typescript
describe('CreateStockUseCase', () => {
  let useCase: CreateStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    stockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    // Crear spy para evitar error 'unbound-method' de scoping de 'this'
    saveSpy = jest.spyOn(stockRepository, 'save');
    useCase = new CreateStockUseCase(stockRepository);
  });

  it('should save stock', async () => {
    const dto = { type: 'preferred', value: 100 };
    stockRepository.save.mockResolvedValue(Stock.create(dto));

    await useCase.execute(dto);

    // ASSERT - Usar spy en lugar del mock directo
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
```

---

## Cobertura por Capa
| Capa | Objetivo de Cobertura |
| :--- | :--- |
| Value Objects | 100% |
| Domain Entities | ~100% |
| Use Cases / Queries | 100% |
| Repositories | 100% |
| Controllers | 100% |
| Mappers | 95%+ |

**Regla**: Si una capa crítica tiene cobertura menor al 90%, el pipeline fallará o el commit debe ser rechazado.

---

## Tests Unitarios por Capa

### 1. Value Objects
Validar comportamiento correcto de creación, validaciones que arrojan excepciones y comportamiento de factory methods.
```typescript
describe('Email Value Object', () => {
  it('should create valid email', () => {
    const email = Email.create('valid@example.com');
    expect(email.value).toBe('valid@example.com');
  });

  it('should throw on invalid format', () => {
    expect(() => Email.create('invalid')).toThrow('Invalid email format');
  });
});
```

### 2. Domain Entities
Validar que las entidades se instancien correctamente mediante factories (`create`, `fromPersistence`), tengan valores por defecto y muten su estado de forma segura.

### 3. Use Cases / Query Handlers
Asegurar el happy path, llamadas correctas al repositorio y propagación de errores esperados (ej. lanzar error si la entidad no existe).

### 4. Repositories (Persistencia)
Probar la lógica de persistencia y mapeo con TypeORM.
- **Inserción y Actualización**: Validar la bifurcación lógica (si existe, usar update; si no, insertar).
- **Soft Delete**: Comprobar que se valide la existencia del registro (`affected !== 0`) y que las consultas estándar no carguen elementos eliminados (`deletedAt: IsNull()`).

### 5. Controllers HTTP
Validar la respuesta HTTP correcta (DTO retornado, HttpStatus apropiado) y el mapeo de excepciones internas a respuestas `HttpException`.

---

## Convenciones de Nombres
- **Archivos**: `{nombre-archivo}.spec.ts`.
- **Describe**: Estructura jerárquica `describe('ClassName', () => { describe('methodName', () => { ... }) })`.
- **It**: Expresivos en inglés: `it('should {expected behavior} when {condition}', () => { ... })`.

---

## Checklist de Testing
- [ ] Todos los tests usan patrón AAA.
- [ ] No se usan métodos de mocks directamente en aserciones (uso de `jest.spyOn` para evitar unbound method errors).
- [ ] Se evalúan casos edge (null/undefined en mappers, inputs vacíos).
- [ ] Los métodos que lanzan excepciones (errores de negocio y no-Error) están cubiertos.
- [ ] La cobertura local de la funcionalidad editada/creada alcanza o supera los objetivos.

**Última actualización**: 2025-10-31
