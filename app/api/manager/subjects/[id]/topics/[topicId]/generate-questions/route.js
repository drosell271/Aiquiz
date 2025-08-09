// app/api/manager/subjects/[id]/topics/[topicId]/generate-questions/route.js
import { NextResponse } from "next/server";
import dbConnect from "@utils/dbconnect";
import Question from "@app/models/Question";
import Topic from "@app/manager/models/Topic";
import Subtopic from "@app/manager/models/Subtopic";
import { withAuth, handleError } from "@utils/authMiddleware";
import { getModelResponse } from "@utils/llmManager.js";
import { getPromptManager } from "@utils/promptManager";
import logger from "@utils/logger.js";
import fs from 'fs';
import path from 'path';

// Logger específico para generación de preguntas
const questionsLogger = logger.create('ManagerQuestions');

/**
 * @swagger
 * /api/manager/subjects/{id}/topics/{topicId}/generate-questions:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Generar nuevas preguntas para un tema
 *     description: Genera preguntas automáticamente usando IA para un tema específico
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
 *               - difficulty
 *               - count
 *             properties:
 *               difficulty:
 *                 type: string
 *                 enum: [Fácil, Medio, Avanzado]
 *                 description: Nivel de dificultad de las preguntas
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 description: Número de preguntas a generar
 *               subtopicId:
 *                 type: string
 *                 description: ID del subtema específico (opcional)
 *               type:
 *                 type: string
 *                 enum: [Opción múltiple, Verdadero/Falso]
 *                 default: Opción múltiple
 *                 description: Tipo de preguntas a generar
 *               includeExplanations:
 *                 type: boolean
 *                 default: true
 *                 description: Si incluir explicaciones en las preguntas
 *     responses:
 *       201:
 *         description: Preguntas generadas exitosamente
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
 *                 questionsGenerated:
 *                   type: integer
 *                   description: Número de preguntas generadas
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
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */

