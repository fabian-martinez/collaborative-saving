# 0014. Selección de Neon Serverless Postgres para Base de Datos de Producción

* **Fecha:** 2026-09-14
* **Estado:** Aceptado
* **Supera / Actualiza:** ADR-0003 (en lo relativo al proveedor de persistencia relacional)

## Contexto y Problema

En el diseño inicial (ADR-0003) se propuso utilizar Supabase como la plataforma de hosting para PostgreSQL, contemplando en aquel momento el uso de sus servicios de autenticación y almacenamiento.

Con la evolución del proyecto:
1. La autenticación se desacopló y se implementó con **Firebase Auth** (`FirebaseAuthGuard`, `FirebaseAdminService`).
2. Toda la lógica de negocio y persistencia se orquestó mediante un servidor NestJS con **TypeORM** y arquitectura hexagonal estricta.
3. Las migraciones y tablas (`infra/database/migrations/`) son SQL puro estándar sobre PostgreSQL (`uuid-ossp`, índices, restricciones de integridad contable).

Al iniciar la fase de despliegue a producción con meta de costo cero ([Issue #196](https://github.com/fabian-martinez/collaborative-saving/issues/196)), se evaluó si **Supabase** seguía siendo la opción idónea en comparación con **Neon Serverless Postgres**, **Google Cloud SQL** y **Render Managed Postgres**.

### Puntos Críticos Evaluados
* **Riesgo de Inactividad de Supabase:** Supabase pausa automáticamente los proyectos en el nivel gratuito tras 7 días sin actividad. Dado que un grupo de ahorro colaborativo (natillera/tanda) concentra sus operaciones en reuniones mensuales o quincenales, la base de datos corre el riesgo constante de pausarse, requiriendo reactivación manual desde el dashboard web y arriesgando caídas para los usuarios.
* **Alternativa de Google Cloud SQL:** Aunque viable mediante créditos del plan Google AI Pro (~$10 USD/mes), el costo de la instancia mínima (`db-f1-micro` + 10GB SSD) ronda los $9.60 a $11.00 USD/mes, quedando en el filo del crédito mensual (el cual no acumula saldo) y arriesgando cargos a tarjeta de crédito por excedentes o si la suscripción de IA cambia.
* **Alternativa de Render Postgres:** En el nivel gratuito se elimina tras 30 días (inviable para producción); en el nivel Starter cuesta $7 USD/mes.

## Decisión

Se decide adoptar **Neon Serverless Postgres** como el proveedor administrado de PostgreSQL para los ambientes de producción y staging en el plan de $0.

## Justificación

1. **Auto Wake-Up Transparente (Scale-to-Zero):**
   Neon suspende el cómputo tras 5 minutos de inactividad para ahorrar recursos, pero **se reactiva automáticamente en ~500ms – 1s** en cuanto llega una consulta desde TypeORM. **Nunca pausa indefinidamente el proyecto ni requiere intervención manual**.
2. **Capacidad de Almacenamiento Idónea:**
   El nivel gratuito de Neon ofrece **0.5 GB (500 MB)**. La base de datos actual en Docker (`restored_db_feb21`) con 1.5 años de datos reales (17 reuniones, 1,011 operaciones y 5,863 asientos contables) pesa únicamente **11 MB** totales (~2.5 MB de datos de usuario). 500 MB otorgan más de 15 años de margen operativo.
3. **Database Branching:**
   Neon permite crear ramas (branches) de la base de datos con *copy-on-write* en segundos, lo cual facilita probar migraciones destructivas o esquemas en staging con data real de forma aislada.
4. **Connection Pooling Nativo (PgBouncer):**
   Neon expone un endpoint con pooling (`-pooler`) en el puerto 5432, lo cual previene la saturación de conexiones desde NestJS y TypeORM.
5. **Cero Vendor Lock-in:**
   Neon es 100% PostgreSQL estándar. La aplicación no instala SDKs privativos de Neon; se conecta puramente vía `DATABASE_URL` con SSL (`sslmode=require`).

## Consecuencias

### Positivas
* **Disponibilidad Continua Garantizada:** El sistema nunca estará "apagado" cuando un socio o administrador ingrese a registrar una reunión, eliminando la necesidad de pings artificiales o crons para "mantener viva" la base de datos.
* **Costo \$0 Predecible y Permanente:** Sin riesgo de cobros imprevistos en tarjeta de crédito ni dependencia de vencimiento de créditos promocionales.
* **Branching de Base de Datos:** Entornos de desarrollo/staging desacoplados y replicables al instante.

### Negativas y Mitigaciones
* **Cold-Start de ~800ms en Primera Petición:**
  * *Impacto:* Tras periodos prolongados de inactividad, la primera consulta SQL puede demorar cerca de 1 segundo en responder mientras el cómputo despierta.
  * *Mitigación:* Para el caso de uso de una app de reuniones y finanzas personales, una latencia de 1 segundo en la primera carga es perfectamente aceptable y preferible a un error 500 por base de datos pausada.
* **Exposición por Endpoint Público:**
  * *Impacto:* Al estar en el nivel gratuito, el hostname de Neon es accesible vía internet público.
  * *Mitigación:* Se exige SSL obligatorio (`sslmode=require` / TLS 1.3), contraseñas criptográficamente seguras de 32+ caracteres y credenciales inyectadas estrictamente vía variables de entorno en producción.
* **Estrategia de Backups Independientes:**
  * Se mantendrá el plan de la Fase 8 (Issue #203) para generar volcados periódicos independientes con `pg_dump` hacia almacenamiento seguro (ej. GitHub Artifacts o Cloud Storage), asegurando recuperación ante desastres sin dependencia de proveedor.
