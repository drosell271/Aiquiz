// Servicio centralizado para manejar todas las llamadas a la API
// Simula las respuestas mientras se desarrolla la API real

/**
 * Clase para gestionar las llamadas a la API con simulaciones para el desarrollo
 */
class ApiService {
	constructor() {
		// Registro de llamadas para detectar duplicados
		this.callRegistry = new Map();
		// Flag para habilitar o deshabilitar prevención de llamadas duplicadas
		this.preventDuplicateCalls = true;
		// Registro de respuestas en caché para reutilizarlas
		this.responseCache = new Map();
		// Contador de llamadas para estadísticas
		this.callCounter = 0;
		// Nivel de detalle de los logs
		this.verboseLogging = true;
	}

	/**
	 * Formatea un objeto para la consola
	 * @param {Object} obj - Objeto a formatear
	 * @returns {string} - Objeto formateado
	 */
	_formatObject(obj) {
		try {
			return JSON.stringify(obj, null, 2);
		} catch (error) {
			return String(obj);
		}
	}

	/**
	 * Imprime un mensaje en la consola con estilo
	 * @param {string} type - Tipo de mensaje (info, success, warning, error)
	 * @param {string} message - Mensaje a imprimir
	 * @param {Object} data - Datos adicionales a imprimir
	 */
	_log(type, message, data = null) {
		if (!this.verboseLogging && type !== "error") return;

		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
		let style = "";
		let emoji = "";

		switch (type) {
			case "info":
				style = "color: #3498db; font-weight: bold;";
				emoji = "ℹ️";
				break;
			case "success":
				style = "color: #2ecc71; font-weight: bold;";
				emoji = "✅";
				break;
			case "warning":
				style = "color: #f39c12; font-weight: bold;";
				emoji = "⚠️";
				break;
			case "error":
				style = "color: #e74c3c; font-weight: bold;";
				emoji = "❌";
				break;
			case "api":
				style = "color: #9b59b6; font-weight: bold;";
				emoji = "🔄";
				break;
			default:
				style = "color: #34495e; font-weight: bold;";
				emoji = "📝";
		}

		console.log(`%c${emoji} [${timestamp}] ApiService: ${message}`, style);

		if (data) {
			if (typeof data === "object" && data !== null) {
				console.log("%cDatos:", "font-weight: bold;");
				console.log(data);
			} else {
				console.log(`%cDatos: ${data}`, "font-weight: bold;");
			}
		}
	}

	/**
	 * Registra una nueva llamada a la API
	 * @param {string} endpoint - Endpoint de la API
	 * @param {string} method - Método HTTP
	 * @param {Object} data - Datos enviados
	 * @returns {string} - ID único de la llamada
	 */
	_registerCall(endpoint, method, data) {
		this.callCounter++;
		const callId = `${method}:${endpoint}:${JSON.stringify(data)}`;
		const requestInfo = {
			id: this.callCounter,
			timestamp: new Date(),
			endpoint,
			method,
			data,
		};

		this._log(
			"api",
			`Llamada #${this.callCounter} - ${method} ${endpoint}`,
			{
				request: {
					method,
					endpoint,
					data,
				},
			}
		);

		return callId;
	}

	/**
	 * Simula una llamada a la API con retardo
	 * @param {string} endpoint - Endpoint de la API
	 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
	 * @param {Object} data - Datos a enviar (para POST/PUT)
	 * @param {number} delay - Tiempo de retardo en ms
	 * @param {boolean} forceCall - Forzar la llamada incluso si es duplicada
	 * @returns {Promise<any>} - Promesa con la respuesta simulada
	 */
	async simulateApiCall(
		endpoint,
		method = "GET",
		data = null,
		delay = 800,
		forceCall = false
	) {
		const callId = this._registerCall(endpoint, method, data);

		// Verificar si hay una llamada duplicada en curso
		if (
			this.preventDuplicateCalls &&
			!forceCall &&
			this.callRegistry.has(callId)
		) {
			this._log(
				"warning",
				`Llamada duplicada detectada: ${method} ${endpoint}`
			);
			return this.callRegistry.get(callId);
		}

		// Verificar si tenemos una respuesta en caché para peticiones GET
		if (method === "GET" && this.responseCache.has(callId) && !forceCall) {
			this._log(
				"info",
				`Usando respuesta cacheada para ${method} ${endpoint}`,
				{
					cachedResponse: this.responseCache.get(callId),
				}
			);
			return Promise.resolve(this.responseCache.get(callId));
		}

		// Crear la promesa de respuesta
		const responsePromise = new Promise((resolve) => {
			setTimeout(() => {
				const response = this._getMockResponse(endpoint, method, data);

				this._log(
					"success",
					`Respuesta recibida para ${method} ${endpoint}`,
					{
						request: {
							method,
							endpoint,
							data,
						},
						response,
					}
				);

				// Guardar en caché para peticiones GET
				if (method === "GET") {
					this.responseCache.set(callId, response);
				}

				// Eliminar del registro una vez completada
				this.callRegistry.delete(callId);

				resolve(response);
			}, delay);
		});

		// Guardar la promesa en el registro
		if (this.preventDuplicateCalls) {
			this.callRegistry.set(callId, responsePromise);
		}

		return responsePromise;
	}

