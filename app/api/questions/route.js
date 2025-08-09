import logger from "@utils/logger.js";
import { getModelResponse } from "@utils/llmManager.js";
import { fillPrompt } from "@utils/promptManager.js";
import { ABC_Testing_List } from "@app/constants/abctesting.js";
import { assignAIModel } from "@utils/modelManager.js";
import { getRAGContextForSubtopic, enhancePromptWithRAG } from "@utils/ragContextManager.js";

import dbConnect from "@utils/dbconnect.js";
import Student from "@app/models/Student.js";
import Question from "@app/models/Question.js";
import Topic from "@app/manager/models/Topic.js";
import Subtopic from "@app/manager/models/Subtopic.js";

// Logger específico para questions
const questionsLogger = logger.create('Questions');

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Generate quiz questions
 *     description: Generates quiz questions based on the provided parameters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *               - difficulty
 *               - topic
 *               - numQuestions
 *               - studentEmail
 *               - subject
 *             properties:
 *               language:
 *                 type: string
 *                 description: Language for the questions
 *               difficulty:
 *                 type: string
 *                 description: Difficulty level (facil, intermedio, avanzado)
 *               topic:
 *                 type: string
 *                 description: Topic for the questions
 *               numQuestions:
 *                 type: number
 *                 description: Number of questions to generate
 *               studentEmail:
 *                 type: string
 *                 description: Email of the student
 *               subject:
 *                 type: string
 *                 description: Subject code (PRG, CORE, etc.)
 *               subtopicId:
 *                 type: string
 *                 description: Optional ID of the subtopic for RAG context
 *     responses:
 *       200:
 *         description: Successfully generated questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                         description: The question text
 *                       choices:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: List of possible answers
 *                       answer:
 *                         type: number
 *                         description: Index of the correct answer
 *                       explanation:
 *                         type: string
 *                         description: Explanation of the correct answer
 *       500:
 *         description: Server error
 */

questionsLogger.info('Connecting to database...');
await dbConnect();
questionsLogger.success('Database connected successfully');

