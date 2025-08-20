// URL base de la API
const API_BASE = '/api';

// Estado de la aplicación
let isConnected = false;

// Elementos DOM
const connectionStatus = document.getElementById('connectionStatus');
const resultArea = document.getElementById('resultArea');
const studentForm = document.getElementById('studentForm');
const queryTypeSelect = document.getElementById('queryType');
const filterGroup = document.getElementById('filterGroup');
const filterValue = document.getElementById('filterValue');

// ==================== INICIALIZACIÓN ====================

// Verificar conexión al cargar la página
window.addEventListener('load', function() {
    verificarConexion();
    cargarEstudiantes();
});

// ==================== CONEXIÓN Y ESTADO ====================

async function verificarConexion() {
    try {
        const response = await fetch(`${API_BASE}/estudiantes/count`);
        if (response.ok) {
            isConnected = true;
            updateConnectionStatus('connected', '✅ Conectado a MongoDB');
        } else {
            throw new Error('Error de conexión');
        }
    } catch (error) {
        isConnected = false;
        updateConnectionStatus('disconnected', '❌ Sin conexión');
        mostrarError('No se puede conectar al servidor. Asegúrate de que esté ejecutándose.');
    }
}

function updateConnectionStatus(status, text) {
    connectionStatus.className = `connection-status ${status}`;
    connectionStatus.textContent = text;
}

// ==================== MANEJO DE FORMULARIOS ====================

// Manejar cambio en tipo de consulta
queryTypeSelect.addEventListener('change', function() {
    if (this.value === 'byCarrera' || this.value === 'byEdad') {
        filterGroup.style.display = 'block';
        filterValue.placeholder = this.value === 'byCarrera' ? 'Nombre de la carrera' : 'Edad mínima';
        filterValue.focus();
    } else {
        filterGroup.style.display = 'none';
        filterValue.value = '';
    }
});

// Manejar envío del formulario de estudiantes
studentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!isConnected) {
        mostrarEstado('insertStatus', '❌ No hay conexión con el servidor', 'error');
        return;
    }
    
    // Recopilar datos del formulario
    const formData = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        edad: parseInt(document.getElementById('edad').value),
        carrera: document.getElementById('carrera').value,
        materias: document.getElementById('materias').value
    };
    
    // Validaciones del lado cliente
    if (!formData.nombre || !formData.apellido || !formData.carrera) {
        mostrarEstado('insertStatus', '⚠️ Todos los campos obligatorios deben completarse', 'error');
        return;
    }
    
    if (formData.edad < 18 || formData.edad > 65) {
        mostrarEstado('insertStatus', '⚠️ La edad debe estar entre 18 y 65 años', 'error');
        return;
    }
    
    try {
        // Mostrar estado de carga
        mostrarEstado('insertStatus', '⏳ Insertando estudiante...', 'warning');
        
        const response = await fetch(`${API_BASE}/estudiantes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarEstado('insertStatus', `✅ ${result.mensaje}`, 'success');
            
            // Mostrar el estudiante insertado en el área de resultados
            const estudianteCreado = result.data;
            mostrarResultado({
                consulta: 'POST /api/estudiantes',
                descripcion: 'Estudiante insertado correctamente',
                datos: estudianteCreado,
                total: 1
            });
            
            // Limpiar formulario
            studentForm.reset();
            
            // Recargar lista si estaba mostrando todos los estudiantes
            if (queryTypeSelect.value === 'all') {
                setTimeout(cargarEstudiantes, 1000);
            }
        } else {
            mostrarEstado('insertStatus', `❌ Error: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error insertando estudiante:', error);
        mostrarEstado('insertStatus', '❌ Error de conexión al insertar estudiante', 'error');
    }
});

// ==================== CONSULTAS ====================

