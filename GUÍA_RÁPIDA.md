# Guía Rápida de Configuración

## 1. Google Sheets
1. Crear hoja nueva en https://docs.google.com/spreadsheets
2. Copiar ID de la URL: .../d/ID_AQUI/edit

## 2. Google Apps Script
1. Ir a https://script.google.com → Nuevo proyecto
2. Renombrar a "Sastreria_API"
3. Copiar archivos .gs de google-apps-script/ a cada nuevo archivo en el proyecto
4. En Code.gs, cambiar SPREADSHEET_ID
5. Ejecutar createSheetsAndHeaders → Otorgar permisos
6. Deploy → Web app → Ejecutar como: Yo, Acceso: Cualquiera con el enlace
7. Copiar URL del Web app

## 3. Frontend
```bash
cd sastreria
npm install
cp .env.example .env
# Editar .env con VITE_GAS_URL
npm run dev
```

## 4. Comandos útiles
```bash
npm run dev      # Desarrollo
npm run build    # Producción
npm run preview  # Vista previa build
```

## Datos de prueba
Puedes usar valores ficticios para probar:
- Monto Total: 150.00
- Abono Inicial: 50.00 (Saldo = 100.00)
- Fecha Entrega: Mañana
- Estado: Pendiente
