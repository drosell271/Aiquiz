// app/api/manager/subjects/[id]/topics/[topicId]/questionnaires/[questionnaireId]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@utils/dbconnect";
import { withAuth, handleError } from "@utils/authMiddleware";

const logger = require('../../../../../../../utils/logger').create('API:QUESTIONNAIRES:ID');

// Import dinámico para el modelo Questionnaire (CommonJS)
async function getQuestionnaireModel() {
    const Questionnaire = await import("@app/manager/models/Questionnaire");
    return Questionnaire.default || Questionnaire;
}

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/questionnaires/{questionnaireId}:
 *   delete:
 *     tags:
 *       - Questionnaires
 *     summary: Eliminar cuestionario
 *     description: Elimina un cuestionario específico
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
 *         name: questionnaireId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cuestionario
 *     responses:
 *       200:
 *         description: Cuestionario eliminado exitosamente
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
 *       404:
 *         description: Cuestionario no encontrado
 *       403:
 *         description: Sin permisos para eliminar el cuestionario
 *       500:
 *         description: Error del servidor
 */

async function deleteQuestionnaire(request, context) {
    logger.info('Deleting questionnaire');
    
    try {
        await dbConnect();
        
        const { id, topicId, questionnaireId } = context.params;
        
        logger.debug('Request parameters', {
            subjectId: id,
            topicId,
            questionnaireId
        });

        // Obtener modelo Questionnaire
        const Questionnaire = await getQuestionnaireModel();
        
        // Buscar el cuestionario
        const questionnaire = await Questionnaire.findById(questionnaireId);
        if (!questionnaire) {
            return NextResponse.json({
                success: false,
                message: "Cuestionario no encontrado"
            }, { status: 404 });
        }

        // Verificar que el cuestionario pertenece al tema
        if (questionnaire.topic.toString() !== topicId) {
            return NextResponse.json({
                success: false,
                message: "El cuestionario no pertenece a este tema"
            }, { status: 400 });
        }

        // Verificar permisos (solo el creador o un admin puede eliminar)
        if (questionnaire.createdBy.toString() !== context.user.id && context.user.role !== 'admin') {
            return NextResponse.json({
                success: false,
                message: "Sin permisos para eliminar este cuestionario"
            }, { status: 403 });
        }

        // Eliminar el cuestionario
        await Questionnaire.findByIdAndDelete(questionnaireId);
        
        logger.success('Questionnaire deleted', { questionnaireId });

        return NextResponse.json({
            success: true,
            message: "Cuestionario eliminado exitosamente"
        });

    } catch (error) {
        logger.error('Error deleting questionnaire', { error: error.message, stack: error.stack });
        return handleError(error, "Error eliminando cuestionario");
    }
}

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/questionnaires/{questionnaireId}:
 *   get:
 *     tags:
 *       - Questionnaires
 *     summary: Obtener cuestionario específico
 *     description: Obtiene los detalles de un cuestionario específico
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
 *         name: questionnaireId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cuestionario
 *     responses:
 *       200:
 *         description: Detalles del cuestionario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 questionnaire:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     downloadCount:
 *                       type: number
 *       404:
 *         description: Cuestionario no encontrado
 *       500:
 *         description: Error del servidor
 */

async function getQuestionnaire(request, context) {
    logger.info('Getting specific questionnaire');
    
    try {
        await dbConnect();
        
        const { id, topicId, questionnaireId } = context.params;
        
        logger.debug('Request parameters', {
            subjectId: id,
            topicId,
            questionnaireId
        });

        // Obtener modelo Questionnaire
        const Questionnaire = await getQuestionnaireModel();
        
        // Buscar el cuestionario con las preguntas pobladas
        const questionnaire = await Questionnaire.findById(questionnaireId)
            .populate('questions')
            .populate('createdBy', 'name email')
            .lean();

        if (!questionnaire) {
            return NextResponse.json({
                success: false,
                message: "Cuestionario no encontrado"
            }, { status: 404 });
        }

        // Verificar que el cuestionario pertenece al tema
        if (questionnaire.topic.toString() !== topicId) {
            return NextResponse.json({
                success: false,
                message: "El cuestionario no pertenece a este tema"
            }, { status: 400 });
        }

        logger.info('Questionnaire found', { title: questionnaire.title });

        return NextResponse.json({
            success: true,
            questionnaire: {
                _id: questionnaire._id,
                id: questionnaire._id.toString(),
                title: questionnaire.title,
                description: questionnaire.description,
                questions: questionnaire.questions,
                createdAt: questionnaire.createdAt,
                downloadCount: questionnaire.downloadCount,
                isPublic: questionnaire.isPublic,
                createdBy: questionnaire.createdBy
            }
        });

    } catch (error) {
        logger.error('Error getting questionnaire', { error: error.message, stack: error.stack });
        return handleError(error, "Error obteniendo cuestionario");
    }
}

// Exportar handlers con autenticación
export const GET = withAuth(getQuestionnaire, { requireProfessor: true });
export const DELETE = withAuth(deleteQuestionnaire, { requireProfessor: true });