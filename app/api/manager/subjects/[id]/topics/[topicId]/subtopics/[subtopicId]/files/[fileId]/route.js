// app/api/manager/subjects/[id]/topics/[topicId]/subtopics/[subtopicId]/files/[fileId]/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@utils/dbconnect";
import File from "@models/File";
import { withAuth, handleError } from "@utils/authMiddleware";

const logger = require('../../../../../../../../../utils/logger').create('API:FILES:MANAGER');

// Función para cargar RAG Manager dinámicamente (coherente con files/route.js)
async function loadRAGManager() {
	// Intentar primero con RAG real si Qdrant está disponible
	logger.debug('Checking Qdrant availability');
	
	// Verificar si Qdrant está corriendo
	try {
		const qdrantResponse = await fetch('http://localhost:6333/').catch(() => null);
		if (qdrantResponse && qdrantResponse.ok) {
			logger.debug('Qdrant available, trying RAG Manager V2');
			
			try {
				const RAGManagerV2 = require("../../../../../../../../../../lib/rag/src/core/ragManagerV2");
				const ragManager = new RAGManagerV2({
					enableLogging: true,
					chunkSize: 512,
					overlap: 50,
					embeddingModel: 'Xenova/all-MiniLM-L6-v2'
				});
				return { ragManager, isMock: false };
			} catch (realError) {
				logger.warn('Error loading RAG Manager V2', { error: realError.message });
				
				// Fallback al RAG Manager original
				try {
					const RAGManager = require("../../../../../../../../../../lib/rag/src/core/ragManager");
					const ragManager = new RAGManager();
					return { ragManager, isMock: false };
				} catch (fallbackError) {
					logger.warn('Error loading original RAG Manager', { error: fallbackError.message });
				}
			}
		} else {
			logger.info('Qdrant not available, using Mock');
		}
	} catch (healthError) {
		logger.warn('Error checking Qdrant', { error: healthError.message });
	}
	
	// Fallback a Mock si Qdrant no está disponible o hay errores
	logger.info('Using Mock RAG Manager as fallback');
	try {
		const MockRAGManager = require("../../../../../../../../../../lib/rag/src/core/mockRAGManager");
		const ragManager = new MockRAGManager();
		return { ragManager, isMock: true };
	} catch (mockError) {
		logger.error('Error loading Mock RAG Manager', { error: mockError.message });
		throw new Error(`Mock RAG Manager no disponible: ${mockError.message}`);
	}
}

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/subtopics/{subtopicId}/files/{fileId}:
 *   get:
 *     tags:
 *       - Files
 *     summary: Generar token de descarga para un archivo
 *     description: Genera un token temporal para descargar un archivo específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la asignatura
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tema
 *       - in: path
 *         name: subtopicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del subtema
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del archivo
 *     responses:
 *       200:
 *         description: Token de descarga generado exitosamente
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
 *                   example: Token de descarga generado
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                       example: /api/manager/subjects/123/topics/456/subtopics/789/files/abc/download?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     fileName:
 *                       type: string
 *                       example: documento.pdf
 *                     fileSize:
 *                       type: number
 *                       example: 1024576
 *                     mimeType:
 *                       type: string
 *                       example: application/pdf
 *                     expiresIn:
 *                       type: number
 *                       example: 300
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 *   delete:
 *     tags:
 *       - Files
 *     summary: Eliminar un archivo específico
 *     description: Elimina un archivo de un subtema, incluyendo su contenido RAG
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la asignatura
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tema
 *       - in: path
 *         name: subtopicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del subtema
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del archivo a eliminar
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente
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
 *                   example: Archivo eliminado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedFileId:
 *                       type: string
 *                     fileName:
 *                       type: string
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 */