async function generateQuestions(request, context) {
    questionsLogger.info('Iniciando generación de preguntas', {
        params: context.params,
        user: context.user ? 'Usuario presente' : 'Usuario ausente'
    });
    
    try {
        await dbConnect();
        
        const { id, topicId } = context.params;
        const data = await request.json();
        
        const {
            difficulty,
            count,
            subtopicId,
            type = "Opción múltiple",
            includeExplanations = true
        } = data;

        questionsLogger.info('Parámetros recibidos', {
            subjectId: id,
            topicId,
            difficulty,
            count,
            subtopicId,
            type,
            includeExplanations
        });

        // Validaciones básicas
        if (!difficulty || !count) {
            return NextResponse.json({
                success: false,
                message: "Dificultad y cantidad son requeridos"
            }, { status: 400 });
        }

        if (count < 1 || count > 20) {
            return NextResponse.json({
                success: false,
                message: "La cantidad debe estar entre 1 y 20 preguntas"
            }, { status: 400 });
        }

        if (!["Fácil", "Medio", "Avanzado"].includes(difficulty)) {
            return NextResponse.json({
                success: false,
                message: "Dificultad no válida"
            }, { status: 400 });
        }

        // Obtener información del tema
        const topic = await Topic.findById(topicId).lean();
        if (!topic) {
            return NextResponse.json({
                success: false,
                message: "Tema no encontrado"
            }, { status: 404 });
        }

        // Obtener información del subtema si se especifica
        let subtopic = null;
        if (subtopicId) {
            subtopic = await Subtopic.findById(subtopicId).lean();
            if (!subtopic) {
                return NextResponse.json({
                    success: false,
                    message: "Subtema no encontrado"
                }, { status: 404 });
            }
        }

        // Preparar prompt para generar preguntas
        const promptManager = getPromptManager();

        // Construir contexto para el prompt
        const context_info = {
            topic: topic.title,
            subtopic: subtopic?.title || null,
            difficulty: difficulty, // Mantener capitalización original
            count: count,
            type: type === "Verdadero/Falso" ? "true_false" : "multiple_choice",
            includeExplanations
        };

        questionsLogger.debug('Context info para prompt', context_info);

        // Generar prompt específico para creación de preguntas
        const prompt = promptManager.buildPrompt('GENERATE_MANAGER_QUESTIONS', context_info);
        
        questionsLogger.debug('Prompt generado', { promptLength: prompt.length });

        // Obtener modelo AI para el manager (usar el primer modelo disponible)
        let assignedModel;
        try {
            const modelsPath = path.resolve('models.json');
            const modelsData = fs.readFileSync(modelsPath, 'utf-8');
            const modelsConfig = JSON.parse(modelsData);
            
            if (!modelsConfig.models || modelsConfig.models.length === 0) {
                throw new Error("No hay modelos configurados en models.json");
            }
            
            // Usar el primer modelo disponible para el manager
            assignedModel = modelsConfig.models[0].name;
            questionsLogger.info('Modelo asignado', { model: assignedModel });
        } catch (modelError) {
            questionsLogger.error('Error leyendo configuración de modelos', { error: modelError.message });
            throw new Error("No se pudo obtener configuración de modelos LLM");
        }
        
        if (!assignedModel) {
            throw new Error("No se pudo asignar un modelo LLM");
        }

        questionsLogger.info(`Generando ${count} preguntas con modelo ${assignedModel} para tema ${topic.title}`);

        questionsLogger.info('Calling getModelResponse...');
        const llmResponse = await getModelResponse(assignedModel, prompt);
        questionsLogger.info('Received LLM response', { responseLength: llmResponse?.length || 0 });
        
        if (!llmResponse) {
            throw new Error("No se pudo generar respuesta del modelo LLM");
        }

        if (typeof llmResponse !== 'string') {
            questionsLogger.error('LLM response is not string:', {
                type: typeof llmResponse,
                response: llmResponse
            });
            throw new Error("Respuesta del modelo LLM tiene formato incorrecto");
        }

        // Parsear respuesta
        let questionsData;
        try {
            questionsLogger.debug('Parseando respuesta LLM', { responseLength: llmResponse.length });
            questionsData = JSON.parse(llmResponse);
            questionsLogger.info('Respuesta LLM parseada', {
                hasQuestions: !!questionsData.questions,
                questionsCount: questionsData.questions?.length,
                questionsType: Array.isArray(questionsData.questions) ? 'array' : typeof questionsData.questions
            });
        } catch (parseError) {
            questionsLogger.error('Error parsing LLM response:', {
                error: parseError.message,
                response: llmResponse
            });
            throw new Error("Respuesta del modelo LLM no válida: " + parseError.message);
        }

        if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
            questionsLogger.error('Invalid format:', { questionsData });
            throw new Error("Formato de respuesta del modelo LLM no válido - se esperaba un array de preguntas");
        }

        if (questionsData.questions.length === 0) {
            throw new Error("El modelo LLM no generó ninguna pregunta");
        }

        // Convertir preguntas al formato del modelo unificado
        const managedQuestions = questionsData.questions.map((q, index) => {
            questionsLogger.debug(`Procesando pregunta ${index + 1}`, {
                hasText: !!(q.query || q.text),
                hasChoices: !!q.choices,
                choicesCount: q.choices?.length,
                hasAnswer: q.answer !== undefined,
                answerValue: q.answer
            });

            // Validar estructura básica de la pregunta
            if (!q.query && !q.text) {
                throw new Error(`Pregunta ${index + 1}: Falta el texto de la pregunta`);
            }

            if (q.answer === undefined || q.answer === null) {
                throw new Error(`Pregunta ${index + 1}: Falta el índice de respuesta correcta`);
            }

            // Normalizar choices según el tipo
            let choices;
            if (type === "Verdadero/Falso") {
                choices = [
                    { text: "Verdadero", isCorrect: q.answer === 0 },
                    { text: "Falso", isCorrect: q.answer === 1 }
                ];
            } else {
                // Opción múltiple
                if (!q.choices || !Array.isArray(q.choices)) {
                    throw new Error(`Pregunta ${index + 1}: Falta el array de opciones`);
                }

                if (q.choices.length < 2) {
                    throw new Error(`Pregunta ${index + 1}: Se requieren al menos 2 opciones`);
                }

                if (q.answer >= q.choices.length || q.answer < 0) {
                    throw new Error(`Pregunta ${index + 1}: Índice de respuesta fuera de rango (${q.answer} de ${q.choices.length} opciones)`);
                }

                choices = q.choices.map((choice, choiceIndex) => ({
                    text: choice,
                    isCorrect: choiceIndex === q.answer
                }));
            }

            return {
                text: q.query || q.text,
                type: type,
                difficulty: difficulty,
                choices: choices,
                explanation: includeExplanations ? (q.explanation || '') : '',
                topicRef: topicId,
                subtopic: subtopicId || null,
                createdBy: context.user?.id || null,
                tags: [topic.title, 'auto-generated', difficulty],
                generated: true,
                verified: false,
                rejected: false,
                source: "manager",
                llmModel: assignedModel,
                generationPrompt: prompt.substring(0, 500) + '...'
            };
        });

        // Guardar preguntas en la base de datos
        questionsLogger.info(`Intentando guardar ${managedQuestions.length} preguntas`);
        let savedQuestions;
        try {
            savedQuestions = await Question.insertMany(managedQuestions);
            questionsLogger.success(`${savedQuestions.length} preguntas guardadas exitosamente`);
        } catch (dbError) {
            questionsLogger.error('Error guardando en BD', { error: dbError.message });
            throw new Error("Error guardando preguntas en la base de datos: " + dbError.message);
        }

        questionsLogger.info(`Generadas ${savedQuestions.length} preguntas para tema ${topic.title} con dificultad ${difficulty}`);

        return NextResponse.json({
            success: true,
            message: `${savedQuestions.length} preguntas generadas exitosamente`,
            questionsGenerated: savedQuestions.length,
            questions: savedQuestions.map(q => ({
                _id: q._id,
                text: q.text,
                type: q.type,
                difficulty: q.difficulty,
                choices: q.choices,
                explanation: q.explanation,
                verified: q.verified,
                generated: q.generated,
                createdAt: q.createdAt
            }))
        }, { status: 201 });

    } catch (error) {
        questionsLogger.error('Error generating questions:', {
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            topicId,
            count
        });
        return handleError(error, "Error generando preguntas");
    }
}

// Exportar handler con autenticación
export const POST = withAuth(generateQuestions, { requireProfessor: true });