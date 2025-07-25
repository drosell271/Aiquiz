# 📊 Sistema de Logging de AIQuiz

El sistema de logging de AIQuiz permite controlar qué información se muestra en los logs del servidor con diferentes niveles de detalle.

## 🎛️ Niveles de Log Disponibles

| Nivel | Descripción | Uso Recomendado |
|-------|-------------|-----------------|
| `ERROR` | Solo errores críticos | Producción |
| `WARN` | Errores y advertencias | Producción con debug básico |
| `INFO` | Información general + WARN | Producción normal ✅ |
| `DEBUG` | Información detallada + INFO | Desarrollo ✅ |
| `TRACE` | Todo incluido + DEBUG | Debug profundo |

## ⚙️ Configuración

### Configuración Global

Edita el archivo `.env`:

```bash
# Nivel general para todos los componentes
LOG_LEVEL=DEBUG

# Configuración de formato
SHOW_TIMESTAMPS=true
COLORED_OUTPUT=true
INCLUDE_STACK_TRACE=false
```

### Configuración por Componente

Para controlar logs específicos de cada parte del sistema:

```bash
# Logs específicos por componente
QUESTIONS_LOG_LEVEL=INFO    # API de generación de preguntas
RAG_LOG_LEVEL=DEBUG         # Sistema RAG de contexto
LLM_LOG_LEVEL=WARN          # Peticiones a modelos LLM
FILES_LOG_LEVEL=INFO        # Gestión de archivos
MANAGER_LOG_LEVEL=DEBUG     # Interfaz de gestión
```

## 📋 Ejemplos de Salida

### Nivel ERROR
```
[ERROR] {LLM} Error durante petición OpenAI: 401 Unauthorized
```

### Nivel INFO  
```
[INFO] {RAG} Encontrados 2 archivos para el subtema: React Components
[INFO] {Questions} Modelo asignado: OpenAI_GPT_4o_Mini
```

### Nivel DEBUG
```
[DEBUG] {RAG} Buscando contexto para subtema: 687d2a64479bea2f26dcb965
[DEBUG] {LLM} Solicitando respuesta del modelo: OpenAI_GPT_4o_Mini
✅ [INFO] {RAG} Contexto generado: 482 caracteres de 2 archivos
🔍 [DEBUG] {Questions} Buscando contexto RAG para el subtema
```

### Nivel TRACE
```
[TRACE] {RAG} Contenido del contexto: {"contextFragments": "..."}
```

## 🎨 Personalización Visual

### Colores
- ✅ **Éxito**: Verde
- 🔍 **Progreso**: Azul  
- ⚠️ **Advertencia**: Amarillo
- ❌ **Error**: Rojo
- 📋 **Separadores**: Fondo verde

### Sin Colores
```bash
COLORED_OUTPUT=false
```

### Sin Timestamps
```bash
SHOW_TIMESTAMPS=false
```

## 🚀 Configuraciones Recomendadas

### Desarrollo
```bash
LOG_LEVEL=DEBUG
SHOW_TIMESTAMPS=true
COLORED_OUTPUT=true
RAG_LOG_LEVEL=DEBUG
QUESTIONS_LOG_LEVEL=DEBUG
```

### Producción
```bash
LOG_LEVEL=INFO
SHOW_TIMESTAMPS=true
COLORED_OUTPUT=false
LLM_LOG_LEVEL=WARN
```

### Debug Específico (RAG)
```bash
LOG_LEVEL=WARN
RAG_LOG_LEVEL=TRACE
```

## 📊 Componentes del Sistema

- **Questions**: Generación de preguntas y asignación de modelos
- **RAG**: Búsqueda de contexto en documentos subidos
- **LLM**: Peticiones a APIs de modelos (OpenAI, Anthropic, etc.)
- **Files**: Gestión de archivos subidos
- **Manager**: Interfaz web de administración

## 🔧 Solución de Problemas

### Ver solo errores
```bash
LOG_LEVEL=ERROR
```

### Debug completo de RAG
```bash
RAG_LOG_LEVEL=TRACE
```

### Producción silenciosa
```bash
LOG_LEVEL=WARN
COLORED_OUTPUT=false
SHOW_TIMESTAMPS=false
```