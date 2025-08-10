/**
 * RAG MANAGER V2 - BASADO EN SISTEMA RAG DE REFERENCIA
 * 
 * Implementación mejorada del sistema RAG con:
 * - Chunking semántico inteligente
 * - Embeddings de Hugging Face
 * - Almacenamiento optimizado en Qdrant
 * - Procesamiento de PDF avanzado
 */

const PDFProcessor = require('./pdfProcessor');
const SemanticTextChunker = require('./semanticTextChunker');
const HuggingFaceEmbeddingsService = require('./huggingFaceEmbeddings');
const SimpleEmbeddingsService = require('./simpleEmbeddingsService');
const QdrantStorageV2 = require('../storage/qdrantStorageV2');
const { v4: uuidv4 } = require('uuid');

const logger = require('../../../utils/logger').create('RAG:MANAGER_V2');

class RAGManagerV2 {
    constructor(options = {}) {
        // Configuración
        this.config = {
            enableLogging: options.enableLogging !== false,
            
            // Configuración de chunking
            chunking: {
                chunkSize: options.chunkSize || 512,
                overlap: options.overlap || 50,
                preserveStructure: true
            },
            
            // Configuración de embeddings
            embeddings: {
                modelName: options.embeddingModel || 'Xenova/all-MiniLM-L6-v2',
                quantized: options.quantized || false
            },
            
            // Configuración de storage
            storage: {
                url: options.qdrantUrl || 'http://localhost:6333',
                collection: options.collection || 'aiquiz_documents',
                vectorSize: options.vectorSize || 384
            },
            
            ...options
        };

        // Inicializar servicios
        this.pdfProcessor = new PDFProcessor();
        this.textChunker = new SemanticTextChunker(this.config.chunking);
        this.embeddingService = null; // Se inicializará dinámicamente
        this.qdrantStorage = new QdrantStorageV2(this.config.storage);

        // Estado del sistema
        this.state = {
            isInitialized: false,
            isProcessing: false,
            processingQueue: [],
            stats: {
                documentsProcessed: 0,
                chunksGenerated: 0,
                embeddingsCreated: 0,
                searchesPerformed: 0,
                totalPages: 0,
                avgProcessingTime: 0
            }
        };

        if (this.config.enableLogging) {
            logger.info('RAG Manager V2 initialized', { config: this.config });
        }
    }

