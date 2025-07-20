# Guía de Integración - Sistema RAG en Manager

## Ubicación e Integración

El sistema RAG está completamente integrado dentro del sistema manager de AIQuiz:

```
app/manager/rag-system/
├── src/
│   ├── core/                    # Servicios principales
│   │   ├── pdfProcessor.js      # Procesamiento PDF
│   │   ├── textChunker.js       # Chunking semántico
│   │   ├── embeddingService.js  # Generación de embeddings
│   │   └── ragManager.js        # Orquestador principal
│   ├── storage/
│   │   └── chromaStorage.js     # Almacenamiento vectorial
│   ├── api/                     # Endpoints API
│   └── utils/
│       └── config.js            # Configuración
├── docker-compose.yml           # Chroma DB
├── README.md                    # Documentación principal
└── INTEGRATION_GUIDE.md         # Esta guía
```

## Configuración Inicial

### 1. Iniciar Chroma DB

```bash
cd app/manager/rag-system
docker-compose up -d chromadb

# Verificar que está ejecutándose
curl http://localhost:8000/api/v1/heartbeat
```

### 2. Variables de Entorno

Agregar al archivo `.env` del proyecto raíz:

```bash
# Configuración RAG Manager
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false

# Configuración Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
EMBEDDING_BATCH_SIZE=16

# Configuración PDF
PDF_MAX_SIZE=52428800  # 50MB
PDF_QUALITY_THRESHOLD=0.7

# Configuración Chunking
CHUNK_MAX_SIZE=500
CHUNK_MIN_SIZE=150
CHUNK_OVERLAP=75

# Configuración Búsqueda
SEARCH_DEFAULT_LIMIT=10
SEARCH_DEFAULT_THRESHOLD=0.15

# Logging
RAG_LOGGING=true
RAG_LOG_LEVEL=info
```

## Uso en Componentes Manager

### Importar Servicios RAG

```javascript
// En cualquier archivo del manager
const RAGManager = require('./rag-system/src/core/ragManager');
const PDFProcessor = require('./rag-system/src/core/pdfProcessor');
const ChromaStorage = require('./rag-system/src/storage/chromaStorage');
```

### Ejemplo: Servicio Manager con RAG

```javascript
// app/manager/services/ragService.js
const RAGManager = require('../rag-system/src/core/ragManager');

class ManagerRAGService {
    constructor() {
        this.ragManager = new RAGManager({
            storage: {
                host: process.env.CHROMA_HOST || 'localhost',
                port: process.env.CHROMA_PORT || 8000
            },
            embeddings: {
                modelName: process.env.EMBEDDING_MODEL,
                dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS) || 384
            }
        });
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.ragManager.initialize();
            this.initialized = true;
            console.log('[Manager] Sistema RAG inicializado');
        }
    }

    async uploadPDF(file, context, userId) {
        await this.initialize();
        return await this.ragManager.processPDF(file, context, userId);
    }

    async searchContent(query, filters, options) {
        await this.initialize();
        return await this.ragManager.semanticSearch(query, filters, options);
    }

    async getDocumentInfo(documentId) {
        await this.initialize();
        return await this.ragManager.chromaStorage.getChunksByDocument(documentId);
    }

    async deleteDocument(documentId) {
        await this.initialize();
        return await this.ragManager.chromaStorage.deleteDocument(documentId);
    }

    async getSystemStats() {
        await this.initialize();
        return await this.ragManager.getSystemStats();
    }
}

// Exportar instancia singleton
const ragService = new ManagerRAGService();
module.exports = ragService;
```

### Ejemplo: Hook React para RAG

