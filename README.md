# 🍃 MongoDB Práctica - UTN FRT
## Base de Datos II - Aplicación Completa

## 🚀 **INSTALACIÓN RÁPIDA**

### **1. Descargar el proyecto**


### **2. Instalar dependencias**


# Instalar dependencias necesarias
npm install 

---

## ⚙️ **CONFIGURACIÓN**

### **Prerequisitos:**
- ✅ **Node.js** instalado (v16 o superior)
- ✅ **MongoDB** instalado y ejecutándose
- ✅ **MongoDB Compass** (recomendado para visualización)

### **Verificar instalaciones:**

# Verificar Node.js
node --version
npm --version

# Verificar MongoDB
mongod --version


## 🔧 **EJECUTAR LA APLICACIÓN**

### **1. Iniciar MongoDB**

**Windows:**
- Abrir MongoCompassDB


### **2. Iniciar el servidor**

npm start


### **3. Abrir la aplicación**
- **URL:** http://localhost:3000
- **API:** http://localhost:3000/api/estudiantes

---

## 📚 **CARACTERÍSTICAS**

### **Frontend (React-like):**
- ✅ Formulario para insertar estudiantes
- ✅ Consultas dinámicas con filtros
- ✅ Visualización de resultados en tiempo real
- ✅ Estados de conexión en vivo
- ✅ Validaciones del lado cliente
- ✅ Interfaz responsive y moderna

### **Backend (Node.js + Express):**
- ✅ API RESTful completa
- ✅ Conexión real a MongoDB
- ✅ Manejo de errores robusto
- ✅ Validaciones del servidor
- ✅ CORS habilitado
- ✅ Datos de ejemplo automáticos

### **Base de Datos (MongoDB):**
- ✅ Colección: `estudiantes`
- ✅ Base de datos: `utn_base_datos`
- ✅ Índices automáticos
- ✅ Validaciones de esquema

---

## 🛠️ **API ENDPOINTS**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/estudiantes` | Obtener todos los estudiantes |
| `POST` | `/api/estudiantes` | Crear nuevo estudiante |
| `PUT` | `/api/estudiantes/:id` | Actualizar estudiante |
| `DELETE` | `/api/estudiantes/:id` | Eliminar estudiante |
| `GET` | `/api/estudiantes/carrera/:carrera` | Buscar por carrera |
| `GET` | `/api/estudiantes/edad/:edadMin` | Buscar por edad mínima |
| `GET` | `/api/estudiantes/count` | Contar estudiantes |

---

## 📋 **ESTRUCTURA DE DATOS**

### **Esquema de Estudiante:**
```json
{
  "_id": "ObjectId generado automáticamente",
  "nombre": "String (requerido)",
  "apellido": "String (requerido)", 
  "edad": "Number (18-65, requerido)",
  "carrera": "String (requerido)",
  "materias": ["Array de strings"],
  "fechaCreacion": "Date (automático)",
  "fechaModificacion": "Date (automático al actualizar)"
}
```

### **Ejemplo de documento:**
```json
{
  "_id": "65f1234567890abcdef12345",
  "nombre": "María",
  "apellido": "González",
  "edad": 21,
  "carrera": "Sistemas",
  "materias": ["Base de Datos II", "Algoritmos", "Programación Web"],
  "fechaCreacion": "2024-03-15T10:30:00.000Z"
}
```

---

## 🧪 **EJEMPLOS DE USO**

### **1. Insertar estudiante (POST):**
```javascript
fetch('/api/estudiantes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: "Juan",
    apellido: "Pérez",
    edad: 22,
    carrera: "Sistemas",
    materias: "Algoritmos, Base de Datos, Programación"
  })
})
```

### **2. Consultar por carrera (GET):**
```javascript
fetch('/api/estudiantes/carrera/Sistemas')
```

### **3. Filtrar por edad (GET):**
```javascript
fetch('/api/estudiantes/edad/21')
```