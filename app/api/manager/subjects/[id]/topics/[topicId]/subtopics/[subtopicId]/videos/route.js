// app/api/manager/subjects/[id]/topics/[topicId]/subtopics/[subtopicId]/videos/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../../../../../utils/dbconnect";
import Subtopic from "../../../../../../../../../manager/models/Subtopic";
import File from "../../../../../../../../../manager/models/File";
import { withAuth, handleError } from "../../../../../../../../../utils/authMiddleware";

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/subtopics/{subtopicId}/videos:
 *   post:
 *     tags:
 *       - Videos
 *     summary: Añadir URL de video a subtema
 *     description: |
 *       🚨 ENDPOINT PENDIENTE DE IMPLEMENTACIÓN 🚨
 *       
 *       Este endpoint debe implementar la adición de URLs de video para subtemas.
 *       
 *       Funcionalidad requerida:
 *       - Validar URL de video
 *       - Detectar plataforma (YouTube, Vimeo, etc.)
 *       - Extraer metadata del video (título, duración, thumbnail)
 *       - Crear registro en base de datos
 *       - Asociar video al subtema
 *       
 *       Ubicación: /mnt/c/Users/drmor/Documents/04 Otros/02 TFM/temp/app/api/manager/subjects/[id]/topics/[topicId]/subtopics/[subtopicId]/videos/route.js
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la asignatura
 *         example: 507f1f77bcf86cd799439011
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tema
 *         example: 507f1f77bcf86cd799439012
 *       - in: path
 *         name: subtopicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del subtema
 *         example: 507f1f77bcf86cd799439013
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL del video
 *                 example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *               platform:
 *                 type: string
 *                 enum: [youtube, vimeo, custom]
 *                 description: Plataforma del video (se detecta automáticamente)
 *                 example: youtube
 *               title:
 *                 type: string
 *                 description: Título personalizado del video (opcional)
 *                 example: Introducción a Variables JavaScript
 *               description:
 *                 type: string
 *                 description: Descripción del video (opcional)
 *                 example: Video explicativo sobre variables en JavaScript
 *     responses:
 *       200:
 *         description: URL de video añadida exitosamente
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
 *                   example: URL de video añadida correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439014
 *                     originalName:
 *                       type: string
 *                       example: "Video - Variables JavaScript"
 *                     externalUrl:
 *                       type: string
 *                       example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *                     platform:
 *                       type: string
 *                       example: youtube
 *                     fileType:
 *                       type: string
 *                       example: video
 *                     isExternal:
 *                       type: boolean
 *                       example: true
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: Rick Astley - Never Gonna Give You Up
 *                         duration:
 *                           type: string
 *                           example: 00:03:33
 *                         thumbnail:
 *                           type: string
 *                           example: https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg
 *       400:
 *         description: Error de validación
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
 *                   example: URL de video inválida
 *       404:
 *         description: Subtema no encontrado
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
 *                   example: Subtema no encontrado
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
 *                   example: Error añadiendo video
 */
async function addVideo(request, context) {
	try {
		await dbConnect();

		const { id, topicId, subtopicId } = context.params;
		const { url, platform, title, description } = await request.json();

		// Validar URL obligatoria
		if (!url) {
			return NextResponse.json(
				{
					success: false,
					message: "La URL del video es obligatoria",
				},
				{ status: 400 }
			);
		}

		// Verificar que el subtema existe
		const subtopic = await Subtopic.findOne({ _id: subtopicId, topic: topicId });
		if (!subtopic) {
			return NextResponse.json(
				{
					success: false,
					message: "Subtema no encontrado",
				},
				{ status: 404 }
			);
		}

		// 🚨 IMPLEMENTACIÓN PENDIENTE 🚨
		// 
		// TODO: Implementar adición de URLs de video
		// 
		// Pasos requeridos:
		// 1. Validar formato de URL
		// 2. Detectar plataforma automáticamente
		// 3. Extraer metadata del video
		// 4. Crear registro de archivo con tipo video
		// 5. Asociar video al subtema
		// 6. Retornar datos del video

		// Validación básica de URL
		const urlRegex = /^https?:\/\/.+/;
		if (!urlRegex.test(url)) {
			return NextResponse.json(
				{
					success: false,
					message: "URL de video inválida",
				},
				{ status: 400 }
			);
		}

		// SIMULACIÓN TEMPORAL - Remover cuando se implemente
		return NextResponse.json(
			{
				success: false,
				message: "🚨 FUNCIONALIDAD PENDIENTE DE IMPLEMENTACIÓN 🚨",
				note: "Este endpoint requiere implementación de gestión de videos",
				location: "app/api/manager/subjects/[id]/topics/[topicId]/subtopics/[subtopicId]/videos/route.js",
				required: [
					"Validación de URLs de video",
					"Detección automática de plataforma",
					"Extracción de metadata (título, duración, thumbnail)",
					"Creación de registro en base de datos",
					"Asociación al subtema",
				],
				providedData: {
					url,
					platform,
					title,
					description,
				},
			},
			{ status: 501 }
		);

	} catch (error) {
		return handleError(error, "Error añadiendo video");
	}
}

// Exportar handler con autenticación
export const POST = withAuth(addVideo, { requireProfessor: true });