    /**
     * Inicializa todos los servicios del sistema RAG
     */
    async initialize() {
        if (this.state.isInitialized) {
            return;
        }

        try {
            if (this.config.enableLogging) {
                logger.info('Initializing RAG system...');
            }

            // Inicializar servicio de embeddings con fallback
            await this.initializeEmbeddingService();

            const qdrantAvailable = await this.qdrantStorage.health();
            if (!qdrantAvailable) {
                throw new Error('Qdrant no está disponible');
            }

            // Inicializar servicios en orden
            await this.embeddingService.initialize();
            await this.qdrantStorage.initialize();

            this.state.isInitialized = true;
            
            if (this.config.enableLogging) {
                logger.success('RAG system initialized successfully');
            }
        } catch (error) {
            logger.error('Error initializing RAG system', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Inicializa el servicio de embeddings con fallback
     */
    async initializeEmbeddingService() {
        try {
            // Intentar primero con HuggingFace
            const huggingFaceService = new HuggingFaceEmbeddingsService(this.config.embeddings);
            const isHuggingFaceAvailable = await huggingFaceService.isAvailable();
            
            if (isHuggingFaceAvailable) {
                this.embeddingService = huggingFaceService;
                if (this.config.enableLogging) {
                    logger.info('Using HuggingFace Embeddings');
                }
                return;
            }
        } catch (error) {
            if (this.config.enableLogging) {
                logger.warn('HuggingFace not available, using fallback', { error: error.message });
            }
        }

        // Fallback a Simple Embeddings
        this.embeddingService = new SimpleEmbeddingsService({
            ...this.config.embeddings,
            vectorSize: this.config.storage.vectorSize
        });
        
        if (this.config.enableLogging) {
            logger.info('Using Simple Embeddings (TF-IDF fallback)');
        }
    }

    /**
     * Procesa un documento PDF completo
     */
    async processPDF(file, context, uploadedBy) {
        await this.ensureInitialized();

        const documentId = uuidv4();
        const startTime = Date.now();

        try {
            if (this.config.enableLogging) {
                logger.info('Processing PDF file', { filename: file.originalname });
            }

            this.state.isProcessing = true;

            // 1. Validar PDF
            const validation = this.pdfProcessor.validatePDF(file);
            if (!validation.isValid) {
                throw new Error(`PDF inválido: ${validation.errors.join(', ')}`);
            }

            // 2. Procesar PDF
            if (this.config.enableLogging) {
                logger.progress('Step 1/5: Processing PDF...');
            }
            const processedPDF = await this.pdfProcessor.processDocument(file);

            // 3. Chunking semántico
            if (this.config.enableLogging) {
                logger.progress('Step 2/5: Semantic chunking...');
            }
            const chunks = await this.textChunker.chunkDocument(processedPDF.text, {
                ...context,
                documentId: documentId,
                sourceType: 'pdf',
                pdfMetadata: processedPDF.metadata
            });

            // 4. Generar embeddings
            if (this.config.enableLogging) {
                logger.info('Paso 3/5: Generando embeddings...');
                const estimation = this.embeddingService.estimateProcessingTime(chunks.length);
                logger.info('Tiempo estimado', { minutes: estimation.estimatedMinutes });
            }
            
            const chunksWithEmbeddings = await this.embeddingService.processChunks(chunks);

            // 5. Almacenar en Qdrant
            if (this.config.enableLogging) {
                logger.info('Paso 4/5: Almacenando en Qdrant...');
            }

            const documentMetadata = {
                id: documentId,
                fileName: file.originalname,
                fileType: 'pdf',
                fileSize: file.size,
                subjectId: context.subjectId,
                topicId: context.topicId,
                subtopicId: context.subtopicId,
                uploadedBy: uploadedBy,
                uploadDate: new Date().toISOString(),
                metadata: {
                    ...processedPDF.metadata,
                    chunkingStats: this.textChunker.getChunkingStats(chunks),
                    embeddingModel: this.embeddingService.getServiceInfo(),
                    processingTime: Date.now() - startTime
                }
            };

            await this.qdrantStorage.storeDocument(documentMetadata, chunksWithEmbeddings);

            // 6. Actualizar estadísticas
            this.updateStats({
                documentsProcessed: 1,
                chunksGenerated: chunks.length,
                embeddingsCreated: chunks.length,
                totalPages: processedPDF.metadata.totalPages,
                processingTime: Date.now() - startTime
            });

            const totalTime = Date.now() - startTime;
            
            if (this.config.enableLogging) {
                logger.success('PDF procesado exitosamente', { timeSeconds: Math.round(totalTime / 1000) });
            }

            return {
                success: true,
                documentId: documentId,
                stats: {
                    chunks: chunks.length,
                    pages: processedPDF.metadata.totalPages,
                    processingTime: totalTime,
                    fileSize: file.size,
                    textLength: processedPDF.text.length,
                    quality: processedPDF.metadata.quality.score
                },
                metadata: documentMetadata,
                pdfInfo: {
                    chunkingStats: this.textChunker.getChunkingStats(chunks),
                    embeddingInfo: this.embeddingService.getServiceInfo(),
                    extractionQuality: processedPDF.metadata.quality
                }
            };
        } catch (error) {
            logger.error('Error procesando PDF', { error: error.message, stack: error.stack });
            throw error;
        } finally {
            this.state.isProcessing = false;
        }
    }

    /**
     * Realiza búsqueda semántica
     */
    async semanticSearch(query, filters = {}, options = {}) {
        await this.ensureInitialized();

        try {
            if (this.config.enableLogging) {
                logger.info(`[RAG Manager V2] Búsqueda semántica: "${query}"`);
            }

            const startTime = Date.now();

            const searchOptions = {
                limit: options.limit || 10,
                threshold: options.threshold || 0.15,
                includeMetadata: options.includeMetadata !== false,
                rerankResults: options.rerankResults !== false,
                ...options
            };

            // 1. Generar embedding para la consulta
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            // 2. Buscar chunks similares
            const similarChunks = await this.qdrantStorage.searchSimilar(
                queryEmbedding,
                filters,
                searchOptions.limit * 2
            );

            // 3. Filtrar por threshold
            const filteredChunks = similarChunks.filter(
                chunk => chunk.similarity >= searchOptions.threshold
            );

            // 4. Re-ranking si está habilitado
            let rankedChunks = filteredChunks;
            if (searchOptions.rerankResults) {
                rankedChunks = this.rerankResults(query, filteredChunks);
            }

            // 5. Limitar resultados finales
            const finalResults = rankedChunks.slice(0, searchOptions.limit);

            // 6. Enriquecer con metadatos si es necesario
            const enrichedResults = searchOptions.includeMetadata 
                ? await this.enrichSearchResults(finalResults)
                : finalResults;

            // 7. Actualizar estadísticas
            this.updateStats({ searchesPerformed: 1 });

            const searchTime = Date.now() - startTime;
            
            if (this.config.enableLogging) {
                logger.info(`[RAG Manager V2] Búsqueda completada en ${searchTime}ms`);
            }

            return {
                success: true,
                query: query,
                results: enrichedResults,
                stats: {
                    totalFound: similarChunks.length,
                    afterFiltering: filteredChunks.length,
                    returned: finalResults.length,
                    searchTime: searchTime,
                    threshold: searchOptions.threshold
                },
                filters: filters
            };
        } catch (error) {
            console.error('[RAG Manager V2] Error en búsqueda semántica:', error);
            throw error;
        }
    }

    /**
     * Elimina un documento del sistema
     */
    async deleteDocument(documentId) {
        await this.ensureInitialized();

        try {
            if (this.config.enableLogging) {
                logger.info(`[RAG Manager V2] Eliminando documento: ${documentId}`);
            }

            await this.qdrantStorage.deleteDocument(documentId);
            
            if (this.config.enableLogging) {
                logger.info(`[RAG Manager V2] Documento ${documentId} eliminado exitosamente`);
            }

            return {
                success: true,
                documentId: documentId,
                message: 'Documento eliminado exitosamente'
            };
        } catch (error) {
            console.error('[RAG Manager V2] Error eliminando documento:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas del sistema
     */
    async getSystemStats() {
        await this.ensureInitialized();

        try {
            const storageStats = await this.qdrantStorage.getStats();
            const embeddingInfo = this.embeddingService.getServiceInfo();

            return {
                system: {
                    initialized: this.state.isInitialized,
                    processing: this.state.isProcessing,
                    queueSize: this.state.processingQueue.length,
                    version: 'V2',
                    optimizedFor: 'PDF documents with semantic chunking'
                },
                storage: {
                    ...storageStats,
                    database: 'Qdrant',
                    client: 'official'
                },
                embeddings: embeddingInfo,
                processing: {
                    ...this.state.stats,
                    avgProcessingTime: this.calculateAvgProcessingTime()
                },
                config: this.config,
                services: {
                    pdfProcessor: this.pdfProcessor.getProcessorInfo(),
                    textChunker: 'SemanticTextChunker',
                    embeddingService: embeddingInfo.type,
                    storage: this.qdrantStorage.getStorageInfo()
                }
            };
        } catch (error) {
            console.error('[RAG Manager V2] Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    // Métodos auxiliares

    rerankResults(query, chunks) {
        return chunks.map(chunk => {
            let score = chunk.similarity;
            
            // Bonificaciones por elementos estructurales
            if (chunk.is_heading) score += 0.1;
            if (chunk.section_title && chunk.section_title.toLowerCase().includes(query.toLowerCase())) {
                score += 0.15;
            }
            if (chunk.page_number && chunk.page_number <= 3) score += 0.05;
            
            // Penalizaciones
            if (chunk.char_count < 100) score -= 0.1;
            
            return {
                ...chunk,
                rerankedScore: Math.min(score, 1.0)
            };
        }).sort((a, b) => b.rerankedScore - a.rerankedScore);
    }

    async enrichSearchResults(results) {
        return results.map(result => ({
            ...result,
            context: {
                pageNumber: result.page_number,
                sectionTitle: result.section_title,
                isHeading: result.is_heading,
                isList: result.is_list
            }
        }));
    }

    updateStats(updates) {
        for (const [key, value] of Object.entries(updates)) {
            if (this.state.stats[key] !== undefined) {
                if (key === 'processingTime') {
                    this.state.stats.avgProcessingTime = 
                        (this.state.stats.avgProcessingTime + value) / 2;
                } else {
                    this.state.stats[key] += value;
                }
            }
        }
    }

    calculateAvgProcessingTime() {
        return this.state.stats.documentsProcessed > 0 
            ? Math.round(this.state.stats.avgProcessingTime / this.state.stats.documentsProcessed)
            : 0;
    }

    async ensureInitialized() {
        if (!this.state.isInitialized) {
            await this.initialize();
        }
    }

    async shutdown() {
        if (this.config.enableLogging) {
            logger.info('[RAG Manager V2] Cerrando sistema...');
        }
        
        await this.qdrantStorage.close();
        await this.embeddingService.close();
        
        this.state.isInitialized = false;
        
        if (this.config.enableLogging) {
            logger.info('[RAG Manager V2] Sistema cerrado');
        }
    }
}

module.exports = RAGManagerV2;