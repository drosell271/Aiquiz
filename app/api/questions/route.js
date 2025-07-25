import logger from "@utils/logger.js";
import { getModelResponse } from "@utils/llmManager.js";
import { fillPrompt } from "@utils/promptManager.js";
import { ABC_Testing_List } from "@app/constants/abctesting.js";
import { assignAIModel } from "@utils/modelManager.js";
import { getRAGContextForSubtopic, enhancePromptWithRAG } from "@utils/ragContextManager.js";

import dbConnect from "@utils/dbconnect.js";
import Student from "@app/models/Student.js";

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

// console.log("--------------------------------------------------");
// console.log('[questions/route.js] Connecting to database...');
await dbConnect();
// console.log('[questions/route.js] Database connected successfully');
// console.log("--------------------------------------------------");

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
		const responseLlmManager = await getModelResponse(
			assignedModel,
			finalPrompt
		);
		// Formatear la respuesta de la API
		const formattedResponse = responseLlmManager
			.replace(/^\[|\]$/g, "")
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();

		return new Response(formattedResponse);
	} catch (error) {
		console.error("Error during request:", error.message);
		return new Response("Error during request", { status: 500 });
	}
}

// Verificamos si el ABCTesting está activo según las fechas
const isABCTestingActive = (config) => {
	const currentDate = new Date();
	const fromDate = new Date(config.from_date);
	const toDate = new Date(config.to_date);
	const isactive = currentDate >= fromDate && currentDate <= toDate;
	if (!isactive) {
		console.log("--------------------------------------------------------");
		console.log(
			`ABCTesting fuera de fecha. Modificar o eliminar del archivo de configuración abctesting.js`
		);
		console.log("--------------------------------------------------------");
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
			console.log(
				"--------------------------------------------------------"
			);
			console.log(
				`Nuevo estudiante creado: ${studentEmail} con la asignatura ${subject}`
			);
			console.log(
				"--------------------------------------------------------"
			);
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
		console.log("--------------------------------------------------------");
		console.log(`Asignatura ${subject} añadida a ${studentEmail}`);
		console.log("--------------------------------------------------------");
		return student;
	} catch (error) {
		console.error(
			"Error asegurando la existencia del estudiante y su asignatura:",
			error.message
		);
		console.error(error);
	}
};
