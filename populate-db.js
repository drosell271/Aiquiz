const mongoose = require('mongoose');

// Configuración de la base de datos
const MONGODB_URI = 'mongodb://localhost:27017/aiquiz_manager';

// Esquemas de los modelos
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    faculty: String,
    department: String,
    role: { type: String, enum: ['admin', 'professor'], default: 'professor' },
    lastLogin: Date,
    isActive: { type: Boolean, default: false }
}, { timestamps: true });

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
});

const subtopicSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }]
}, { timestamps: true });

const topicSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    subtopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subtopic' }]
}, { timestamps: true });

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    acronym: { type: String, required: true, unique: true },
    description: String,
    professors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }]
}, { timestamps: true });

// Crear modelos
const User = mongoose.model('User', userSchema);
const Subject = mongoose.model('Subject', subjectSchema);
const Topic = mongoose.model('Topic', topicSchema);
const Subtopic = mongoose.model('Subtopic', subtopicSchema);
const File = mongoose.model('File', fileSchema);

// Datos para poblar
const subjectsData = [
    {
        name: 'Programación',
        acronym: 'PRG',
        description: 'Curso de programación básica y avanzada',
        topics: [
            {
                name: 'Java',
                description: 'Programación orientada a objetos con Java',
                subtopics: [
                    { name: 'Declaración de variables', description: 'Fundamentos de variables en Java' },
                    { name: 'Tipos de datos, operadores y expresiones', description: 'Tipos primitivos y operadores' },
                    { name: 'Bucles y condicionales', description: 'Estructuras de control' },
                    { name: 'Uso de Break y Continue', description: 'Control de flujo en bucles' },
                    { name: 'Clases y objetos', description: 'Programación orientada a objetos' },
                    { name: 'Comandos try, catch y finally', description: 'Manejo de excepciones básico' },
                    { name: 'Manejo de excepciones', description: 'Excepciones avanzadas' }
                ]
            }
        ]
    },
    {
        name: 'Computación en Red',
        acronym: 'CORE',
        description: 'Fundamentos de redes y tecnologías web',
        topics: [
            {
                name: 'HTTP',
                description: 'Protocolo de transferencia de hipertexto',
                subtopics: [
                    { name: 'URLs', description: 'Uniform Resource Locators' },
                    { name: 'Formato peticiones HTTP', description: 'Estructura de peticiones HTTP' },
                    { name: 'Cabeceras HTTP', description: 'Headers en HTTP' },
                    { name: 'Métodos POST, PUT, GET, DELETE, HEAD', description: 'Métodos HTTP principales' },
                    { name: 'Códigos de respuesta', description: 'Status codes HTTP' },
                    { name: 'Caché web', description: 'Mecanismos de caché' },
                    { name: 'Gestión de estado: parámetros ocultos, cookies, sesión', description: 'Manejo de estado en web' }
                ]
            },
            {
                name: 'HTML',
                description: 'Lenguaje de marcado de hipertexto',
                subtopics: [
                    { name: 'Estructura básica de un documento HTML', description: 'Elementos básicos HTML' },
                    { name: 'Atributos HTML', description: 'Atributos de elementos' },
                    { name: 'Id y clase HTML', description: 'Identificadores y clases' },
                    { name: 'Etiquetas de texto', description: 'Elementos de texto' },
                    { name: 'Etiquetas de hipervínculo', description: 'Enlaces y navegación' },
                    { name: 'Etiquetas de imagen', description: 'Manejo de imágenes' },
                    { name: 'Etiquetas de lista', description: 'Listas ordenadas y no ordenadas' },
                    { name: 'Tablas', description: 'Estructura de tablas' },
                    { name: 'Formularios', description: 'Formularios web' },
                    { name: 'Etiquetas de audio y video', description: 'Multimedia en HTML' }
                ]
            },
            {
                name: 'CSS',
                description: 'Hojas de estilo en cascada',
                subtopics: [
                    { name: 'Características principales', description: 'Fundamentos de CSS' },
                    { name: 'Sintaxis básica', description: 'Reglas y selectores básicos' },
                    { name: 'Selectores y prioridad', description: 'Especificidad en CSS' },
                    { name: 'Modelo de caja: margin, padding, border', description: 'Box model' },
                    { name: 'Unidades de medida', description: 'Unidades relativas y absolutas' },
                    { name: 'Posicionamiento', description: 'Position, float, etc.' },
                    { name: 'Display y visibility', description: 'Propiedades de visualización' },
                    { name: 'Flexbox', description: 'Layout flexible' },
                    { name: 'Grid', description: 'CSS Grid Layout' },
                    { name: 'Float y clear', description: 'Flotado de elementos' },
                    { name: 'Diseño responsive', description: 'Responsive design' },
                    { name: 'Media queries', description: 'Consultas de medios' },
                    { name: 'Variables CSS', description: 'Custom properties' }
                ]
            },
            {
                name: 'JavaScript',
                description: 'Lenguaje de programación JavaScript',
                subtopics: [
                    { name: 'Historia y evolución', description: 'Origen y evolución de JS' },
                    { name: 'Características principales', description: 'Características del lenguaje' },
                    { name: 'Sintaxis básica', description: 'Sintaxis fundamental' },
                    { name: 'Tipos de datos', description: 'Tipos primitivos y objetos' },
                    { name: 'Const, let, var', description: 'Declaración de variables' },
                    { name: 'Funciones', description: 'Definición y uso de funciones' },
                    { name: 'Objetos JavaScript', description: 'Objetos y propiedades' },
                    { name: 'Clases y herencia', description: 'Programación orientada a objetos' },
                    { name: 'Asincronía: callbacks, promesas, async/await', description: 'Programación asíncrona' },
                    { name: 'JSON', description: 'JavaScript Object Notation' }
                ]
            }
        ]
    },
    {
        name: 'Tecnologías Web',
        acronym: 'TECW',
        description: 'Tecnologías avanzadas para desarrollo web',
        topics: [
            {
                name: 'Node.js',
                description: 'Entorno de ejecución de JavaScript',
                subtopics: [
                    { name: 'Características principales', description: 'Event loop, non-blocking I/O' },
                    { name: 'NPM y versionado paquetes', description: 'Gestión de paquetes' },
                    { name: 'File System', description: 'Manejo de archivos' },
                    { name: 'Streams', description: 'Streams de datos' },
                    { name: 'Eventos', description: 'Event emitters' },
                    { name: 'package.json', description: 'Configuración de proyectos' }
                ]
            },
            {
                name: 'Express',
                description: 'Framework web para Node.js',
                subtopics: [
                    { name: 'Características principales', description: 'Framework minimalista' },
                    { name: 'Rutas', description: 'Definición de rutas' },
                    { name: 'Middleware', description: 'Funciones middleware' },
                    { name: 'Manejo de errores', description: 'Error handling' },
                    { name: 'Manejo de formularios', description: 'Procesamiento de forms' },
                    { name: 'Autenticación', description: 'Sistemas de autenticación' }
                ]
            }
        ]
    },
    {
        name: 'Bases de Datos',
        acronym: 'BBDD',
        description: 'Bases de datos relacionales y no relacionales',
        topics: [
            {
                name: 'Introducción a NoSQL',
                description: 'Fundamentos de bases de datos NoSQL',
                subtopics: [
                    { name: 'Las 5 Vs del Big Data', description: 'Volume, Velocity, Variety, Veracity, Value' },
                    { name: 'Teorema CAP', description: 'Consistency, Availability, Partition Tolerance' },
                    { name: 'ACID vs BASE', description: 'Propiedades transaccionales' }
                ]
            },
            {
                name: 'MongoDB',
                description: 'Base de datos orientada a documentos',
                subtopics: [
                    { name: 'Comandos básicos', description: 'Operaciones CRUD básicas' },
                    { name: 'Operaciones CRUD', description: 'Create, Read, Update, Delete' },
                    { name: 'Agregaciones', description: 'Pipeline de agregación' },
                    { name: 'Índices', description: 'Optimización de consultas' }
                ]
            }
        ]
    },
    {
        name: 'Ingeniería Web',
        acronym: 'IWEB',
        description: 'Desarrollo de aplicaciones web modernas',
        topics: [
            {
                name: 'React',
                description: 'Biblioteca JavaScript para interfaces',
                subtopics: [
                    { name: 'Componentes', description: 'Creación y uso de componentes' },
                    { name: 'Props y State', description: 'Propiedades y estado' },
                    { name: 'Hooks', description: 'useState, useEffect, etc.' },
                    { name: 'JSX', description: 'JavaScript XML' },
                    { name: 'React Router', description: 'Navegación en SPAs' },
                    { name: 'Context API', description: 'Gestión de estado global' }
                ]
            }
        ]
    }
];