```javascript
// app/manager/hooks/useRAG.ts
import { useState, useCallback } from 'react';

interface RAGUploadResult {
    success: boolean;
    documentId?: string;
    stats?: any;
    error?: string;
}

interface RAGSearchResult {
    success: boolean;
    results?: any[];
    stats?: any;
    error?: string;
}

export function useRAG() {
    const [uploading, setUploading] = useState(false);
    const [searching, setSearching] = useState(false);

    const uploadPDF = useCallback(async (
        file: File, 
        subjectId: string, 
        topicId?: string, 
        subtopicId?: string
    ): Promise<RAGUploadResult> => {
        setUploading(true);
        
        try {
            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('subjectId', subjectId);
            if (topicId) formData.append('topicId', topicId);
            if (subtopicId) formData.append('subtopicId', subtopicId);

            const response = await fetch('/api/manager/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                },
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    documentId: result.data.documentId,
                    stats: result.data.stats
                };
            } else {
                return {
                    success: false,
                    error: result.message
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        } finally {
            setUploading(false);
        }
    }, []);

    const searchContent = useCallback(async (
        query: string,
        filters: any = {},
        options: any = {}
    ): Promise<RAGSearchResult> => {
        setSearching(true);
        
        try {
            const response = await fetch('/api/manager/documents/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                },
                body: JSON.stringify({
                    query,
                    filters,
                    options
                })
            });

            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    results: result.data.results,
                    stats: result.data.stats
                };
            } else {
                return {
                    success: false,
                    error: result.message
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        } finally {
            setSearching(false);
        }
    }, []);

    return {
        uploadPDF,
        searchContent,
        uploading,
        searching
    };
}
```

### Ejemplo: Componente de Upload PDF

```jsx
// app/manager/components/rag/PDFUploadComponent.tsx
import React, { useState } from 'react';
import { useRAG } from '../../hooks/useRAG';

interface PDFUploadProps {
    subjectId: string;
    topicId?: string;
    subtopicId?: string;
    onUploadSuccess?: (result: any) => void;
}

export function PDFUploadComponent({ 
    subjectId, 
    topicId, 
    subtopicId, 
    onUploadSuccess 
}: PDFUploadProps) {
    const { uploadPDF, uploading } = useRAG();
    const [dragOver, setDragOver] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);

    const handleFileSelect = async (file: File) => {
        if (file.type !== 'application/pdf') {
            alert('Solo se permiten archivos PDF');
            return;
        }

        const result = await uploadPDF(file, subjectId, topicId, subtopicId);
        setUploadResult(result);
        
        if (result.success && onUploadSuccess) {
            onUploadSuccess(result);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(file => file.type === 'application/pdf');
        
        if (pdfFile) {
            handleFileSelect(pdfFile);
        }
    };

    return (
        <div className="rag-upload-container">
            <div 
                className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
            >
                {uploading ? (
                    <div className="upload-progress">
                        <div className="spinner"></div>
                        <p>Procesando PDF...</p>
                        <small>Esto puede tardar varios minutos</small>
                    </div>
                ) : (
                    <>
                        <div className="upload-icon">📄</div>
                        <p>Arrastra un archivo PDF aquí o haz clic para seleccionar</p>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                            style={{ display: 'none' }}
                            id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload" className="upload-button">
                            Seleccionar PDF
                        </label>
                    </>
                )}
            </div>

            {uploadResult && (
                <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
                    {uploadResult.success ? (
                        <div>
                            <h4>✅ PDF procesado exitosamente</h4>
                            <p>ID: {uploadResult.documentId}</p>
                            <p>Chunks generados: {uploadResult.stats?.chunks}</p>
                            <p>Páginas: {uploadResult.stats?.pages}</p>
                            <p>Tiempo: {(uploadResult.stats?.processingTime / 1000).toFixed(1)}s</p>
                        </div>
                    ) : (
                        <div>
                            <h4>❌ Error procesando PDF</h4>
                            <p>{uploadResult.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
```

### Ejemplo: Componente de Búsqueda

