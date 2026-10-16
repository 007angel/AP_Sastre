# Sistema de Gestión de Sastrería - Instrucciones de Configuración

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Configuración de Google Sheets](#2-configuración-de-google-sheets)
3. [Configuración de Google Drive](#3-configuración-de-google-drive)
4. [Configuración de Google Apps Script](#4-configuración-de-google-apps-script)
5. [Configuración del Frontend (React)](#5-configuración-del-frontend-react)
6. [Pruebas de Funcionalidad](#6-pruebas-de-funcionalidad)
7. [Despliegue del Frontend](#7-despliegue-del-frontend)

## 1. Requisitos previos

- Cuenta de Google
- Google Sheets
- Google Drive
- Google Apps Script
- Node.js (v18 o superior)
- npm o yarn
- Navegador web

## 2. Configuración de Google Sheets

1. Abrir [Google Sheets](https://docs.google.com/spreadsheets/)
2. Crear una nueva hoja de cálculo
3. Guardar con el nombre: `Sastrería - Pedidos`
4. Copiar el ID de la URL. Ejemplo: 
   `https://docs.google.com/spreadsheets/d/ID_AQUI/edit`
   El ID es la cadena entre `/d/` y `/edit`

5. Anotar este ID para usarlo en Google Apps Script

## 3. Configuración de Google Drive

1. Abrir [Google Drive](https://drive.google.com)
2. Crear una nueva carpeta
3. Nombrarla: `Sastreria_Fotos`
4. Abrir la carpeta y copiar su ID de la URL:
   `https://drive.google.com/drive/folders/ID_AQUI`
5. Anotar este ID para usarlo en Google Apps Script (opcional, el script lo crea automáticamente si no se especifica)

## 4. Configuración de Google Apps Script

1. Abrir [Google Apps Script](https://script.google.com)
2. Crear un nuevo proyecto
3. Renombrarlo: `Sastreria_API`
4. Eliminar el código predeterminado (`function myFunction() { ... }`)
5. Subir los archivos del proyecto:

### Método 1: Copiar y pegar
Copiar cada archivo `.gs` del directorio `google-apps-script/` y pegarlo en Google Apps Script. Crear archivos con los mismos nombres:

- Code.gs
- SheetUtils.gs
- Abonos.gs
- Photos.gs
- Setup.gs

### Método 2: Utilizar clasp (opcional)

6. Configurar IDs en el código:

   En `Code.gs`, actualizar las siguientes variables:
   ```javascript
   const SPREADSHEET_ID = 'TU_ID_DE_GOOGLE_SHEETS_AQUI';
   const DRIVE_FOLDER_ID = 'TU_ID_DE_CARPETA_DRIVE_AQUI'; // opcional
   ```

7. Inicializar las hojas:

   En el editor de Apps Script:
   - Seleccionar la función `createSheetsAndHeaders` del desplegable
   - Hacer clic en "Ejecutar" (▶️)
   - Otorgar permisos cuando se solicite (primer ejecución)
   - Debería aparecer un mensaje de confirmación

8. Probar la conexión:

   - Seleccionar la función `testConnection`
   - Hacer clic en "Ejecutar"
   - Verificar que muestra el número de pedidos

9. Desplegar como aplicación web:

   - Hacer clic en "Deploy" > "New deployment"
   - Seleccionar tipo: "Web app"
   - Configurar:
     - Description: `API Sastrería v1.0`
     - Execute as: `Me (tu cuenta de Google)`
     - Who has access: `Anyone with the link`
   - Hacer clic en "Deploy"
   - Copiar la URL que aparece (Web app URL)
   - Guardar esta URL para el frontend

**Importante**: Si actualizas el código, debes crear un nuevo deployment o actualizar el existente (Manage deployments > Edit > New version).

## 5. Configuración del Frontend (React)

### Paso 1: Instalar dependencias

```bash
cd sastreria
npm install
```

### Paso 2: Configurar variables de entorno

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env`:
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/TU_WEB_APP_URL_ID/exec
   VITE_CURRENCY=GTQ
   VITE_CURRENCY_SYMBOL=Q
   VITE_LOCALE=es-GT
   ```

   Reemplazar `TU_WEB_APP_URL_ID` con el ID de tu Web App URL.

### Paso 3: Ejecutar en modo desarrollo

```bash
npm run dev
```

El proyecto se abrirá en `http://localhost:5173`

### Paso 4: Construir para producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`.

## 6. Pruebas de Funcionalidad

### 6.1 Registrar un nuevo pedido

1. Ir a "Nuevo pedido"
2. Completar campos obligatorios:
   - Nombre completo del cliente
   - Fecha de entrega
   - Tipo de prenda
   - Monto total
3. Opcional: Agregar abono inicial, descripción, fotografía
4. Hacer clic en "Guardar Pedido"
5. Verificar que aparezca mensaje de éxito y redireccione a Pedidos

### 6.2 Consultar pedidos

1. Ir a "Pedidos"
2. Verificar que el pedido registrado aparece en la tabla
3. Probar búsqueda por nombre o número de pedido
4. Probar filtros por estado y fecha de entrega
5. Hacer clic en "Ver" para ver detalles completos

### 6.3 Editar pedido

1. En "Pedidos", hacer clic en el ícono "Editar"
2. Modificar algún campo (ej.: estado, monto)
3. Guardar cambios
4. Verificar actualización

### 6.4 Agregar abono

1. En "Pedidos", hacer clic en ícono de dinero
2. Ingresar monto del abono
3. Agregar observación (opcional)
4. Guardar
5. Verificar que el saldo pendiente se actualiza

### 6.5 Subir fotografía

1. Al crear o editar un pedido
2. Hacer clic en "Seleccionar imagen"
3. Elegir imagen desde dispositivo (o tomar foto en móvil)
4. Verificar que aparece vista previa
5. Guardar pedido
6. Verificar en detalle del pedido que la imagen es visible

### 6.6 Dashboard

1. Ir a "Inicio"
2. Verificar indicadores:
   - Total de pedidos
   - Pendientes, En proceso, Listos para entregar, Entregados
   - Atrasados
   - Total montos
   - Saldos pendientes
3. Verificar lista de pedidos atrasados

### 6.7 Clientes

1. Ir a "Clientes"
2. Seleccionar un cliente
3. Verificar historial completo de pedidos

### 6.8 Reportes

1. Ir a "Reportes"
2. Filtrar por rango de fechas
3. Verificar estadísticas
4. Probar exportación a CSV

### 6.9 Validaciones importantes

- Montos deben ser positivos
- Abono inicial no puede superar monto total
- Abono no puede superar saldo pendiente
- Campos obligatorios deben estar completos
- Imágenes máximo 10MB

## 7. Despliegue del Frontend

### Opción 1: Netlify

1. Ir a [netlify.com](https://netlify.com)
2. Conectar con GitHub/GitLab o arrastrar carpeta `dist/`
3. Configurar variables de entorno en Site settings > Build & deploy > Environment variables:
   - `VITE_GAS_URL` = tu Web App URL
4. Para despliegue automático desde Git:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Opción 2: Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Importar repositorio
3. Framework: Vite (detectado automáticamente)
4. Configurar variables de entorno
5. Deploy

### Opción 3: GitHub Pages

1. Instalar gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Agregar en `package.json`:
   ```json
   "homepage": "https://tu-usuario.github.io/nombre-repositorio",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. En `vite.config.js`, agregar base:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/nombre-repositorio/'
   })
   ```

4. Ejecutar:
   ```bash
   npm run deploy
   ```

## Notas de Seguridad

- Las credenciales de Google NO deben ir en el código de React
- Solo la URL de Google Apps Script Web App debe configurarse en `.env`
- Configurar correctamente los permisos: "Anyone with the link" permite acceso al API
- Para mayor seguridad en producción, considera restringir acceso
- Las imágenes se almacenan en Google Drive con enlace público para visualización

## Solución de problemas comunes

**Error CORS/Access**: Verifica que el Web App esté publicado con "Who has access: Anyone with the link"

**Error al subir foto**: Verifica el tamaño (máx 10MB) y formato

**Error de conexión**: Verifica que SPREADSHEET_ID y GAS_URL sean correctos

**Los datos no aparecen**: Ejecuta `createSheetsAndHeaders` en Apps Script nuevamente