// Manejar las solicitudes HTTP POST
export async function POST(request) {
	try {
		const {
			language,
			difficulty,
			topic,
			numQuestions,
			studentEmail,
			subject,
			subtopicId,
		} = await request.json();

		// DEBUG: Log para verificar el número de preguntas recibido
		questionsLogger.debug("Parameters received in /api/questions", {
			numQuestions,
			numQuestionsType: typeof numQuestions,
			topic,
			difficulty,
			studentEmail,
			subject,
			subtopicId
		});

		// Cargamos variables y objetos de configuración

		// Comprobamos si el ABCTesting está activo para la asignatura
		let abcTestingConfig = ABC_Testing_List[subject];
		let has_abctesting =
			(abcTestingConfig && isABCTestingActive(abcTestingConfig)) ?? false;

		// Comprobaos si existe el alumno en la base de datos,
		// si existe pero no tiene la asignatura, la añadimos,
		// si no existe, lo creamos y se devuelve el objeto del alumno
		let existingStudent = await getAndEnsureStudentAndSubject(
			studentEmail,
			subject,
			has_abctesting
		);

		let studentSubjectData = await existingStudent?.subjects?.find(
			(s) => s.subjectName === subject
		);
		let subjectIndex = await existingStudent?.subjects?.findIndex(
			(s) => s.subjectName === subject
		);

		// SOLICITUD A LA API de promptManager para obtener el prompt final
		let finalPrompt = await fillPrompt(
			abcTestingConfig,
			has_abctesting,
			language,
			difficulty,
			topic,
			numQuestions,
			studentEmail,
			existingStudent,
			studentSubjectData,
			subjectIndex
		);

		// 🔍 INTEGRACIÓN RAG: Buscar contexto específico del subtema
		questionsLogger.progress("Buscando contexto RAG para el subtema", { subtopicId, topic });
		const ragContext = await getRAGContextForSubtopic(subtopicId, topic, 3);
		
		if (ragContext && ragContext.trim() !== "") {
			questionsLogger.success(`Contexto RAG obtenido: ${ragContext.length} caracteres`);
			finalPrompt = enhancePromptWithRAG(finalPrompt, ragContext);
			questionsLogger.info("Prompt enriquecido con contexto RAG");
		} else {
			questionsLogger.warn("No se encontró contexto RAG, usando generación estándar");
		}

		// SOLICITUD A LA API de modelManager para asignar un modelo de LLM al alumno
		const assignedModel = await assignAIModel(
			abcTestingConfig,
			has_abctesting,
			existingStudent,
			studentSubjectData,
			subjectIndex
		);

		// Log de asignación de modelo
		questionsLogger.separator("ASIGNACIÓN DE MODELO");
		questionsLogger.info(`Modelo asignado: ${assignedModel}`, {
			student: studentEmail,
			subject: subject,
			abcTesting: has_abctesting
		});

		// SOLICITUD A LA API del LLM seleccionado para el alumno
		questionsLogger.debug(`Enviando prompt al modelo ${assignedModel}`);
		let responseLlmManager;
		try {
			responseLlmManager = await getModelResponse(
				assignedModel,
				finalPrompt
			);
			questionsLogger.success(`Respuesta recibida del modelo ${assignedModel}`);
		} catch (llmError) {
			questionsLogger.error(`Error en getModelResponse para ${assignedModel}:`, {
				message: llmError.message,
				status: llmError.status,
				code: llmError.code
			});
			// Error already logged above with questionsLogger
			throw llmError;
		}
		// Formatear la respuesta de la API
		const formattedResponse = responseLlmManager
			.replace(/^\[|\]$/g, "")
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();

		// Guardar preguntas generadas en el manager si tenemos subtopicId
		if (subtopicId) {
			try {
				await saveQuestionsToManager(formattedResponse, assignedModel, finalPrompt, subtopicId, topic, difficulty);
			} catch (saveError) {
				questionsLogger.warn("Error guardando preguntas en manager:", saveError.message);
				// No fallar la respuesta principal por un error de guardado
			}
		}

		return new Response(formattedResponse);
	} catch (error) {
		questionsLogger.error("Error general en POST /api/questions:", {
			message: error.message,
			stack: error.stack,
			status: error.status,
			code: error.code
		});
		// Detailed error already logged above with questionsLogger
		return new Response(JSON.stringify({
			error: "Error generating questions",
			message: error.message,
			details: error.status ? `Status: ${error.status}` : "Unknown error"
		}), { 
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

// Verificamos si el ABCTesting está activo según las fechas
const isABCTestingActive = (config) => {
	const currentDate = new Date();
	const fromDate = new Date(config.from_date);
	const toDate = new Date(config.to_date);
	const isactive = currentDate >= fromDate && currentDate <= toDate;
	if (!isactive) {
		questionsLogger.warn("ABCTesting is out of date", {
			message: "Modify or remove from abctesting.js configuration file",
			config: config
		});
	}
	return isactive;
};

// Comprobamos si el alumno existe, si no tiene la asignatura la añade, si no existe lo crea
const getAndEnsureStudentAndSubject = async (
	studentEmail,
	subject,
	has_abctesting
) => {
	try {
		let student = await Student.findOne({ studentEmail });

		if (!student || student === null) {
			// Si el estudiante no existe, lo creamos con la asignatura
			student = new Student({
				studentEmail,
				subjects: [
					{
						subjectName: subject,
						subjectModel: "Nuevo estudiante",
						ABC_Testing: has_abctesting,
						survey: false,
						md5Prompt: null,
						prompt: null,
					},
				],
			});
			await student.save();
			questionsLogger.success("New student created", {
				studentEmail,
				subject,
				abcTesting: has_abctesting
			});
			return student;
		}

		// Si el estudiante ya tiene la asignatura, salimos sin hacer nada ni mostrar logs
		if (student.subjects.some((s) => s.subjectName === subject)) {
			return student;
		}

		// Si el estudiante existe pero no tiene la asignatura, la añadimos
		student.subjects.push({
			subjectName: subject,
			subjectModel: "Nuevo estudiante",
			ABC_Testing: has_abctesting,
			survey: false,
			md5Prompt: null,
			prompt: null,
		});
		await student.save();
		questionsLogger.success("Subject added to existing student", {
			subject,
			studentEmail
		});
		return student;
	} catch (error) {
		questionsLogger.error("Error ensuring student and subject existence", {
			error: error.message,
			stack: error.stack,
			studentEmail,
			subject
		});
	}
};

// Función para guardar preguntas generadas en el modelo unificado
async function saveQuestionsToManager(formattedResponse, assignedModel, prompt, subtopicId, topicName, difficulty) {
	try {
		questionsLogger.info("Guardando preguntas generadas en modelo unificado");
		
		// Parsear la respuesta JSON
		const questionsData = JSON.parse(formattedResponse);
		if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
			throw new Error("Formato de respuesta inválido");
		}

		// Buscar el subtopic para obtener el topic
		const subtopic = await Subtopic.findById(subtopicId).populate('topic');
		if (!subtopic) {
			throw new Error(`Subtopic no encontrado: ${subtopicId}`);
		}

		const topicId = subtopic.topic._id;

		// Convertir y guardar cada pregunta usando el modelo unificado
		const unifiedQuestions = questionsData.questions.map(q => {
			return {
				// Generar ID numérico para compatibilidad con quiz
				id: Math.floor(Math.random() * 1000000000),
				text: q.query,
				type: "Opción múltiple",
				difficulty: difficulty, // Se normalizará automáticamente en el middleware
				choices: q.choices, // Array simple, se convertirá automáticamente
				answer: q.answer,
				explanation: q.explanation || '',
				
				// Referencias del manager
				topicRef: topicId,
				subtopic: subtopicId,
				topic: topicName, // String para compatibilidad
				
				// Metadatos de generación
				generated: true,
				llmModel: assignedModel,
				generationPrompt: prompt.substring(0, 500) + '...',
				verified: false,
				tags: [topicName, 'auto-generated'],
				source: "generated"
			};
		});

		// Guardar en la base de datos usando el modelo unificado
		const savedQuestions = await Question.insertMany(unifiedQuestions);
		
		questionsLogger.success(`${savedQuestions.length} preguntas guardadas en modelo unificado para topic ${topicId}`);
		
		return savedQuestions;
		
	} catch (error) {
		questionsLogger.error("Error en saveQuestionsToManager:", error.message);
		throw error;
	}
}
