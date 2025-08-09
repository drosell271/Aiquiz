/**
 * QDRANT STORAGE MANAGER
 * 
 * Gestiona la interacción con la base de datos vectorial Qdrant.
 * Proporciona funcionalidades para almacenar, buscar y gestionar embeddings.
 */

const fetch = require('node-fetch');

const logger = require('../../../../utils/logger').create('RAG:QDRANT');

class QdrantStorage {
    constructor(host = 'localhost', port = 6333) {
        this.baseUrl = `http://${host}:${port}`;
        this.defaultCollection = 'aiquiz_documents';
        this.vectorSize = 384; // Tamaño por defecto para all-MiniLM-L6-v2
    }

    /**
     * Verifica si Qdrant está disponible
     */
    async health() {
        try {
            const response = await fetch(`${this.baseUrl}/`);
            return response.ok;
        } catch (error) {
            logger.error('Health check failed', { error: error.message });
            return false;
        }
    }

    /**
     * Crea una colección si no existe
     */
    async createCollection(collectionName = this.defaultCollection, vectorSize = this.vectorSize) {
        try {
            logger.info('Creating collection', { collectionName });
            
            // Verificar si la colección ya existe
            const exists = await this.collectionExists(collectionName);
            if (exists) {
                logger.debug('Collection already exists', { collectionName });
                return { success: true, existed: true };
            }

            const response = await fetch(`${this.baseUrl}/collections/${collectionName}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vectors: {
                        size: vectorSize,
                        distance: 'Cosine'
                    },
                    optimizers_config: {
                        default_segment_number: 2
                    },
                    replication_factor: 1
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Error creando colección: ${error.status?.error || 'Unknown error'}`);
            }

            logger.success('Collection created successfully', { collectionName });
            return { success: true, existed: false };

        } catch (error) {
            logger.error('Error creating collection', { collectionName, error: error.message });
            throw error;
        }
    }

    /**
     * Verifica si una colección existe
     */
    async collectionExists(collectionName) {
        try {
            const response = await fetch(`${this.baseUrl}/collections/${collectionName}`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Lista todas las colecciones
     */
    async listCollections() {
        try {
            const response = await fetch(`${this.baseUrl}/collections`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data.result?.collections || [];
        } catch (error) {
            logger.error('Error listing collections', { error: error.message });
            throw error;
        }
    }

    /**
     * Inserta documentos en la colección
     */
    async upsertPoints(collectionName, points) {
        try {
            logger.info('Inserting points', { count: points.length, collectionName });

            const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: points
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Error insertando puntos: ${error.status?.error || 'Unknown error'}`);
            }

            const result = await response.json();
            logger.success('Points inserted successfully', { count: points.length });
            return result;

        } catch (error) {
            logger.error('Error inserting points', { error: error.message });
            throw error;
        }
    }


    /**
     * Obtiene información de la colección
     */
    async getCollectionInfo(collectionName) {
        try {
            const response = await fetch(`${this.baseUrl}/collections/${collectionName}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data.result;
        } catch (error) {
            logger.error('Error getting collection info', { collectionName, error: error.message });
            throw error;
        }
    }

    /**
     * Cuenta puntos en una colección
     */
    async countPoints(collectionName) {
        try {
            const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/count`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.result?.count || 0;
        } catch (error) {
            logger.error('Error counting points', { collectionName, error: error.message });
            throw error;
        }
    }

    /**
     * Elimina puntos específicos por ID
     */
    async deletePoints(collectionName, pointIds) {
        try {
            logger.info('Deleting points', { count: pointIds.length, collectionName });

            const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: pointIds
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Error eliminando puntos: ${error.status?.error || 'Unknown error'}`);
            }

            const result = await response.json();
            logger.success('Points deleted successfully', { count: pointIds.length });
            return result;

        } catch (error) {
            logger.error('Error deleting points', { error: error.message });
            throw error;
        }
    }

    /**
     * Elimina puntos basado en filtros
     */
    async deletePointsByFilter(collectionName, filter) {
        try {
            logger.info('Deleting points by filter', { collectionName });

            const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filter: filter
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Error eliminando puntos por filtro: ${error.status?.error || 'Unknown error'}`);
            }

            const result = await response.json();
            logger.success('Points deleted by filter successfully');
            return result;

        } catch (error) {
            logger.error('Error deleting points by filter', { error: error.message });
            throw error;
        }
    }

    /**
     * Obtiene puntos específicos por ID
     */
    async getPoints(collectionName, pointIds) {
        try {
            const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: pointIds,
                    with_payload: true,
                    with_vector: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.result || [];
        } catch (error) {
            logger.error('Error getting points', { error: error.message });
            throw error;
        }
    }

    /**
     * Scroll por todos los puntos en una colección (para debug)
     */
    async scrollPoints(collectionName, limit = 100, offset = null) {
        try {
            const body = {
                limit: limit,
                with_payload: true,
                with_vector: false
            };

            if (offset) {
                body.offset = offset;
            }

            const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/scroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return {
                points: data.result?.points || [],
                next_page_offset: data.result?.next_page_offset
            };
        } catch (error) {
            logger.error('Error scrolling points', { error: error.message });
            throw error;
        }
    }

    /**
     * Elimina una colección completa
     */
    async deleteCollection(collectionName) {
        try {
            logger.info('Deleting collection', { collectionName });

            const response = await fetch(`${this.baseUrl}/collections/${collectionName}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Error eliminando colección: ${error.status?.error || 'Unknown error'}`);
            }

            logger.success('Collection deleted successfully', { collectionName });
            return true;

        } catch (error) {
            logger.error('Error deleting collection', { collectionName, error: error.message });
            throw error;
        }
    }

    /**
     * Inicializa el storage creando la colección por defecto
     */
    async initialize() {
        try {
            logger.info('Initializing storage');
            
            // Verificar conexión
            const isHealthy = await this.health();
            if (!isHealthy) {
                throw new Error('Qdrant no está disponible');
            }

            // Crear colección por defecto si no existe
            await this.createCollection();
            
            logger.success('Storage initialized successfully');
        } catch (error) {
            logger.error('Error initializing storage', { error: error.message });
            throw error;
        }
    }

    /**
     * Almacena un documento completo con sus chunks
     */
    async storeDocument(documentMetadata, chunks) {
        try {
            logger.info('Storing document', { fileName: documentMetadata.fileName });
            
            const collectionName = this.defaultCollection;
            
            // Asegurar que la colección existe
            await this.createCollection(collectionName);

            // Preparar puntos para Qdrant
            const points = chunks.map((chunk, index) => ({
                id: `${documentMetadata.id}_chunk_${index}`,
                vector: chunk.embedding,
                payload: {
                    // Metadatos del documento
                    document_id: documentMetadata.id,
                    file_name: documentMetadata.fileName,
                    file_type: documentMetadata.fileType,
                    file_size: documentMetadata.fileSize,
                    subject_id: documentMetadata.subjectId,
                    topic_id: documentMetadata.topicId,
                    subtopic_id: documentMetadata.subtopicId,
                    uploaded_by: documentMetadata.uploadedBy,
                    upload_date: documentMetadata.uploadDate,

                    // Metadatos del chunk
                    chunk_index: index,
                    text: chunk.text,
                    chunk_id: chunk.id,
                    char_count: chunk.metadata?.charCount || chunk.text.length,
                    word_count: chunk.metadata?.wordCount || chunk.text.split(' ').length,
                    sentence_count: chunk.metadata?.sentenceCount || chunk.text.split(/[.!?]+/).length,
                    
                    // Metadatos específicos de PDF
                    page_number: chunk.metadata?.pageNumber,
                    section_title: chunk.metadata?.sectionTitle,
                    is_heading: chunk.metadata?.isHeading || false,
                    is_list: chunk.metadata?.isList || false,
                    
                    // Timestamp
                    created_at: new Date().toISOString()
                }
            }));

            // Insertar puntos en Qdrant
            await this.upsertPoints(collectionName, points);
            
            logger.success('Document stored successfully', { fileName: documentMetadata.fileName, chunksCount: points.length });
            return {
                success: true,
                documentId: documentMetadata.id,
                chunksStored: points.length
            };

        } catch (error) {
            logger.error('Error storing document', { error: error.message });
            throw error;
        }
    }

    /**
     * Busca chunks similares a un vector de consulta (método para RAG Manager)
     */
    async searchSimilar(queryVector, filters = {}, limit = 10) {
        try {
            const collectionName = this.defaultCollection;
            
            // Construir filtro de Qdrant
            let qdrantFilter = null;
            if (Object.keys(filters).length > 0) {
                qdrantFilter = this.buildQdrantFilter(filters);
            }

            // Realizar búsqueda usando el método interno
            const results = await this._performSearch(collectionName, queryVector, limit, 0.0, qdrantFilter);
            
            // Transformar resultados al formato esperado por el RAG Manager
            return results.map(result => ({
                id: result.id,
                similarity: result.score,
                text: result.payload.text,
                document_id: result.payload.document_id,
                file_name: result.payload.file_name,
                subject_id: result.payload.subject_id,
                topic_id: result.payload.topic_id,
                subtopic_id: result.payload.subtopic_id,
                page_number: result.payload.page_number,
                section_title: result.payload.section_title,
                is_heading: result.payload.is_heading,
                is_list: result.payload.is_list,
                char_count: result.payload.char_count,
                sentence_count: result.payload.sentence_count,
                metadata: result.payload
            }));

        } catch (error) {
            logger.error('Error in similar search', { error: error.message });
            throw error;
        }
    }

    /**
     * Método interno para realizar búsquedas en Qdrant
     */
    async _performSearch(collectionName, queryVector, limit = 10, scoreThreshold = 0.7, filter = null) {
        try {
            logger.debug('Searching similar documents', { collectionName, limit });

            const searchBody = {
                vector: queryVector,
                limit: limit,
                score_threshold: scoreThreshold,
                with_payload: true,
                with_vector: false
            };

            if (filter) {
                searchBody.filter = filter;
            }

            const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Error en búsqueda: ${error.status?.error || 'Unknown error'}`);
            }

            const result = await response.json();
            const points = result.result || [];
            
            logger.info('Similar documents found', { count: points.length });
            return points;

        } catch (error) {
            logger.error('Error in internal search', { error: error.message });
            throw error;
        }
    }

    /**
     * Obtiene chunks de un documento específico
     */
    async getChunksByDocument(documentId) {
        try {
            const collectionName = this.defaultCollection;
            
            // Construir filtro para el documento
            const filter = {
                must: [{
                    key: "document_id",
                    match: { value: documentId }
                }]
            };

            // Usar scroll para obtener todos los puntos del documento
            let allChunks = [];
            let offset = null;
            
            do {
                const result = await this.scrollPoints(collectionName, 100, offset);
                
                // Filtrar por documento (Qdrant no soporta filtros en scroll directamente)
                const documentChunks = result.points.filter(point => 
                    point.payload.document_id === documentId
                );
                
                allChunks.push(...documentChunks);
                offset = result.next_page_offset;
            } while (offset);

            // Transformar al formato esperado
            return allChunks.map(chunk => ({
                id: chunk.id,
                text: chunk.payload.text,
                embedding: chunk.vector,
                document_id: chunk.payload.document_id,
                chunk_index: chunk.payload.chunk_index,
                page_number: chunk.payload.page_number,
                section_title: chunk.payload.section_title,
                is_heading: chunk.payload.is_heading,
                metadata: chunk.payload
            }));

        } catch (error) {
            logger.error('Error getting document chunks', { documentId, error: error.message });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas del storage
     */
    async getStats() {
        try {
            const collections = await this.listCollections();
            
            let totalPoints = 0;
            const collectionStats = [];
            
            for (const collection of collections) {
                const count = await this.countPoints(collection.name);
                const info = await this.getCollectionInfo(collection.name);
                
                totalPoints += count;
                collectionStats.push({
                    name: collection.name,
                    points: count,
                    vectorSize: info.config?.params?.vectors?.size || 'unknown',
                    distance: info.config?.params?.vectors?.distance || 'unknown'
                });
            }

            return {
                totalCollections: collections.length,
                totalPoints: totalPoints,
                collections: collectionStats,
                defaultCollection: this.defaultCollection,
                vectorSize: this.vectorSize
            };

        } catch (error) {
            logger.error('Error getting statistics', { error: error.message });
            throw error;
        }
    }

    /**
     * Información del storage
     */
    getStorageInfo() {
        return {
            type: 'QdrantStorage',
            baseUrl: this.baseUrl,
            defaultCollection: this.defaultCollection,
            vectorSize: this.vectorSize,
            distance: 'Cosine'
        };
    }

    /**
     * Elimina un documento completo
     */
    async deleteDocument(documentId) {
        try {
            logger.info('Deleting document', { documentId });
            
            const collectionName = this.defaultCollection;
            
            // Construir filtro para eliminar todos los chunks del documento
            const filter = {
                must: [{
                    key: "document_id",
                    match: { value: documentId }
                }]
            };

            await this.deletePointsByFilter(collectionName, filter);
            
            logger.success('Document deleted successfully', { documentId });
            return true;

        } catch (error) {
            logger.error('Error deleting document', { documentId, error: error.message });
            throw error;
        }
    }

    /**
     * Cierra la conexión (no necesario para Qdrant HTTP)
     */
    async close() {
        logger.debug('Closing connection (HTTP does not require closing)');
    }

    /**
     * Construye filtros de Qdrant a partir de filtros genéricos
     */
    buildQdrantFilter(filters) {
        const conditions = [];

        if (filters.subjectId) {
            conditions.push({
                key: "subject_id",
                match: { value: filters.subjectId }
            });
        }

        if (filters.topicId) {
            conditions.push({
                key: "topic_id", 
                match: { value: filters.topicId }
            });
        }

        if (filters.subtopicId) {
            conditions.push({
                key: "subtopic_id",
                match: { value: filters.subtopicId }
            });
        }

        if (filters.excludeDocumentId) {
            conditions.push({
                key: "document_id",
                match: { 
                    except: [filters.excludeDocumentId]
                }
            });
        }

        return conditions.length > 0 ? { must: conditions } : null;
    }
}

module.exports = QdrantStorage;