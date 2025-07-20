// utils/initializeDB.js - Script para inicializar la base de datos con datos de prueba
const mongoose = require("mongoose");
const User = require("../manager/models/User");
const Subject = require("../manager/models/Subject");
const Topic = require("../manager/models/Topic");
const Subtopic = require("../manager/models/Subtopic");
const ManagerQuestion = require("../manager/models/ManagerQuestion");
const Questionnaire = require("../manager/models/Questionnaire");

/**
 * Inicializa la base de datos con datos de prueba
 */
async function initializeDB() {
	try {
		console.log("🔄 Inicializando base de datos con datos de prueba...");

		// Verificar si ya existe el usuario de prueba
		const existingUser = await User.findOne({ email: process.env.TEST_USER_EMAIL });
		let testUser;

		if (!existingUser) {
			// Crear usuario de prueba
			testUser = new User({
				name: process.env.TEST_USER_NAME || "Carlos González",
				email: process.env.TEST_USER_EMAIL || "admin@upm.es",
				password: process.env.TEST_USER_PASSWORD || "password123",
				faculty: process.env.TEST_USER_FACULTY || "ETSIT",
				department: process.env.TEST_USER_DEPARTMENT || "Ingeniería Telemática",
				role: "admin",
			});

			await testUser.save();
			console.log("✅ Usuario de prueba creado:", testUser.email);
		} else {
			testUser = existingUser;
			console.log("ℹ️  Usuario de prueba ya existe:", testUser.email);
		}

		// Verificar si ya existen asignaturas de prueba
		const existingSubjectsCount = await Subject.countDocuments();
		
		if (existingSubjectsCount === 0) {
			// Crear asignaturas de prueba
			const subjects = [
				{
					title: "Desarrollo de Aplicaciones Web",
					acronym: "DAW",
					description: "Curso completo sobre desarrollo web moderno con React, Node.js y bases de datos",
					administrators: [testUser._id],
					professors: [testUser._id],
				},
				{
					title: "Inteligencia Artificial",
					acronym: "IA",
					description: "Fundamentos de inteligencia artificial y machine learning",
					administrators: [testUser._id],
					professors: [testUser._id],
				},
				{
					title: "Bases de Datos",
					acronym: "BD",
					description: "Diseño y administración de bases de datos relacionales y NoSQL",
					administrators: [testUser._id],
					professors: [testUser._id],
				},
			];

			const createdSubjects = await Subject.insertMany(subjects);
			console.log(`✅ ${createdSubjects.length} asignaturas de prueba creadas`);

			// Crear temas para la primera asignatura
			const dawSubject = createdSubjects[0];
			const topics = [
				{
					title: "Fundamentos de JavaScript",
					description: "Conceptos básicos de JavaScript, variables, funciones y objetos",
					subject: dawSubject._id,
					order: 1,
				},
				{
					title: "React y Componentes",
					description: "Desarrollo de interfaces con React, hooks y gestión de estado",
					subject: dawSubject._id,
					order: 2,
				},
				{
					title: "Backend con Node.js",
					description: "Creación de APIs REST con Node.js y Express",
					subject: dawSubject._id,
					order: 3,
				},
			];

			const createdTopics = await Topic.insertMany(topics);
			console.log(`✅ ${createdTopics.length} temas de prueba creados`);

			// Crear subtemas para el primer tema
			const jsTopicId = createdTopics[0]._id;
			const subtopics = [
				{
					title: "Variables y Tipos de Datos",
					description: "Declaración de variables, tipos primitivos y objetos",
					content: "En JavaScript, las variables se pueden declarar con var, let o const...",
					topic: jsTopicId,
					order: 1,
				},
				{
					title: "Funciones y Scope",
					description: "Declaración de funciones, parámetros y ámbito de variables",
					content: "Las funciones en JavaScript son objetos de primera clase...",
					topic: jsTopicId,
					order: 2,
				},
				{
					title: "Arrays y Objetos",
					description: "Manipulación de arrays y objetos en JavaScript",
					content: "Los arrays en JavaScript son objetos especiales...",
					topic: jsTopicId,
					order: 3,
				},
			];

			const createdSubtopics = await Subtopic.insertMany(subtopics);
			console.log(`✅ ${createdSubtopics.length} subtemas de prueba creados`);

			// Crear preguntas de ejemplo
			const sampleQuestions = [
				{
					text: "¿Cuál es la diferencia entre let y var en JavaScript?",
					type: "Opción múltiple",
					difficulty: "Medio",
					topic: jsTopicId,
					subtopic: createdSubtopics[0]._id,
					choices: [
						{ text: "let tiene scope de bloque, var tiene scope de función", isCorrect: true },
						{ text: "No hay diferencia", isCorrect: false },
						{ text: "var es más moderno que let", isCorrect: false },
						{ text: "let no se puede reasignar", isCorrect: false },
					],
					explanation: "let fue introducido en ES6 y tiene scope de bloque, mientras que var tiene scope de función.",
					createdBy: testUser._id,
					verified: true,
				},
				{
					text: "¿Qué es una función de flecha en JavaScript?",
					type: "Opción múltiple",
					difficulty: "Fácil",
					topic: jsTopicId,
					subtopic: createdSubtopics[1]._id,
					choices: [
						{ text: "Una función que apunta hacia arriba", isCorrect: false },
						{ text: "Una sintaxis más corta para escribir funciones", isCorrect: true },
						{ text: "Una función que no puede tener parámetros", isCorrect: false },
						{ text: "Una función que siempre retorna un valor", isCorrect: false },
					],
					explanation: "Las funciones de flecha (=>) son una sintaxis más concisa introducida en ES6.",
					createdBy: testUser._id,
					verified: true,
				},
				{
					text: "¿Cuál es la forma correcta de crear un array en JavaScript?",
					type: "Opción múltiple",
					difficulty: "Fácil",
					topic: jsTopicId,
					subtopic: createdSubtopics[2]._id,
					choices: [
						{ text: "array = (1, 2, 3)", isCorrect: false },
						{ text: "array = [1, 2, 3]", isCorrect: true },
						{ text: "array = {1, 2, 3}", isCorrect: false },
						{ text: "array = <1, 2, 3>", isCorrect: false },
					],
					explanation: "Los arrays en JavaScript se crean usando corchetes [].",
					createdBy: testUser._id,
					verified: true,
				},
			];

			const createdQuestions = await ManagerQuestion.insertMany(sampleQuestions);
			console.log(`✅ ${createdQuestions.length} preguntas de ejemplo creadas`);

			// Crear cuestionario de ejemplo
			const sampleQuestionnaire = new Questionnaire({
				title: "Evaluación de JavaScript Básico",
				description: "Cuestionario para evaluar conocimientos básicos de JavaScript",
				topic: jsTopicId,
				questions: createdQuestions.map(q => q._id),
				createdBy: testUser._id,
				isPublic: true,
			});

			await sampleQuestionnaire.save();
			console.log("✅ Cuestionario de ejemplo creado");

		} else {
			console.log("ℹ️  Ya existen asignaturas en la base de datos");
		}

		console.log("🎉 Base de datos inicializada correctamente");
		return true;

	} catch (error) {
		console.error("❌ Error inicializando base de datos:", error);
		throw error;
	}
}

/**
 * Limpia la base de datos (solo para desarrollo)
 */
async function clearDB() {
	try {
		console.log("🧹 Limpiando base de datos...");
		
		await Promise.all([
			User.deleteMany({}),
			Subject.deleteMany({}),
			Topic.deleteMany({}),
			Subtopic.deleteMany({}),
			ManagerQuestion.deleteMany({}),
			Questionnaire.deleteMany({}),
		]);

		console.log("✅ Base de datos limpiada");
		return true;

	} catch (error) {
		console.error("❌ Error limpiando base de datos:", error);
		throw error;
	}
}

module.exports = {
	initializeDB,
	clearDB,
};