// app/api/manager/rag/search/route.js
import { NextResponse } from "next/server";
import { withAuth, handleError } from "../../../../utils/authMiddleware";

const logger = require('../../../../utils/logger').create('API:MANAGER:RAG');

// Función para cargar RAG Manager dinámicamente
async function loadRAGManager() {
	const isDevelopment = process.env.NODE_ENV !== 'production';
	
	if (isDevelopment) {
		logger.info('Using Mock RAG Manager for development');
		try {
			const MockRAGManager = require("../../../../lib/rag/src/core/mockRAGManager");
			const ragManager = new MockRAGManager();
			return { ragManager, isMock: true };
		} catch (mockError) {
			logger.error('Error loading Mock RAG Manager', { error: mockError.message });
			throw new Error(`Mock RAG Manager no disponible: ${mockError.message}`);
		}
	}
	
	try {
		logger.info('Attempting to load real RAG Manager');
		const RAGManager = require("../../../../lib/rag/src/core/ragManager");
		const ragManager = new RAGManager();
		return { ragManager, isMock: false };
	} catch (error) {
		logger.warn('Real RAG Manager not available, using Mock', { error: error.message });
		
		try {
			const MockRAGManager = require("../../../../lib/rag/src/core/mockRAGManager");
			const ragManager = new MockRAGManager();
			return { ragManager, isMock: true };
		} catch (mockError) {
			logger.error('Error loading Mock RAG Manager fallback', { error: mockError.message });
			throw new Error(`Sistema RAG completamente no disponible: ${mockError.message}`);
		}
	}
}

/**
 * @swagger
 * /api/manager/rag/search:
 *   post:
 *     tags:
 *       - RAG
 *     summary: Búsqueda semántica en documentos
 *     description: Realiza búsqueda semántica en los documentos procesados por RAG
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Consulta de búsqueda
 *                 example: "JavaScript variables"
 *               filters:
 *                 type: object
 *                 description: Filtros opcionales
 *                 properties:
 *                   subjectId:
 *                     type: string
 *                   topicId:
 *                     type: string
 *                   subtopicId:
 *                     type: string
 *               limit:
 *                 type: number
 *                 description: Número máximo de resultados
 *                 default: 10
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                     totalResults:
 *                       type: number
 *                     query:
 *                       type: string
 *                     processingTime:
 *                       type: number
 */

async function searchRAG(request, context) {
	logger.info('Starting semantic search');
	
	try {
		const body = await request.json();
		const { query, filters = {}, limit = 10 } = body;

		if (!query || typeof query !== 'string' || query.trim().length === 0) {
			return NextResponse.json(
				{
					success: false,
					message: "Query de búsqueda requerido",
				},
				{ status: 400 }
			);
		}

		logger.debug('Search parameters', {
			query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
			filters,
			limit
		});

		// Cargar RAG Manager
		const { ragManager, isMock } = await loadRAGManager();
		
		if (isMock) {
			logger.warn('Using RAG Manager in development mode (Mock)');
		}

		await ragManager.initialize();

		// Realizar búsqueda semántica
		const startTime = Date.now();
		const searchResult = await ragManager.semanticSearch(query, filters, limit);
		const processingTime = Date.now() - startTime;

		if (!searchResult.success) {
			return NextResponse.json(
				{
					success: false,
					message: "Error en búsqueda semántica",
					error: searchResult.error,
				},
				{ status: 500 }
			);
		}

		logger.info('Search completed', { 
			resultsCount: searchResult.results.length, 
			processingTimeMs: processingTime,
			mode: isMock ? 'mock' : 'production'
		});

		return NextResponse.json(
			{
				success: true,
				message: `${searchResult.results.length} resultados encontrados`,
				data: {
					...searchResult,
					processingTime,
					mode: isMock ? 'development' : 'production',
				},
			},
			{ status: 200 }
		);

	} catch (error) {
		logger.error('Error in semantic search', { error: error.message, stack: error.stack });
		return handleError(error, "Error en búsqueda semántica");
	}
}

/**
 * Obtiene estadísticas del sistema RAG
 */
async function getRAGStats(request, context) {
	logger.info('Getting RAG system statistics');
	
	try {
		const { ragManager, isMock } = await loadRAGManager();
		await ragManager.initialize();

		const stats = await ragManager.getSystemStats();

		return NextResponse.json(
			{
				success: true,
				message: "Estadísticas obtenidas",
				data: {
					...stats,
					mode: isMock ? 'development' : 'production',
				},
			},
			{ status: 200 }
		);

	} catch (error) {
		logger.error('Error getting RAG statistics', { error: error.message, stack: error.stack });
		return handleError(error, "Error obteniendo estadísticas");
	}
}

// Exportar handlers con autenticación
export const POST = withAuth(searchRAG, { requireProfessor: true });
export const GET = withAuth(getRAGStats, { requireProfessor: true });