async function executeQuery() {
    if (!isConnected) {
        mostrarEstado('queryStatus', '❌ No hay conexión con el servidor', 'error');
        return;
    }
    
    const queryType = queryTypeSelect.value;
    const filterVal = filterValue.value.trim();
    
    // Validaciones
    if ((queryType === 'byCarrera' || queryType === 'byEdad') && !filterVal) {
        const campo = queryType === 'byCarrera' ? 'carrera' : 'edad mínima';
        mostrarEstado('queryStatus', `⚠️ Ingrese el valor para ${campo}`, 'error');
        return;
    }
    
    if (queryType === 'byEdad' && (isNaN(filterVal) || parseInt(filterVal) < 0)) {
        mostrarEstado('queryStatus', '⚠️ La edad debe ser un número válido', 'error');
        return;
    }
    
    try {
        mostrarEstado('queryStatus', '⏳ Ejecutando consulta...', 'warning');
        
        let url, descripcion;
        
        switch(queryType) {
            case 'all':
                url = `${API_BASE}/estudiantes`;
                descripcion = 'Obtener todos los estudiantes';
                break;
                
            case 'byCarrera':
                url = `${API_BASE}/estudiantes/carrera/${encodeURIComponent(filterVal)}`;
                descripcion = `Buscar estudiantes por carrera: ${filterVal}`;
                break;
                
            case 'byEdad':
                url = `${API_BASE}/estudiantes/edad/${filterVal}`;
                descripcion = `Buscar estudiantes con edad mínima: ${filterVal}`;
                break;
                
            case 'count':
                url = `${API_BASE}/estudiantes/count`;
                descripcion = 'Contar total de estudiantes';
                break;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            mostrarEstado('queryStatus', `✅ Consulta ejecutada (${result.total || 1} resultado(s))`, 'success');
            
            mostrarResultado({
                consulta: `GET ${url}`,
                descripcion: descripcion,
                datos: result.data || { total: result.total },
                total: result.total || 1,
                filtro: result.filtro
            });
        } else {
            mostrarEstado('queryStatus', `❌ Error: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error ejecutando consulta:', error);
        mostrarEstado('queryStatus', '❌ Error de conexión al ejecutar consulta', 'error');
    }
}

async function cargarEstudiantes() {
    if (!isConnected) return;
    
    try {
        updateConnectionStatus('connecting', '🔄 Cargando...');
        
        const response = await fetch(`${API_BASE}/estudiantes`);
        const result = await response.json();
        
        if (result.success) {
            updateConnectionStatus('connected', '✅ Conectado a MongoDB');
            
            mostrarResultado({
                consulta: 'GET /api/estudiantes',
                descripcion: 'Datos iniciales cargados',
                datos: result.data,
                total: result.total
            });
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Error cargando estudiantes:', error);
        updateConnectionStatus('disconnected', '❌ Error de conexión');
        mostrarError('Error cargando datos iniciales');
    }
}

// ==================== UTILIDADES DE DISPLAY ====================

function mostrarResultado({ consulta, descripcion, datos, total, filtro }) {
    let texto = `🔍 ${descripcion}\n`;
    texto += `📡 Consulta: ${consulta}\n`;
    if (filtro) texto += `🔧 Filtro: ${filtro}\n`;
    texto += `📊 Resultados: ${total}\n`;
    texto += `⏰ ${new Date().toLocaleString()}\n`;
    texto += `${'='.repeat(50)}\n\n`;
    
    if (Array.isArray(datos) && datos.length > 0) {
        datos.forEach((item, index) => {
            texto += `📝 Estudiante ${index + 1}:\n`;
            texto += formatearJson(item);
            texto += '\n' + '-'.repeat(30) + '\n\n';
        });
    } else if (typeof datos === 'object' && datos !== null) {
        texto += formatearJson(datos);
    } else {
        texto += 'No se encontraron resultados\n';
    }
    
    resultArea.textContent = texto;
    resultArea.scrollTop = 0;
}

function formatearJson(obj) {
    return JSON.stringify(obj, null, 2);
}

function mostrarEstado(elementId, mensaje, tipo) {
    const statusElement = document.getElementById(elementId);
    statusElement.textContent = mensaje;
    statusElement.className = `status ${tipo}`;
    statusElement.style.display = 'block';
    
    // Auto-ocultar después de 4 segundos para success/warning
    if (tipo === 'success' || tipo === 'warning') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 4000);
    }
}

function mostrarError(mensaje) {
    resultArea.textContent = `❌ ERROR\n\n${mensaje}\n\nVerifica que:\n` +
        `• MongoDB esté ejecutándose en localhost:27017\n` +
        `• El servidor Node.js esté ejecutándose en puerto 3000\n` +
        `• No hay problemas de red\n\n` +
        `Comando para verificar MongoDB:\n` +
        `mongosh mongodb://localhost:27017\n\n` +
        `Comando para iniciar el servidor:\n` +
        `npm start`;
}

function limpiarResultados() {
    resultArea.textContent = `🍃 MongoDB Práctica - UTN FRT\n\n` +
        `Área de resultados limpiada.\n\n` +
        `• Usa el formulario para insertar estudiantes\n` +
        `• Usa las consultas para ver los datos\n` +
        `• Haz clic en "Recargar Datos" para ver todos los estudiantes\n\n` +
        `Estado de conexión: ${isConnected ? '✅ Conectado' : '❌ Desconectado'}`;
}

// ==================== FUNCIONES AUXILIARES ====================

// Función para recargar datos (llamada desde HTML)
window.cargarEstudiantes = cargarEstudiantes;
window.executeQuery = executeQuery;
window.limpiarResultados = limpiarResultados;

// Reconexión automática cada 30 segundos si está desconectado
setInterval(() => {
    if (!isConnected) {
        verificarConexion();
    }
}, 30000);

// Manejo de errores de red global
window.addEventListener('online', () => {
    if (!isConnected) {
        verificarConexion();
    }
});

window.addEventListener('offline', () => {
    updateConnectionStatus('disconnected', '❌ Sin conexión a internet');
    isConnected = false;
});

// ==================== ATAJOS DE TECLADO ====================

document.addEventListener('keydown', (e) => {
    // Ctrl + Enter para ejecutar consulta
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
    }
    
    // F5 para recargar datos
    if (e.key === 'F5') {
        e.preventDefault();
        cargarEstudiantes();
    }
});

// ==================== VALIDACIONES EN TIEMPO REAL ====================

// Validación de edad en tiempo real
document.getElementById('edad').addEventListener('input', function() {
    const edad = parseInt(this.value);
    if (edad && (edad < 18 || edad > 65)) {
        this.style.borderColor = '#e74c3c';
        this.title = 'La edad debe estar entre 18 y 65 años';
    } else {
        this.style.borderColor = '#ddd';
        this.title = '';
    }
});

// Validación de campos requeridos
['nombre', 'apellido', 'carrera'].forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('blur', function() {
        if (!this.value.trim()) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '#27ae60';
        }
    });
});

console.log('🚀 MongoDB Práctica - Cliente cargado correctamente');
console.log('📡 Conectando con API en:', API_BASE);