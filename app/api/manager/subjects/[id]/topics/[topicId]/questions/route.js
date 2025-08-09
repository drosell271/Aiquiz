// app/api/manager/subjects/[id]/topics/[topicId]/questions/route.js
import { NextResponse } from "next/server";
import dbConnect from "@utils/dbconnect";
import Question from "@app/models/Question";
import Subtopic from "@app/manager/models/Subtopic";
import { withAuth, handleError } from "@utils/authMiddleware";

const logger = require('../../../../../../utils/logger').create('API:QUESTIONS:TOPIC');

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/questions:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Obtener preguntas de un tema
 *     description: Obtiene todas las preguntas asociadas a un tema específico
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
 *       - in: query
 *         name: verified
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filtrar por estado de verificación
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [Fácil, Medio, Avanzado]
 *         description: Filtrar por dificultad
 *       - in: query
 *         name: generated
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filtrar preguntas generadas automáticamente
 *     responses:
 *       200:
 *         description: Lista de preguntas del tema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       text:
 *                         type: string
 *                       type:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                       choices:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:
 *                               type: string
 *                             isCorrect:
 *                               type: boolean
 *                       explanation:
 *                         type: string
 *                       verified:
 *                         type: boolean
 *                       generated:
 *                         type: boolean
 *                       llmModel:
 *                         type: string
 *                       usageCount:
 *                         type: number
 *                       successRate:
 *                         type: number
 *                 total:
 *                   type: number
 *                   description: Total de preguntas
 *                 stats:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: number
 *                     unverified:
 *                       type: number
 *                     generated:
 *                       type: number
 *                     manual:
 *                       type: number
 *       404:
 *         description: Tema no encontrado
 *       500:
 *         description: Error del servidor
 */

async function getTopicQuestions(request, context) {
    logger.info('Getting topic questions');
    logger.debug('Request context', { context, url: request.url });
    
    try {
        await dbConnect();
        logger.debug('Database connection established');

        const { id, topicId } = context.params;
        const { searchParams } = new URL(request.url);
        
        const verified = searchParams.get('verified');
        const difficulty = searchParams.get('difficulty');
        const generated = searchParams.get('generated');
        
        logger.debug('Request parameters', {
            subjectId: id,
            topicId,
            verified,
            difficulty,
            generated
        });

        // Obtener todos los subtopics de este topic
        const subtopics = await Subtopic.find({ topic: topicId }).lean();
        const subtopicIds = subtopics.map(st => st._id);
        
        logger.debug('Subtopics found for topic', { subtopicsCount: subtopics.length, topicId, subtopicIds });
        
        // Construir filtros para el modelo unificado - incluir preguntas de subtemas
        const filters = { 
            $or: [
                { topicRef: topicId },              // Preguntas directamente del topic (manager)
                { topic: topicId },                 // Preguntas del quiz con topic como string
                { topic: topicId.toString() },      // Preguntas del quiz con topic como ObjectId convertido
                { subtopic: { $in: subtopicIds } }  // Preguntas en cualquier subtema de este topic
            ]
        };
        
        if (verified === 'true') {
            filters.verified = true;
        } else if (verified === 'false') {
            filters.verified = false;
        }
        
        if (difficulty && ['Fácil', 'Medio', 'Avanzado'].includes(difficulty)) {
            filters.difficulty = difficulty;
        }
        
        if (generated === 'true') {
            filters.generated = true;
        } else if (generated === 'false') {
            filters.generated = false;
        }

        // Obtener preguntas con población de datos relacionados
        const questions = await Question.find(filters)
            .populate('subtopic', 'title')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        logger.info('Questions found', { count: questions.length });
        logger.debug('Sample questions', { sample: questions.slice(0, 2) });

        // Calcular estadísticas para el modelo unificado - incluir preguntas de subtemas
        const allQuestions = await Question.find({ 
            $or: [
                { topicRef: topicId },              // Preguntas directamente del topic (manager)
                { topic: topicId },                 // Preguntas del quiz con topic como string
                { topic: topicId.toString() },      // Preguntas del quiz con topic como ObjectId convertido
                { subtopic: { $in: subtopicIds } }  // Preguntas en cualquier subtema de este topic
            ]
        }).lean();
        const stats = {
            verified: allQuestions.filter(q => q.verified).length,
            unverified: allQuestions.filter(q => !q.verified && !q.rejected).length,
            generated: allQuestions.filter(q => q.generated).length,
            manual: allQuestions.filter(q => !q.generated).length,
            total: allQuestions.length
        };

        // Formatear preguntas para respuesta
        const formattedQuestions = questions.map(question => ({
            _id: question._id,
            text: question.text,
            type: question.type,
            difficulty: question.difficulty,
            choices: question.choices,
            explanation: question.explanation,
            verified: question.verified,
            rejected: question.rejected,
            generated: question.generated,
            llmModel: question.llmModel,
            tags: question.tags,
            usageCount: question.usageCount,
            successRate: question.totalAnswersCount > 0 
                ? Math.round((question.correctAnswersCount / question.totalAnswersCount) * 100)
                : 0,
            subtopic: question.subtopic,
            createdBy: question.createdBy,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt
        }));

        const response = {
            success: true,
            questions: formattedQuestions,
            total: questions.length,
            stats
        };
        
        logger.success('Response sent', {
            success: response.success,
            questionsCount: response.questions.length,
            stats: response.stats
        });
        
        return NextResponse.json(response);

    } catch (error) {
        logger.error('Error getting topic questions', { error: error.message, stack: error.stack });
        return handleError(error, "Error obteniendo preguntas del tema");
    }
}

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/questions:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Crear nueva pregunta
 *     description: Crea una nueva pregunta para el tema
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - type
 *               - difficulty
 *               - choices
 *             properties:
 *               text:
 *                 type: string
 *                 description: Texto de la pregunta
 *               type:
 *                 type: string
 *                 enum: [Opción múltiple, Verdadero/Falso, Respuesta corta, Ensayo]
 *                 description: Tipo de pregunta
 *               difficulty:
 *                 type: string
 *                 enum: [Fácil, Medio, Avanzado]
 *                 description: Dificultad de la pregunta
 *               choices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *                 description: Opciones de respuesta
 *               explanation:
 *                 type: string
 *                 description: Explicación de la respuesta correcta
 *               subtopicId:
 *                 type: string
 *                 description: ID del subtema (opcional)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Etiquetas de la pregunta
 *     responses:
 *       201:
 *         description: Pregunta creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */

