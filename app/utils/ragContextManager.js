import dbConnect from "./dbconnect.js";
import Subtopic from "../manager/models/Subtopic.js";
import File from "../manager/models/File.js";
import fs from 'fs';
import path from 'path';

/**
 * Busca contexto relevante para un subtema específico
 * @param {string} subtopicId - ID del subtema
 * @param {string} topic - Nombre del tema para la consulta
 * @param {number} maxFragments - Número máximo de fragmentos a retornar
 * @returns {Promise<string>} Contexto combinado de los documentos
 */
export async function getRAGContextForSubtopic(subtopicId, topic, maxFragments = 3) {
    try {
        console.log(`🔍 Buscando contexto para subtema: ${subtopicId}`);
        
        if (!subtopicId) {
            console.log("⚠️ No se proporcionó subtopicId, usando generación sin contexto");
            return "";
        }

        await dbConnect();

        // 1. Buscar el subtema y sus archivos asociados
        const subtopic = await Subtopic.findById(subtopicId)
            .populate('files')
            .lean();

        if (!subtopic) {
            console.log(`❌ Subtema no encontrado: ${subtopicId}`);
            return "";
        }

        if (!subtopic.files || subtopic.files.length === 0) {
            console.log(`📁 No hay archivos asociados al subtema: ${subtopic.name}`);
            return "";
        }

        console.log(`📚 Encontrados ${subtopic.files.length} archivos para el subtema: ${subtopic.name}`);

        // 2. Leer archivos de texto disponibles (implementación simple)
        const contextParts = [];
        const uploadsDir = path.join(process.cwd(), 'uploads');

        for (const file of subtopic.files) {
            try {
                const filePath = path.join(uploadsDir, file.filename);
                
                // Verificar si el archivo existe
                if (fs.existsSync(filePath)) {
                    // Por ahora, solo procesamos archivos de texto simples
                    if (file.mimetype && file.mimetype.startsWith('text/')) {
                        const content = fs.readFileSync(filePath, 'utf8');
                        const preview = content.substring(0, 500).trim();
                        
                        if (preview) {
                            contextParts.push({
                                filename: file.originalName,
                                content: preview,
                                relevance: 1.0
                            });
                        }
                    } else {
                        // Para PDFs y otros formatos, agregamos información básica
                        contextParts.push({
                            filename: file.originalName,
                            content: `Documento: ${file.originalName} (${file.mimetype}) - Contenido relacionado con ${subtopic.name}`,
                            relevance: 0.8
                        });
                    }
                }
            } catch (fileError) {
                console.warn(`⚠️ Error leyendo archivo ${file.filename}:`, fileError.message);
            }
        }

        // 3. Si no hay contenido específico, usar información del subtema
        if (contextParts.length === 0) {
            const subtopicInfo = {
                filename: "Información del subtema",
                content: `Subtema: ${subtopic.name}. Descripción: ${subtopic.description || 'Sin descripción disponible'}. Tema relacionado: ${topic}`,
                relevance: 0.5
            };
            contextParts.push(subtopicInfo);
        }

        // 4. Construir contexto final
        const contextFragments = contextParts
            .slice(0, maxFragments)
            .map((part, index) => {
                return `[Documento ${index + 1}: ${part.filename}]\n${part.content}`;
            })
            .join('\n\n');

        if (contextFragments.trim()) {
            console.log(`✅ Contexto generado: ${contextFragments.length} caracteres de ${contextParts.length} archivos`);
            return contextFragments;
        } else {
            console.log("⚠️ No se pudo generar contexto útil");
            return "";
        }

    } catch (error) {
        console.error("❌ Error al obtener contexto:", error);
        // No fallar la generación de preguntas por error en contexto
        return "";
    }
}

/**
 * Genera un prompt enriquecido con contexto RAG
 * @param {string} basePrompt - Prompt base del sistema
 * @param {string} ragContext - Contexto obtenido del RAG
 * @returns {string} Prompt combinado
 */
export function enhancePromptWithRAG(basePrompt, ragContext) {
    if (!ragContext || ragContext.trim() === "") {
        return basePrompt;
    }

    const ragEnhancement = `
CONTEXTO ESPECÍFICO DEL MATERIAL EDUCATIVO:
${ragContext}

INSTRUCCIONES:
- Utiliza prioritariamente la información del contexto específico proporcionado arriba
- Las preguntas deben estar basadas en el contenido real del material educativo
- Mantén la coherencia con los conceptos y ejemplos del contexto
- Si el contexto no contiene suficiente información para alguna pregunta, puedes complementar con conocimiento general

PROMPT ORIGINAL:
${basePrompt}`;

    return ragEnhancement;
}