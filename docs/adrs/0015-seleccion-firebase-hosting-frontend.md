# ADR-0015: Selección de Firebase Hosting para el Despliegue del Frontend Web

## Estado

Aceptado

## Contexto

En la Fase 6 del plan de despliegue a costo $0 ([Issue #201](https://github.com/fabian-martinez/collaborative-saving/issues/201)), se requiere desplegar la aplicación web Vue 3 (`frontend-v2`) en producción con enrutamiento de Single Page Application (SPA), certificado SSL automático, distribución global vía CDN y vinculación con un subdominio personalizado.

Factores determinantes para la decisión:

1. **Ecosistema Firebase Existente**: El proyecto ya utiliza Firebase Authentication como mecanismo central de identidad en el backend NestJS (`FirebaseAuthGuard`, `FIREBASE_SERVICE_ACCOUNT_JSON`) y en el cliente frontend (`@firebase/auth`).
2. **Seguridad y Passkeys/WebAuthn**: La integración de autenticación de dos factores con Passkeys ([Issues #206-#209](https://github.com/fabian-martinez/collaborative-saving/issues/206)) depende estrictamente del origen y del Relying Party ID (`rpId`), requiriendo que el dominio del frontend y el dominio de autenticación no sufran restricciones de cookies de terceros.
3. **Dominio Personal en Hostinger**: Se dispone de un dominio propio administrado en Hostinger, el cual debe mantenerse para otros servicios (web principal/correo) delegando únicamente un subdominio específico (ej. `app.tudominio.com`) para la aplicación.

### Opciones consideradas

- **Firebase Hosting (Elegida)**: Alojamiento estático en la red edge de Google Cloud, con integración nativa a Firebase Auth, canales de preview por PR y SSL automático.
- **Cloudflare Pages**: Plataforma Jamstack con ancho de banda ilimitado y Anycast CDN, pero requiere autorizaciones cruzadas manuales con Firebase Auth y gestión en panel independiente.
- **Vercel**: Plataforma con excelente experiencia de desarrollador, pero con restricciones de uso comercial en su nivel Hobby y dependencia de autorización externa en Firebase.
- **Hostinger Web Hosting directo**: Alojamiento tradicional en servidor compartido con Apache/Nginx. No ofrece red de distribución CDN global ni URLs de preview automáticas por cada Pull Request.

## Decisión

Se adopta **Firebase Hosting** para el despliegue de `frontend-v2`:

1. **Configuración de Proyecto**: Archivo `firebase.json` en la raíz con enrutamiento SPA (`rewrites` hacia `/index.html`), cabeceras de seguridad estrictas (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) y cabeceras de caché inmutable para activos en `/assets/**`.
2. **Vinculación de Subdominio en Hostinger**: Creación de un registro `CNAME` en la Zona DNS de Hostinger apuntando el subdominio elegido (ej. `app`) hacia `<project-id>.web.app.`, con emisión automática de certificado SSL/TLS gestionada por Google Trust Services / Let's Encrypt.
3. **Automatización CI/CD**: Integración con GitHub Actions mediante `FirebaseExtended/action-hosting-deploy` para generar previsualizaciones efímeras en cada Pull Request y despliegue continuo en la rama `main`.
4. **Sincronización de CORS**: Registro del subdominio de producción en la variable `ALLOWED_ORIGINS` del backend NestJS.

## Consecuencias

### Más fácil

- **Sinergia con Firebase Auth**: El subdominio queda pre-autorizado en Firebase Authentication, simplificando la gestión de tokens y reduciendo bloqueos por políticas de cookies cross-site en navegadores modernos.
- **Canales de Preview**: Cada Pull Request genera automáticamente una URL aislada para validar cambios antes de integrar a `main`.
- **Certificados SSL Cero Mantenimiento**: Renovación automática y transparente sin intervención manual en Hostinger.
- **Evolución hacia Cloud Run**: Si el backend se migra a Cloud Run (Opción B de infraestructura), Firebase Hosting permite enrutar `/v2/**` al contenedor bajo el mismo dominio, eliminando CORS.

### Más difícil

- **Cuota de Transferencia Gratuita**: El plan Spark ofrece 360 MB/día (~10 GB/mes). Se mitiga mediante caché HTTP agresivo (`max-age=31536000, immutable`) en los bundles hash de Vite y compresión gzip/brotli. Si el tráfico superara la cuota, el plan Blaze tiene un costo accesible de $0.15 USD/GB adicional.

### Revisitar cuando

- El tráfico de usuarios activos mensuales supere la capacidad del tier Spark y se requiera migrar a Cloudflare Pages por su transferencia ilimitada.
- Se adopte Server-Side Rendering (SSR) con Nuxt, evaluando en ese momento la transición a Firebase App Hosting o Google Cloud Run.