async function populateDatabase() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar la base de datos
        console.log('🧹 Limpiando base de datos...');
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Topic.deleteMany({});
        await Subtopic.deleteMany({});
        await File.deleteMany({});

        // Crear usuario administrador
        console.log('👤 Creando usuario administrador...');
        const adminUser = await User.create({
            name: 'Administrador',
            email: 'admin@upm.es',
            password: '$2b$10$8K1p/a0dclxKfevr27oOiO4T2d3.WgFhgwRG5SFOmN/NPGhEzV6Sm', // password123
            faculty: 'ETSIT',
            department: 'Ingeniería de Sistemas Telemáticos',
            role: 'admin',
            isActive: true
        });

        // Crear profesor de prueba
        const professorUser = await User.create({
            name: 'Profesor Demo',
            email: 'profesor@upm.es',
            password: '$2b$10$8K1p/a0dclxKfevr27oOiO4T2d3.WgFhgwRG5SFOmN/NPGhEzV6Sm', // password123
            faculty: 'ETSIT',
            department: 'Ingeniería de Sistemas Telemáticos',
            role: 'professor',
            isActive: true
        });

        console.log('📚 Creando asignaturas, temas y subtemas...');

        // Crear asignaturas con sus temas y subtemas
        for (const subjectData of subjectsData) {
            console.log(`  📖 Creando asignatura: ${subjectData.name}`);
            
            // Crear la asignatura
            const subject = await Subject.create({
                name: subjectData.name,
                acronym: subjectData.acronym,
                description: subjectData.description,
                professors: [professorUser._id],
                topics: []
            });

            const topicIds = [];

            // Crear temas y subtemas
            for (const topicData of subjectData.topics) {
                console.log(`    📝 Creando tema: ${topicData.name}`);
                
                // Crear el tema
                const topic = await Topic.create({
                    name: topicData.name,
                    description: topicData.description,
                    subject: subject._id,
                    subtopics: []
                });

                const subtopicIds = [];

                // Crear subtemas
                for (const subtopicData of topicData.subtopics) {
                    console.log(`      📄 Creando subtema: ${subtopicData.name}`);
                    
                    const subtopic = await Subtopic.create({
                        name: subtopicData.name,
                        description: subtopicData.description,
                        topic: topic._id,
                        files: []
                    });

                    subtopicIds.push(subtopic._id);
                }

                // Actualizar el tema con los subtemas
                await Topic.findByIdAndUpdate(topic._id, {
                    subtopics: subtopicIds
                });

                topicIds.push(topic._id);
            }

            // Actualizar la asignatura con los temas
            await Subject.findByIdAndUpdate(subject._id, {
                topics: topicIds
            });

            console.log(`  ✅ Asignatura ${subjectData.name} creada con ${topicIds.length} temas`);
        }

        console.log('\n🎉 Base de datos poblada exitosamente!');
        console.log('\n📊 Resumen:');
        
        const subjectCount = await Subject.countDocuments();
        const topicCount = await Topic.countDocuments();
        const subtopicCount = await Subtopic.countDocuments();
        
        console.log(`   - ${subjectCount} asignaturas`);
        console.log(`   - ${topicCount} temas`);
        console.log(`   - ${subtopicCount} subtemas`);
        console.log(`   - 2 usuarios (admin y profesor)`);

        console.log('\n🔑 Credenciales de acceso:');
        console.log('   Administrador: admin@upm.es / password123');
        console.log('   Profesor: profesor@upm.es / password123');

    } catch (error) {
        console.error('❌ Error poblando la base de datos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
        process.exit(0);
    }
}

// Ejecutar el script
populateDatabase();