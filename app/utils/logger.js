import chalk from "chalk";

/**
 * Sistema de logging configurable para AIQuiz
 * 
 * Niveles de log:
 * - ERROR (0): Solo errores críticos
 * - WARN (1): Advertencias y errores 
 * - INFO (2): Información general + WARN
 * - DEBUG (3): Información detallada + INFO
 * - TRACE (4): Todo incluido + DEBUG
 */

// Configuración desde variables de entorno
const LOG_LEVEL = process.env.LOG_LEVEL || process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO';
const SHOW_TIMESTAMPS = process.env.SHOW_TIMESTAMPS !== 'false';
const COLORED_OUTPUT = process.env.COLORED_OUTPUT !== 'false';

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

const CURRENT_LEVEL = LOG_LEVELS[LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO;

/**
 * Formatea un mensaje con timestamp y color
 */
function formatMessage(level, category, message, data = null) {
    const timestamp = SHOW_TIMESTAMPS ? `[${new Date().toISOString()}] ` : '';
    const categoryStr = category ? `[${category}] ` : '';
    const dataStr = data ? ` ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}` : '';
    
    const fullMessage = `${timestamp}${categoryStr}${message}${dataStr}`;
    
    if (!COLORED_OUTPUT) {
        return fullMessage;
    }
    
    // Colores por nivel
    switch (level) {
        case 'ERROR':
            return chalk.red.bold(fullMessage);
        case 'WARN':
            return chalk.yellow(fullMessage);
        case 'INFO':
            return chalk.blue(fullMessage);
        case 'DEBUG':
            return chalk.green(fullMessage);
        case 'TRACE':
            return chalk.gray(fullMessage);
        default:
            return fullMessage;
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
            console.error(formatMessage('ERROR', this.category, message, data));
        }
    }

    warn(message, data = null) {
        if (shouldLog('WARN')) {
            console.warn(formatMessage('WARN', this.category, message, data));
        }
    }

    info(message, data = null) {
        if (shouldLog('INFO')) {
            console.log(formatMessage('INFO', this.category, message, data));
        }
    }

    debug(message, data = null) {
        if (shouldLog('DEBUG')) {
            console.log(formatMessage('DEBUG', this.category, message, data));
        }
    }

    trace(message, data = null) {
        if (shouldLog('TRACE')) {
            console.log(formatMessage('TRACE', this.category, message, data));
        }
    }

    // Métodos especiales para casos específicos
    success(message, data = null) {
        if (shouldLog('INFO')) {
            const msg = COLORED_OUTPUT ? chalk.green.bold(`✅ ${message}`) : `✅ ${message}`;
            console.log(`${SHOW_TIMESTAMPS ? `[${new Date().toISOString()}] ` : ''}${this.category ? `[${this.category}] ` : ''}${msg}${data ? ` ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}` : ''}`);
        }
    }

    progress(message, data = null) {
        if (shouldLog('DEBUG')) {
            const msg = COLORED_OUTPUT ? chalk.blue(`🔍 ${message}`) : `🔍 ${message}`;
            console.log(`${SHOW_TIMESTAMPS ? `[${new Date().toISOString()}] ` : ''}${this.category ? `[${this.category}] ` : ''}${msg}${data ? ` ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}` : ''}`);
        }
    }

    separator(title = null) {
        if (shouldLog('DEBUG')) {
            const line = COLORED_OUTPUT ? chalk.bgGreen.black : (str) => str;
            const separator = '─'.repeat(80);
            console.log(line(separator));
            if (title) {
                console.log(line(`${title.padStart(40 + Math.floor(title.length / 2)).padEnd(80)}`));
                console.log(line(separator));
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

// Información del sistema de logging
logger.info('Logger initialized', { 
    level: LOG_LEVEL, 
    showTimestamps: SHOW_TIMESTAMPS, 
    coloredOutput: COLORED_OUTPUT 
});

export default logger;

// Exportaciones adicionales para compatibilidad
export { Logger };
export const createLogger = (category) => new Logger(category);