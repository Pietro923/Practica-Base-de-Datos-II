const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos desde carpeta public

// Configuración MongoDB
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "utn_base_datos";

// Variable para mantener la conexión
let db;

// Conectar a MongoDB al iniciar el servidor
async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("✅ Conectado a MongoDB");
        console.log(`📁 Base de datos: ${dbName}`);
        
        // Insertar datos de ejemplo si la colección está vacía
        const count = await db.collection('estudiantes').countDocuments();
        if (count === 0) {
            await insertarDatosEjemplo();
        }
    } catch (error) {
        console.error("❌ Error conectando a MongoDB:", error);
        process.exit(1);
    }
}

// ==================== RUTAS DE LA API ====================

// GET - Obtener todos los estudiantes
app.get('/api/estudiantes', async (req, res) => {
    try {
        const estudiantes = await db.collection('estudiantes').find().toArray();
        res.json({
            success: true,
            data: estudiantes,
            total: estudiantes.length
        });
    } catch (error) {
        console.error('Error obteniendo estudiantes:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// GET - Buscar estudiantes por carrera
app.get('/api/estudiantes/carrera/:carrera', async (req, res) => {
    try {
        const carrera = req.params.carrera;
        const estudiantes = await db.collection('estudiantes')
            .find({ carrera: { $regex: carrera, $options: 'i' } })
            .toArray();
        
        res.json({
            success: true,
            data: estudiantes,
            total: estudiantes.length,
            filtro: `Carrera: ${carrera}`
        });
    } catch (error) {
        console.error('Error buscando por carrera:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// GET - Buscar estudiantes por edad mínima
app.get('/api/estudiantes/edad/:edadMin', async (req, res) => {
    try {
        const edadMin = parseInt(req.params.edadMin);
        
        if (isNaN(edadMin)) {
            return res.status(400).json({
                success: false,
                error: 'La edad debe ser un número válido'
            });
        }
        
        const estudiantes = await db.collection('estudiantes')
            .find({ edad: { $gte: edadMin } })
            .toArray();
        
        res.json({
            success: true,
            data: estudiantes,
            total: estudiantes.length,
            filtro: `Edad mínima: ${edadMin}`
        });
    } catch (error) {
        console.error('Error buscando por edad:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// GET - Contar estudiantes
app.get('/api/estudiantes/count', async (req, res) => {
    try {
        const total = await db.collection('estudiantes').countDocuments();
        res.json({
            success: true,
            total: total
        });
    } catch (error) {
        console.error('Error contando estudiantes:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// POST - Crear nuevo estudiante
app.post('/api/estudiantes', async (req, res) => {
    try {
        const { nombre, apellido, edad, carrera, materias } = req.body;
        
        // Validaciones básicas
        if (!nombre || !apellido || !edad || !carrera) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: nombre, apellido, edad, carrera'
            });
        }
        
        // Convertir materias a array si es string
        let materiasArray = materias;
        if (typeof materias === 'string') {
            materiasArray = materias.split(',').map(m => m.trim()).filter(m => m.length > 0);
        }
        
        const nuevoEstudiante = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            edad: parseInt(edad),
            carrera: carrera.trim(),
            materias: materiasArray || [],
            fechaCreacion: new Date()
        };
        
        const resultado = await db.collection('estudiantes').insertOne(nuevoEstudiante);
        
        res.status(201).json({
            success: true,
            data: {
                _id: resultado.insertedId,
                ...nuevoEstudiante
            },
            mensaje: `Estudiante ${nombre} ${apellido} creado correctamente`
        });
        
    } catch (error) {
        console.error('Error creando estudiante:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// PUT - Actualizar estudiante
app.put('/api/estudiantes/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const actualizacion = req.body;
        
        // Validar ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'ID de estudiante inválido'
            });
        }
        
        // Agregar fecha de modificación
        actualizacion.fechaModificacion = new Date();
        
        const resultado = await db.collection('estudiantes').updateOne(
            { _id: new ObjectId(id) },
            { $set: actualizacion }
        );
        
        if (resultado.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Estudiante no encontrado'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Estudiante actualizado correctamente'
        });
        
    } catch (error) {
        console.error('Error actualizando estudiante:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// DELETE - Eliminar estudiante
app.delete('/api/estudiantes/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Validar ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'ID de estudiante inválido'
            });
        }
        
        const resultado = await db.collection('estudiantes').deleteOne(
            { _id: new ObjectId(id) }
        );
        
        if (resultado.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Estudiante no encontrado'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Estudiante eliminado correctamente'
        });
        
    } catch (error) {
        console.error('Error eliminando estudiante:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta principal - servir el HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, async () => {
    await connectDB();
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📱 Aplicación disponible en: http://localhost:${PORT}`);
    console.log(`🔗 API disponible en: http://localhost:${PORT}/api/estudiantes`);
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    try {
        await client.close();
        console.log('✅ Conexión a MongoDB cerrada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cerrando conexión:', error);
        process.exit(1);
    }
});