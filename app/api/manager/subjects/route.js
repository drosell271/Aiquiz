// app/api/manager/subjects/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../utils/dbconnect";
import Subject from "../../../manager/models/Subject";
import Topic from "../../../manager/models/Topic";
import { withAuth, handleError } from "../../../utils/authMiddleware";

/**
 * @swagger
 * /api/manager/subjects:
 *   get:
 *     tags:
 *       - Subjects
 *     summary: Obtener todas las asignaturas
 *     description: Recupera la lista completa de asignaturas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de asignaturas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 507f1f77bcf86cd799439011
 *                   title:
 *                     type: string
 *                     example: Desarrollo de Aplicaciones Web
 *                   acronym:
 *                     type: string
 *                     example: DAW
 *                   description:
 *                     type: string
 *                     example: Curso sobre desarrollo web moderno
 *                   administrators:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [507f1f77bcf86cd799439011]
 *                   professors:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [507f1f77bcf86cd799439011]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2023-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2023-01-01T00:00:00.000Z
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token de autorización no proporcionado
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error interno del servidor
 */
async function getSubjects(request, context) {
	try {
		await dbConnect();

		const subjects = await Subject.find()
			.populate("administrators", "name email")
			.populate("professors", "name email")
			.populate({
				path: "topics",
				select: "name title description order"
			})
			.sort({ createdAt: -1 });

		// Transformar datos para que coincidan con lo que espera SubjectCard
		const transformedSubjects = subjects.map((subject) => {
			const subjectObj = subject.toObject();
			return {
				id: subject._id?.toString() || 'no-id',
				title: subject.title || subjectObj.name || 'Sin título',
				description: subject.description || "Sin descripción",
				administrator: subject.administrators && subject.administrators.length > 0 
					? (subject.administrators[0].name || subject.administrators[0].email || 'Sin nombre')
					: "Sin asignar",
				topics: subject.topics && Array.isArray(subject.topics) && subject.topics.length > 0 
					? subject.topics.filter(topic => topic && (topic.title || (topic.toObject && topic.toObject().name))).map(topic => topic.title || (topic.toObject && topic.toObject().name))
					: []
			};
		});
		return NextResponse.json(transformedSubjects, { status: 200 });

	} catch (error) {
		console.error("Error in getSubjects:", error);
		
		// Check if it's a database connection error
		if (error.message.includes("Database connection failed")) {
			return NextResponse.json(
				{
					success: false,
					message: "No se pudo conectar a la base de datos. Asegúrate de que MongoDB esté ejecutándose.",
					error: process.env.NODE_ENV === "development" ? error.message : undefined,
				},
				{ status: 503 }
			);
		}
		
		return handleError(error, "Error obteniendo asignaturas");
	}
}

/**
 * @swagger
 * /api/manager/subjects:
 *   post:
 *     tags:
 *       - Subjects
 *     summary: Crear nueva asignatura
 *     description: Crea una nueva asignatura en el sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - acronym
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título de la asignatura
 *                 example: Desarrollo de Aplicaciones Web
 *               acronym:
 *                 type: string
 *                 description: Acrónimo de la asignatura
 *                 example: DAW
 *               description:
 *                 type: string
 *                 description: Descripción de la asignatura
 *                 example: Curso sobre desarrollo web moderno
 *               professors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de profesores asignados
 *                 example: [507f1f77bcf86cd799439011]
 *     responses:
 *       201:
 *         description: Asignatura creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Asignatura creada correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     title:
 *                       type: string
 *                       example: Desarrollo de Aplicaciones Web
 *                     acronym:
 *                       type: string
 *                       example: DAW
 *                     description:
 *                       type: string
 *                       example: Curso sobre desarrollo web moderno
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Título y acrónimo son obligatorios
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token de autorización no proporcionado
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error interno del servidor
 */
async function createSubject(request, context) {
	try {
		await dbConnect();

		const { title, acronym, description, professors } = await request.json();

		// Validar datos obligatorios
		if (!title || !acronym) {
			return NextResponse.json(
				{
					success: false,
					message: "Título y acrónimo son obligatorios",
				},
				{ status: 400 }
			);
		}

		// Procesar profesores: puede venir como array de objetos o array de IDs
		let processedProfessors = [context.user.id];
		if (professors && Array.isArray(professors)) {
			if (professors.length > 0) {
				// Si vienen como objetos con email, crear solo el usuario actual
				// En el futuro, aquí se buscarían los usuarios por email
				processedProfessors = [context.user.id];
			}
		}

		// Crear nueva asignatura
		const subject = new Subject({
			title: title.trim(),
			acronym: acronym.trim().toUpperCase(),
			description: description?.trim() || "",
			administrators: [context.user.id],
			professors: processedProfessors,
		});

		const savedSubject = await subject.save();

		// Poblar datos para la respuesta
		const populatedSubject = await Subject.findById(savedSubject._id)
			.populate("administrators", "name email")
			.populate("professors", "name email");

		return NextResponse.json(
			{
				success: true,
				message: "Asignatura creada correctamente",
				data: populatedSubject,
			},
			{ status: 201 }
		);

	} catch (error) {
		if (error.code === 11000) {
			return NextResponse.json(
				{
					success: false,
					message: "Ya existe una asignatura con ese acrónimo",
				},
				{ status: 400 }
			);
		}
		return handleError(error, "Error creando asignatura");
	}
}

// Exportar handlers con autenticación
export const GET = withAuth(getSubjects, { requireProfessor: true });
export const POST = withAuth(createSubject, { requireProfessor: true });