async function createQuestion(request, context) {
    logger.info('Creating new question');
    
    try {
        await dbConnect();
        
        const { id, topicId } = context.params;
        const data = await request.json();
        
        const {
            text,
            type,
            difficulty,
            choices,
            explanation,
            subtopicId,
            tags
        } = data;

        logger.debug('Question data', {
            textPreview: text?.substring(0, 50) + '...',
            type,
            difficulty,
            choicesCount: choices?.length
        });

        // Validaciones básicas
        if (!text || !type || !difficulty || !choices || choices.length < 2) {
            return NextResponse.json({
                success: false,
                message: "Datos incompletos: se requiere texto, tipo, dificultad y al menos 2 opciones"
            }, { status: 400 });
        }

        // Verificar que hay exactamente una respuesta correcta
        const correctChoices = choices.filter(choice => choice.isCorrect);
        if (correctChoices.length !== 1) {
            return NextResponse.json({
                success: false,
                message: "Debe haber exactamente una respuesta correcta"
            }, { status: 400 });
        }

        // Crear la pregunta usando el modelo unificado
        const question = new Question({
            text,
            type,
            difficulty,
            choices,
            explanation: explanation || '',
            topicRef: topicId, // Usar topicRef para el manager
            subtopic: subtopicId || null,
            createdBy: context.user.id,
            tags: tags || [],
            generated: false,
            verified: false,
            source: "manager"
        });

        await question.save();
        
        logger.success('Question created', { questionId: question._id });

        return NextResponse.json({
            success: true,
            message: "Pregunta creada exitosamente",
            question: {
                _id: question._id,
                text: question.text,
                type: question.type,
                difficulty: question.difficulty,
                choices: question.choices,
                explanation: question.explanation,
                verified: question.verified,
                generated: question.generated,
                createdAt: question.createdAt
            }
        }, { status: 201 });

    } catch (error) {
        logger.error('Error creating question', { error: error.message, stack: error.stack });
        return handleError(error, "Error creando pregunta");
    }
}

/**
 * PATCH /api/manager/subjects/{id}/topics/{topicId}/questions
 * Actualizar estado de verificación de preguntas
 */
async function updateQuestionStatus(request, context) {
    logger.info('Updating question status');
    
    try {
        await dbConnect();
        
        const data = await request.json();
        const { questionId, action } = data; // action: 'verify', 'reject', 'reset'
        
        logger.debug('Received data', { questionId, action });
        
        if (!questionId || !action) {
            return NextResponse.json({
                success: false,
                message: "questionId y action son requeridos"
            }, { status: 400 });
        }
        
        const question = await Question.findById(questionId);
        if (!question) {
            return NextResponse.json({
                success: false,
                message: "Pregunta no encontrada"
            }, { status: 404 });
        }
        
        // Actualizar según la acción
        switch (action) {
            case 'verify':
                question.verified = true;
                question.rejected = false;
                break;
            case 'reject':
                question.verified = false;
                question.rejected = true;
                break;
            case 'reset':
                question.verified = false;
                question.rejected = false;
                break;
            default:
                return NextResponse.json({
                    success: false,
                    message: "Acción no válida. Use 'verify', 'reject', o 'reset'"
                }, { status: 400 });
        }
        
        await question.save();
        
        logger.success('Question status updated', { questionId, action });
        
        return NextResponse.json({
            success: true,
            message: `Pregunta ${action === 'verify' ? 'verificada' : action === 'reject' ? 'rechazada' : 'resetada'} exitosamente`,
            question: {
                _id: question._id,
                verified: question.verified,
                rejected: question.rejected
            }
        });
        
    } catch (error) {
        logger.error('Error updating question status', { error: error.message, stack: error.stack });
        return handleError(error, "Error actualizando estado de pregunta");
    }
}

// Exportar handlers con autenticación
export const GET = withAuth(getTopicQuestions, { requireProfessor: true });
export const POST = withAuth(createQuestion, { requireProfessor: true });
export const PATCH = withAuth(updateQuestionStatus, { requireProfessor: true });