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
		const callId = `${method}:${endpoint}:${JSON.stringify(data)}`;

		// Verificar si hay una llamada duplicada en curso
		if (
			this.preventDuplicateCalls &&
			!forceCall &&
			this.callRegistry.has(callId)
		) {
			console.log(
				`⚠️ Llamada duplicada detectada: ${method} ${endpoint}`
			);
			return this.callRegistry.get(callId);
		}

		// Registrar la nueva llamada
		console.log(`📤 Simulando petición ${method} a ${endpoint}`);
		if (data) {
			console.log("Datos enviados:", data);
		}

		// Crear la promesa de respuesta
		const responsePromise = new Promise((resolve) => {
			setTimeout(() => {
				const response = this._getMockResponse(endpoint, method, data);
				console.log(
					`📥 Respuesta simulada recibida para ${method} ${endpoint}`
				);

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
	 * Habilitar o deshabilitar la prevención de llamadas duplicadas
	 * @param {boolean} enable - True para habilitar, false para deshabilitar
	 */
	setPreventDuplicateCalls(enable) {
		this.preventDuplicateCalls = enable;
		console.log(
			`${
				enable ? "Habilitada" : "Deshabilitada"
			} la prevención de llamadas duplicadas`
		);
	}

	/**
	 * Limpiar el registro de llamadas
	 */
	clearCallRegistry() {
		this.callRegistry.clear();
		console.log("Registro de llamadas limpiado");
	}
}

// Exportamos una única instancia para toda la aplicación
const apiService = new ApiService();
export default apiService;