async function generateDownloadToken(request, context) {
	logger.info('Generating download token');
	
	try {
		await dbConnect();
		logger.debug('Database connection established');

		const { id, topicId, subtopicId, fileId } = context.params;
		
		logger.debug('Request parameters', {
			subjectId: id,
			topicId,
			subtopicId,
			fileId
		});

		// 1. Buscar el archivo para verificar que existe
		const file = await File.findOne({ _id: fileId, subtopic: subtopicId });
		if (!file) {
			return NextResponse.json(
				{
					success: false,
					message: "Archivo no encontrado",
				},
				{ status: 404 }
			);
		}

		logger.info('File found', { fileName: file.originalName });

		// 2. Determinar información de descarga según el tipo de archivo
		let downloadFileName, downloadFileSize, downloadMimeType;

		if (file.fileType === 'video' && file.transcription && file.transcription.content) {
			// Es un video con transcripción
			downloadFileName = `${file.originalName.replace(/\.[^/.]+$/, '')}_transcripcion.txt`;
			downloadFileSize = Buffer.byteLength(file.transcription.content, 'utf-8') + 500; // Aproximado con metadatos
			downloadMimeType = 'text/plain; charset=utf-8';
		} else {
			// Es un archivo regular
			downloadFileName = file.originalName;
			downloadFileSize = file.size;
			downloadMimeType = file.mimeType;
		}

		// 3. Generar token temporal (válido por 5 minutos)
		const downloadToken = jwt.sign(
			{
				fileId: fileId,
				userId: context.user.id,
				type: 'download',
				fileName: downloadFileName
			},
			process.env.JWT_SECRET,
			{ expiresIn: '5m' }
		);

		// 4. Construir URL de descarga
		const downloadUrl = `/api/manager/subjects/${id}/topics/${topicId}/subtopics/${subtopicId}/files/${fileId}/download?token=${downloadToken}`;

		logger.info('Download token generated', { fileName: downloadFileName });

		return NextResponse.json(
			{
				success: true,
				message: "Token de descarga generado",
				data: {
					downloadUrl,
					fileName: downloadFileName,
					fileSize: downloadFileSize,
					mimeType: downloadMimeType,
					expiresIn: 300 // 5 minutos en segundos
				}
			},
			{ status: 200 }
		);

	} catch (error) {
		logger.error('Error generating download token', { error: error.message, stack: error.stack });
		return NextResponse.json(
			{
				success: false,
				message: "Error generando token de descarga",
				error: error.message,
			},
			{ status: 500 }
		);
	}
}

async function deleteFile(request, context) {
	logger.info('Deleting specific file');
	
	try {
		await dbConnect();
		logger.debug('Database connection established');

		const { id, topicId, subtopicId, fileId } = context.params;
		
		logger.debug('Request parameters', {
			subjectId: id,
			topicId,
			subtopicId,
			fileId
		});

		// 1. Buscar el archivo
		const file = await File.findOne({ _id: fileId, subtopic: subtopicId });
		if (!file) {
			return NextResponse.json(
				{
					success: false,
					message: "Archivo no encontrado",
				},
				{ status: 404 }
			);
		}

		logger.info('File found for deletion', { fileName: file.originalName });

		// 2. El archivo está almacenado en MongoDB, no hay archivo físico que eliminar
		logger.debug('File stored in MongoDB - no physical file deletion required');

		// 3. Eliminar del sistema RAG si fue procesado
		if (file.ragProcessed && file.ragDocumentId) {
			try {
				logger.info('Deleting from RAG system', { documentId: file.ragDocumentId });
				const { ragManager, isMock } = await loadRAGManager();
				await ragManager.initialize();
				
				const deleteResult = await ragManager.deleteDocument(file.ragDocumentId);
				logger.success('Document deleted from RAG', { isMock, result: deleteResult });
			} catch (ragError) {
				logger.warn('Error deleting from RAG (continuing)', { error: ragError.message });
			}
		} else {
			logger.debug('File not processed with RAG or missing document ID', { ragProcessed: file.ragProcessed, documentId: file.ragDocumentId });
		}

		// 4. Eliminar registro de la base de datos
		await File.findByIdAndDelete(fileId);
		logger.success('File record deleted from database');

		return NextResponse.json(
			{
				success: true,
				message: "Archivo eliminado exitosamente",
				data: {
					deletedFileId: fileId,
					fileName: file.originalName,
				},
			},
			{ status: 200 }
		);

	} catch (error) {
		logger.error('Error deleting file', { error: error.message, stack: error.stack });
		return handleError(error, "Error eliminando archivo");
	}
}

// Exportar handlers con autenticación
export const GET = withAuth(generateDownloadToken, { requireProfessor: true });
export const DELETE = withAuth(deleteFile, { requireProfessor: true });