```jsx
// app/manager/components/rag/SemanticSearchComponent.tsx
import React, { useState } from 'react';
import { useRAG } from '../../hooks/useRAG';

interface SearchProps {
    subjectId: string;
    topicId?: string;
    subtopicId?: string;
}

export function SemanticSearchComponent({ subjectId, topicId, subtopicId }: SearchProps) {
    const { searchContent, searching } = useRAG();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searchStats, setSearchStats] = useState<any>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;

        const filters: any = { subjectId };
        if (topicId) filters.topicId = topicId;
        if (subtopicId) filters.subtopicId = subtopicId;

        const result = await searchContent(query, filters, { limit: 10 });
        
        if (result.success) {
            setResults(result.results || []);
            setSearchStats(result.stats);
        }
    };

    return (
        <div className="semantic-search-container">
            <div className="search-input-container">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar en documentos PDF..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={searching}
                />
                <button onClick={handleSearch} disabled={searching || !query.trim()}>
                    {searching ? 'Buscando...' : 'Buscar'}
                </button>
            </div>

            {searchStats && (
                <div className="search-stats">
                    <small>
                        {searchStats.returned} resultados de {searchStats.totalFound} encontrados 
                        en {searchStats.searchTime}ms
                    </small>
                </div>
            )}

            <div className="search-results">
                {results.map((result, index) => (
                    <div key={result.id} className="search-result-item">
                        <div className="result-header">
                            <span className="similarity-score">
                                {(result.similarity * 100).toFixed(1)}% relevancia
                            </span>
                            <span className="document-info">
                                {result.file_name} 
                                {result.page_number && ` - Página ${result.page_number}`}
                            </span>
                        </div>
                        <div className="result-text">
                            {result.text}
                        </div>
                        {result.section_title && (
                            <div className="result-context">
                                Sección: {result.section_title}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {results.length === 0 && query && !searching && (
                <div className="no-results">
                    No se encontraron resultados para "{query}"
                </div>
            )}
        </div>
    );
}
```

## Integración con Páginas Manager

### En páginas de Subtemas

```jsx
// app/manager/subjects/[id]/topics/[topicId]/subtopics/[subtopicId]/page.tsx
import { PDFUploadComponent } from '../../../../../components/rag/PDFUploadComponent';
import { SemanticSearchComponent } from '../../../../../components/rag/SemanticSearchComponent';

export default function SubtopicPage({ params }) {
    const { id: subjectId, topicId, subtopicId } = params;

    return (
        <div className="subtopic-page">
            {/* Contenido existente */}
            
            <div className="rag-section">
                <h3>Documentos PDF</h3>
                
                <div className="rag-upload">
                    <h4>Subir PDF</h4>
                    <PDFUploadComponent
                        subjectId={subjectId}
                        topicId={topicId}
                        subtopicId={subtopicId}
                        onUploadSuccess={(result) => {
                            console.log('PDF subido:', result);
                            // Actualizar lista de documentos
                        }}
                    />
                </div>

                <div className="rag-search">
                    <h4>Buscar en Documentos</h4>
                    <SemanticSearchComponent
                        subjectId={subjectId}
                        topicId={topicId}
                        subtopicId={subtopicId}
                    />
                </div>
            </div>
        </div>
    );
}
```

## Mantenimiento y Monitoreo

### Verificar Estado del Sistema

```javascript
// Verificar que Chroma DB está disponible
const checkRAGStatus = async () => {
    try {
        const response = await fetch('http://localhost:8000/api/v1/heartbeat');
        if (response.ok) {
            console.log('✅ Sistema RAG disponible');
        } else {
            console.warn('⚠️ Sistema RAG no responde');
        }
    } catch (error) {
        console.error('❌ Sistema RAG no disponible:', error.message);
    }
};
```

### Logs y Debugging

```bash
# Ver logs de Chroma DB
cd app/manager/rag-system
docker-compose logs -f chromadb

# Reiniciar Chroma DB
docker-compose restart chromadb

# Ver estadísticas del sistema
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/manager/rag/status?detailed=true
```

## Próximos Pasos

1. **Implementar componentes frontend** usando los ejemplos anteriores
2. **Integrar en páginas existentes** del manager
3. **Configurar variables de entorno** según el entorno
4. **Probar upload y búsqueda** con PDFs de prueba
5. **Monitorear rendimiento** y ajustar configuración

---

*Sistema RAG completamente integrado en AIQuiz Manager*