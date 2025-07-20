# Sistema RAG Semántico - Integrado en Manager

## Descripción

Sistema RAG (Retrieval Augmented Generation) semántico especializado en documentos PDF, integrado dentro del sistema manager de AIQuiz.

## Ubicación

```
app/manager/rag-system/
├── src/
│   ├── core/                    # Servicios principales
│   │   ├── pdfProcessor.js      # Procesamiento especializado de PDF
│   │   └── ragManager.js        # Orquestador principal
│   ├── storage/                 # Almacenamiento vectorial
│   │   └── chromaStorage.js     # Integración con Chroma DB
│   ├── api/                     # Endpoints API
│   │   ├── upload/route.js      # Upload de PDFs
│   │   ├── search/route.js      # Búsqueda semántica
│   │   └── ...                  # Otros endpoints
│   └── utils/                   # Utilidades
│       └── config.js            # Configuración
├── docker-compose.yml           # Chroma DB
└── README.md                    # Esta documentación
```

## Características

- **Especializado en PDF**: Optimizado exclusivamente para documentos PDF
- **Chroma DB**: Base de datos vectorial de alto rendimiento
- **Embeddings locales**: Modelo `sentence-transformers/all-MiniLM-L6-v2`
- **Búsqueda semántica**: Por similitud de significado
- **Integrado**: Dentro del ecosistema manager de AIQuiz

## Instalación

### 1. Iniciar Chroma DB

```bash
cd app/manager/rag-system
docker-compose up -d chromadb
```

### 2. Verificar instalación

```bash
curl http://localhost:8000/api/v1/heartbeat
```

### 3. Configurar variables de entorno

En el archivo `.env` del proyecto raíz:

```bash
# Configuración RAG
CHROMA_HOST=localhost
CHROMA_PORT=8000
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
PDF_MAX_SIZE=52428800
```

## Uso desde el Manager

### Importar servicios RAG

```javascript
// En archivos del manager
const RAGManager = require('./rag-system/src/core/ragManager');
const PDFProcessor = require('./rag-system/src/core/pdfProcessor');
const ChromaStorage = require('./rag-system/src/storage/chromaStorage');
```

### Ejemplo de uso

```javascript
// Inicializar sistema RAG
const ragManager = new RAGManager({
    storage: {
        host: process.env.CHROMA_HOST || 'localhost',
        port: process.env.CHROMA_PORT || 8000
    }
});

await ragManager.initialize();

// Procesar PDF
const result = await ragManager.processPDF(file, context, userId);

// Buscar contenido
const searchResults = await ragManager.semanticSearch(query, filters);
```

## API Endpoints

Los endpoints están disponibles a través del sistema de routing de Next.js:

- `POST /api/manager/documents/upload` - Upload de PDFs
- `POST /api/manager/documents/search` - Búsqueda semántica
- `GET /api/manager/documents/list` - Listado de documentos
- `GET /api/manager/documents/[id]` - Información de documento
- `DELETE /api/manager/documents/[id]` - Eliminar documento

## Integración con Componentes Manager

### Upload de PDF

```jsx
// En un componente React del manager
import { useState } from 'react';

function PDFUpload({ subjectId, topicId }) {
    const [uploading, setUploading] = useState(false);
    
    const handleUpload = async (file) => {
        setUploading(true);
        
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('subjectId', subjectId);
        formData.append('topicId', topicId);
        
        try {
            const response = await fetch('/api/manager/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const result = await response.json();
            console.log('PDF procesado:', result);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <div>
            <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => handleUpload(e.target.files[0])}
                disabled={uploading}
            />
            {uploading && <p>Procesando PDF...</p>}
        </div>
    );
}
```

### Búsqueda Semántica

```jsx
// Componente de búsqueda semántica
import { useState } from 'react';

function SemanticSearch({ subjectId }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    
    const handleSearch = async () => {
        if (!query.trim()) return;
        
        setSearching(true);
        
        try {
            const response = await fetch('/api/manager/documents/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: query,
                    filters: { subjectId },
                    options: { limit: 10 }
                })
            });
            
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Error en búsqueda:', error);
        } finally {
            setSearching(false);
        }
    };
    
    return (
        <div>
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en documentos..."
            />
            <button onClick={handleSearch} disabled={searching}>
                {searching ? 'Buscando...' : 'Buscar'}
            </button>
            
            <div>
                {results.map(result => (
                    <div key={result.id}>
                        <p><strong>Similitud:</strong> {(result.similarity * 100).toFixed(1)}%</p>
                        <p>{result.text}</p>
                        <small>Archivo: {result.file_name} | Página: {result.page_number}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

## Configuración

### Variables de entorno recomendadas

```bash
# .env
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false

EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
EMBEDDING_BATCH_SIZE=16

PDF_MAX_SIZE=52428800
PDF_QUALITY_THRESHOLD=0.7

CHUNK_MAX_SIZE=500
CHUNK_MIN_SIZE=150
CHUNK_OVERLAP=75

SEARCH_DEFAULT_LIMIT=10
SEARCH_DEFAULT_THRESHOLD=0.15

RAG_LOGGING=true
RAG_LOG_LEVEL=info
```

## Mantenimiento

### Logs de Chroma DB

```bash
cd app/manager/rag-system
docker-compose logs -f chromadb
```

### Backup de vectores

```bash
cd app/manager/rag-system
tar -czf backup-vectors-$(date +%Y%m%d).tar.gz data/chromadb/
```

### Restart del sistema

```bash
cd app/manager/rag-system
docker-compose restart chromadb
```

## Desarrollo

Para desarrollo local:

1. Asegúrate de que Chroma DB esté ejecutándose
2. Los archivos RAG están en `app/manager/rag-system/`
3. Los endpoints están integrados en el routing de Next.js
4. Los componentes pueden importar directamente los servicios

---

*Sistema RAG integrado en AIQuiz Manager*