	/**
	 * Obtiene la respuesta simulada según el endpoint y método
	 * @private
	 */
	_getMockResponse(endpoint, method, data) {
		// Autenticación
		if (endpoint === "/api/auth/login") {
			return {
				success: true,
				token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkNhcmxvcyBHb256YWxleiIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
				user: {
					id: "user123",
					name: "Carlos González",
					email: data?.email || "admin@upm.es",
				},
			};
		}

		// Recuperación de contraseña
		if (endpoint === "/api/auth/recovery") {
			return {
				success: true,
				message: "Email de recuperación enviado",
			};
		}

		// Asignaturas
		if (endpoint === "/api/subjects" && method === "GET") {
			return require("../data/subjects.json");
		}

		// Crear nueva asignatura
		if (endpoint === "/api/subjects" && method === "POST") {
			return {
				success: true,
				id: `subject-${Date.now()}`,
				...data,
			};
		}

		// Detalle de asignatura
		if (endpoint.match(/\/api\/subjects\/[\w-]+$/) && method === "GET") {
			return require("../data/subject-details.json");
		}

		// Actualizar asignatura
		if (endpoint.match(/\/api\/subjects\/[\w-]+$/) && method === "PUT") {
			return {
				success: true,
				...data,
			};
		}

		// Eliminar asignatura
		if (endpoint.match(/\/api\/subjects\/[\w-]+$/) && method === "DELETE") {
			return {
				success: true,
				message: "Asignatura eliminada correctamente",
			};
		}

		// Añadir profesor a asignatura
		if (
			endpoint.match(/\/api\/subjects\/[\w-]+\/professors$/) &&
			method === "POST"
		) {
			return {
				success: true,
				id: `professor-${Date.now()}`,
				...data,
			};
		}

		// Eliminar profesor de asignatura
		if (
			endpoint.match(/\/api\/subjects\/[\w-]+\/professors\/[\w-]+$/) &&
			method === "DELETE"
		) {
			return {
				success: true,
				message: "Profesor eliminado correctamente",
			};
		}

		// Añadir tema a asignatura
		if (
			endpoint.match(/\/api\/subjects\/[\w-]+\/topics$/) &&
			method === "POST"
		) {
			return {
				success: true,
				id: `topic-${Date.now()}`,
				...data,
			};
		}

		// Actualizar tema
		if (
			endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
			method === "PATCH"
		) {
			return {
				success: true,
				...data,
			};
		}

		// Eliminar tema
		if (
			endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
			method === "DELETE"
		) {
			return {
				success: true,
				message: "Tema eliminado correctamente",
			};
		}

		// Por defecto
		return {
			success: false,
			error: "Endpoint no implementado en simulación",
		};
	}

	/**
	 * Limpia la caché de respuestas guardadas
	 */
	clearCache() {
		this.responseCache.clear();
		this._log("info", "Caché de respuestas limpiada");
	}

	/**
	 * Habilitar o deshabilitar la prevención de llamadas duplicadas
	 * @param {boolean} enable - True para habilitar, false para deshabilitar
	 */
	setPreventDuplicateCalls(enable) {
		this.preventDuplicateCalls = enable;
		this._log(
			"info",
			`${
				enable ? "Habilitada" : "Deshabilitada"
			} la prevención de llamadas duplicadas`
		);
	}

	/**
	 * Habilitar o deshabilitar logs detallados
	 * @param {boolean} enable - True para habilitar, false para deshabilitar
	 */
	setVerboseLogging(enable) {
		this.verboseLogging = enable;
		this._log(
			"info",
			`Logs detallados ${enable ? "habilitados" : "deshabilitados"}`
		);
	}

	/**
	 * Limpiar el registro de llamadas
	 */
	clearCallRegistry() {
		this.callRegistry.clear();
		this._log("info", "Registro de llamadas limpiado");
	}

	/**
	 * Obtener estadísticas de uso
	 * @returns {Object} - Estadísticas de uso
	 */
	getStats() {
		const stats = {
			totalCalls: this.callCounter,
			activeCalls: this.callRegistry.size,
			cachedResponses: this.responseCache.size,
		};

		this._log("info", "Estadísticas de uso", stats);
		return stats;
	}
}

// Exportamos una única instancia para toda la aplicación
const apiService = new ApiService();

// Configuración inicial
apiService.setVerboseLogging(true);

export default apiService;
