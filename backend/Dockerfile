FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código y compilar
COPY . .
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# El comando de inicio ejecuta las migraciones y luego arranca el servidor NestJS
CMD ["npm", "run", "start:prod"]
