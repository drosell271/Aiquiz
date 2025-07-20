// app/api/manager/subjects/[id]/topics/[topicId]/subtopics/[subtopicId]/files/[fileId]/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../../../../../../utils/dbconnect";
import File from "../../../../../../../../../../manager/models/File";
import { withAuth, handleError } from "../../../../../../../../../../utils/authMiddleware";
import path from "path";
import fs from "fs";

// Función para cargar RAG Manager dinámicamente (coherente con files/route.js)
async function loadRAGManager() {
	// Intentar primero con RAG real si Qdrant está disponible
	console.log('[Delete File API] Verificando disponibilidad de Qdrant...');
	
	// Verificar si Qdrant está corriendo
	try {
		const qdrantResponse = await fetch('http://localhost:6333/').catch(() => null);
		if (qdrantResponse && qdrantResponse.ok) {
			console.log('[Delete File API] ✅ Qdrant disponible, intentando RAG Manager V2...');
			
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
				console.warn('[Delete File API] Error cargando RAG Manager V2:', realError.message);
				
				// Fallback al RAG Manager original
				try {
					const RAGManager = require("../../../../../../../../../../lib/rag/src/core/ragManager");
					const ragManager = new RAGManager();
					return { ragManager, isMock: false };
				} catch (fallbackError) {
					console.warn('[Delete File API] Error cargando RAG Manager original:', fallbackError.message);
				}
			}
		} else {
			console.log('[Delete File API] Qdrant no disponible, usando Mock');
		}
	} catch (healthError) {
		console.log('[Delete File API] Error verificando Qdrant:', healthError.message);
	}
	
	// Fallback a Mock si Qdrant no está disponible o hay errores
	console.log('[Delete File API] Usando Mock RAG Manager como fallback');
	try {
		const MockRAGManager = require("../../../../../../../../../../lib/rag/src/core/mockRAGManager");
		const ragManager = new MockRAGManager();
		return { ragManager, isMock: true };
	} catch (mockError) {
		console.error('[Delete File API] Error cargando Mock RAG Manager:', mockError.message);
		throw new Error(`Mock RAG Manager no disponible: ${mockError.message}`);
	}
}

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/subtopics/{subtopicId}/files/{fileId}:
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

async function deleteFile(request, context) {
	console.log('🗑️ [Delete File API] Eliminando archivo específico');
	
	try {
		await dbConnect();
		console.log('✅ [Delete File API] Conexión a BD establecida');

		const { id, topicId, subtopicId, fileId } = context.params;
		
		console.log('🔍 [Delete File API] Parámetros:', {
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

		console.log(`📄 [Delete File API] Archivo encontrado: ${file.originalName}`);

		// 2. Eliminar archivo físico
		const filePath = path.join(process.cwd(), 'uploads', file.fileName);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			console.log('🗑️ [Delete File API] Archivo físico eliminado:', filePath);
		} else {
			console.log('⚠️ [Delete File API] Archivo físico no encontrado:', filePath);
		}

		// 3. Eliminar del sistema RAG si fue procesado
		if (file.ragProcessed && file.ragDocumentId) {
			try {
				console.log(`🧠 [Delete File API] Eliminando del sistema RAG... Document ID: ${file.ragDocumentId}`);
				const { ragManager, isMock } = await loadRAGManager();
				await ragManager.initialize();
				
				const deleteResult = await ragManager.deleteDocument(file.ragDocumentId);
				console.log(`✅ [Delete File API] Documento eliminado del RAG ${isMock ? '(Mock)' : ''}:`, deleteResult);
			} catch (ragError) {
				console.warn('[Delete File API] Error eliminando del RAG (continuando):', ragError.message);
			}
		} else {
			console.log(`⚠️ [Delete File API] Archivo no procesado con RAG o sin document ID. RAG processed: ${file.ragProcessed}, Document ID: ${file.ragDocumentId}`);
		}

		// 4. Eliminar registro de la base de datos
		await File.findByIdAndDelete(fileId);
		console.log('✅ [Delete File API] Registro eliminado de la BD');

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
		console.error('[Delete File API] Error eliminando archivo:', error);
		return handleError(error, "Error eliminando archivo");
	}
}

// Exportar handler con autenticación
export const DELETE = withAuth(deleteFile, { requireProfessor: true });