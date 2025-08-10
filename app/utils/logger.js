// Simplified colors for CommonJS compatibility
const colors = {
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

/**
 * Sistema de logging configurable para AIQuiz
 * 
 * Niveles de log:
 * - ERROR (0): Solo errores críticos
 * - WARN (1): Advertencias y errores 
 * - INFO (2): Información general + WARN
 * - DEBUG (3): Información detallada + INFO
 * - TRACE (4): Todo incluido + DEBUG
 * 
 * Variables de entorno:
 * - LOG_LEVEL: ERROR|WARN|INFO|DEBUG|TRACE
 * - SHOW_TIMESTAMPS: true|false
 * - COLORED_OUTPUT: true|false
 * - LOG_FILE: path para logging a archivo
 */

// Configuración desde variables de entorno
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO');
const SHOW_TIMESTAMPS = process.env.SHOW_TIMESTAMPS !== 'false';
const COLORED_OUTPUT = process.env.COLORED_OUTPUT !== 'false' && !process.env.LOG_FILE;
const LOG_FILE = process.env.LOG_FILE;

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

const CURRENT_LEVEL = LOG_LEVELS[LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO;

// File logging setup
let fileStream = null;
if (LOG_FILE) {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Crear directorio si no existe
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        fileStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    } catch (error) {
        console.error('Failed to initialize log file:', error.message);
    }
}

/**
 * Formatea un mensaje con timestamp y color
 */
function formatMessage(level, category, message, data = null) {
    const timestamp = SHOW_TIMESTAMPS ? `[${new Date().toISOString()}] ` : '';
    const levelStr = `[${level}] `;
    const categoryStr = category ? `[${category}] ` : '';
    const dataStr = data ? ` ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}` : '';
    
    const fullMessage = `${timestamp}${levelStr}${categoryStr}${message}${dataStr}`;
    
    if (!COLORED_OUTPUT) {
        return fullMessage;
    }
    
    // Colores por nivel
    switch (level) {
        case 'ERROR':
            return colors.bold(colors.red(fullMessage));
        case 'WARN':
            return colors.yellow(fullMessage);
        case 'INFO':
            return colors.blue(fullMessage);
        case 'DEBUG':
            return colors.green(fullMessage);
        case 'TRACE':
            return colors.gray(fullMessage);
        default:
            return fullMessage;
    }
}

/**
 * Escribe un mensaje al stream apropiado (consola o archivo)
 */
function writeLog(level, formattedMessage) {
    if (fileStream) {
        // Para archivos, no usar colores
        const plainMessage = SHOW_TIMESTAMPS ? 
            `[${new Date().toISOString()}] [${level}] ${formattedMessage.replace(/\x1b\[[0-9;]*m/g, '')}` :
            `[${level}] ${formattedMessage.replace(/\x1b\[[0-9;]*m/g, '')}`;
        fileStream.write(plainMessage + '\n');
    } else {
        // Para consola, usar el método apropiado
        switch (level) {
            case 'ERROR':
                console.error(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
                break;
        }
    }
}

/**
 * Verifica si un nivel debe ser mostrado
 */
function shouldLog(level) {
    return LOG_LEVELS[level] <= CURRENT_LEVEL;
}

/**
 * Logger principal
 */
class Logger {
    constructor(category = null) {
        this.category = category;
    }

    error(message, data = null) {
        if (shouldLog('ERROR')) {
            const formatted = formatMessage('ERROR', this.category, message, data);
            writeLog('ERROR', formatted);
        }
    }

    warn(message, data = null) {
        if (shouldLog('WARN')) {
            const formatted = formatMessage('WARN', this.category, message, data);
            writeLog('WARN', formatted);
        }
    }

    info(message, data = null) {
        if (shouldLog('INFO')) {
            const formatted = formatMessage('INFO', this.category, message, data);
            writeLog('INFO', formatted);
        }
    }

    debug(message, data = null) {
        if (shouldLog('DEBUG')) {
            const formatted = formatMessage('DEBUG', this.category, message, data);
            writeLog('DEBUG', formatted);
        }
    }

    trace(message, data = null) {
        if (shouldLog('TRACE')) {
            const formatted = formatMessage('TRACE', this.category, message, data);
            writeLog('TRACE', formatted);
        }
    }

    // Métodos especiales para casos específicos
    success(message, data = null) {
        if (shouldLog('INFO')) {
            const successMsg = `SUCCESS: ${message}`;
            const formatted = formatMessage('INFO', this.category, successMsg, data);
            writeLog('INFO', COLORED_OUTPUT ? colors.bold(colors.green(formatted)) : formatted);
        }
    }

    progress(message, data = null) {
        if (shouldLog('DEBUG')) {
            const progressMsg = `PROCESSING: ${message}`;
            const formatted = formatMessage('DEBUG', this.category, progressMsg, data);
            writeLog('DEBUG', formatted);
        }
    }

    separator(title = null) {
        if (shouldLog('DEBUG')) {
            const line = COLORED_OUTPUT ? colors.green : (str) => str;
            const separator = '─'.repeat(80);
            writeLog('DEBUG', line(separator));
            if (title) {
                const centeredTitle = `${title.padStart(40 + Math.floor(title.length / 2)).padEnd(80)}`;
                writeLog('DEBUG', line(centeredTitle));
                writeLog('DEBUG', line(separator));
            }
        }
    }

    // Método para crear sub-loggers con categoría
    child(childCategory) {
        const fullCategory = this.category ? `${this.category}:${childCategory}` : childCategory;
        return new Logger(fullCategory);
    }
}

// Instancia por defecto
const logger = new Logger();

// Factory para crear loggers con categoría
logger.create = (category) => new Logger(category);

// Información del sistema de logging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    logger.info('Logger initialized', { 
        level: LOG_LEVEL, 
        showTimestamps: SHOW_TIMESTAMPS, 
        coloredOutput: COLORED_OUTPUT 
    });
}

module.exports = logger;

// Exportaciones adicionales para compatibilidad
module.exports.Logger = Logger;
module.exports.createLogger = (category) => new Logger(category);