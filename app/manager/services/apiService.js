// ApiService.js - Versión actualizada para soportar todas las funcionalidades necesarias
// Servicio para gestionar llamadas a la API con simulación para desarrollo

// Importar datos JSON directamente para evitar problemas con require dinámico
import subjectsData from "../data/subjects.json";
import subjectDetailsData from "../data/subject-details.json";
import topicDetailsData from "../data/topic-details.json";
import questionsHttpData from "../data/questions-http.json";
import questionnairesHttpData from "../data/questionnaires-http.json";

class ApiService {
	constructor() {
		// Control de llamadas y caché
		this.callRegistry = new Map();
		this.responseCache = new Map();
		this.callCounter = 0;

		// Configuración
		this.preventDuplicateCalls = true;
		this.enableLogging = true;

		// Datos de usuario de prueba
		this.userData = {
			id: "user123",
			name: "Carlos González",
			email: "carlos.gonzalez@upm.es",
			faculty: "ETSIT",
			department: "Ingeniería Telemática",
			lastLogin: "2025-04-20T10:30:00Z",
		};

		// Datos simulados precargados
		this.mockData = {
			subjects: subjectsData,
			subjectDetails: subjectDetailsData,
			topicDetails: topicDetailsData,
			questionsHttp: questionsHttpData,
			questionnairesHttp: questionnairesHttpData,
		};

		console.log("🚀 ApiService inicializado con datos simulados");
	}

	/**
	 * Imprime un log unificado en la consola con toda la información relevante
	 */
	logComplete(request, response, isCache = false) {
		if (!this.enableLogging) return;

		const timestamp = new Date().toLocaleTimeString();
		const isError = !response.success;

		// Construir un mensaje unificado con todos los detalles
		console.groupCollapsed(
			`%c🔄 API [${timestamp}]: ${request.method} ${request.endpoint} ${
				isCache ? "(CACHE)" : ""
			}`,
			"color: #2980b9; font-weight: bold; font-size: 12px;"
		);

		// Sección de Petición
		console.log(
			"%c📤 Petición:",
			"color: #3498db; font-weight: bold; margin-top: 5px;"
		);
		console.log(`• Método: ${request.method}`);
		console.log(`• Endpoint: ${request.endpoint}`);
		if (request.data) {
			console.log("• Datos enviados:");
			console.log(request.data);
		}

		// Sección de Respuesta
		console.log(
			"%c📥 Respuesta:",
			"color: #2ecc71; font-weight: bold; margin-top: 8px;"
		);
		if (response.success) {
			console.log(`• Estado: %cÉxito`, "color: #2ecc71");
		} else {
			console.log(`• Estado: %cError`, "color: #e74c3c");
		}
		console.log("• Datos recibidos:");
		console.log(response);

		// Tiempo de respuesta (simulado en desarrollo)
		console.log(
			"%c⏱️ Tiempo: %c" +
				(isCache ? "<1ms (caché)" : "~800ms (simulado)"),
			"color: #7f8c8d; margin-top: 5px;",
			isCache ? "color: #9b59b6; font-weight: bold" : "color: inherit"
		);

		console.groupEnd();
	}

	/**
	 * Simula una llamada a la API
	 */
	async simulateApiCall(
		endpoint,
		method = "GET",
		data = null,
		delay = 800,
		forceCall = false
	) {
		this.callCounter++;
		const callId = `${method}:${endpoint}:${JSON.stringify(data)}`;

		const requestInfo = {
			id: this.callCounter,
			method,
			endpoint,
			data,
		};

		// Verificar llamadas duplicadas
		if (
			this.preventDuplicateCalls &&
			!forceCall &&
			this.callRegistry.has(callId)
		) {
			console.warn(
				`⚠️ API: Llamada duplicada detectada: ${method} ${endpoint}`
			);
			return this.callRegistry.get(callId);
		}

		// Verificar caché para peticiones GET
		if (method === "GET" && this.responseCache.has(callId) && !forceCall) {
			const cachedResponse = this.responseCache.get(callId);
			// Log unificado para respuesta de caché
			this.logComplete(requestInfo, cachedResponse, true);
			return Promise.resolve(cachedResponse);
		}

		// Crear y registrar la promesa de respuesta
		const responsePromise = new Promise((resolve) => {
			setTimeout(() => {
				const response = this._getMockResponse(endpoint, method, data);

				// Log unificado para petición y respuesta
				this.logComplete(requestInfo, response);

				// Guardar en caché si es GET
				if (method === "GET") {
					this.responseCache.set(callId, response);
				}

				// Eliminar del registro
				this.callRegistry.delete(callId);

				resolve(response);
			}, delay);
		});

		// Registrar la promesa para evitar duplicados
		if (this.preventDuplicateCalls) {
			this.callRegistry.set(callId, responsePromise);
		}

		return responsePromise;
	}

	/**
	 * Obtiene la respuesta simulada según el endpoint y método
	 */
	_getMockResponse(endpoint, method, data) {
		try {
			// === CUENTA ===
			// GET /api/account
			if (endpoint === "/api/account" && method === "GET") {
				return {
					success: true,
					user: this.userData,
				};
			}

			// PUT /api/account
			if (endpoint === "/api/account" && method === "PUT") {
				if (data) {
					const allowedFields = ["name", "email", "faculty"];
					allowedFields.forEach((field) => {
						if (data[field] !== undefined) {
							this.userData[field] = data[field];
						}
					});
				}
				return {
					success: true,
					user: this.userData,
					message: "Perfil actualizado correctamente",
				};
			}

			// PUT /api/account/password
			if (endpoint === "/api/account/password" && method === "PUT") {
				if (data && data.currentPassword !== "password123") {
					return {
						success: false,
						message: "La contraseña actual es incorrecta",
					};
				}
				return {
					success: true,
					message: "Contraseña actualizada correctamente",
				};
			}

			// === AUTENTICACIÓN ===
			// POST /api/auth/login
			if (endpoint === "/api/auth/login") {
				return {
					success: true,
					token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
					user: {
						id: "user123",
						name: "Carlos González",
						email: data?.email || "admin@upm.es",
					},
				};
			}

			// POST /api/auth/recovery
			if (endpoint === "/api/auth/recovery") {
				return {
					success: true,
					message: "Email de recuperación enviado",
				};
			}

			// === ASIGNATURAS ===
			// GET /api/subjects
			if (endpoint === "/api/subjects" && method === "GET") {
				// IMPORTANTE: Devolver directamente el array para que subjects.map funcione
				return this.mockData.subjects;
			}

			// POST /api/subjects
			if (endpoint === "/api/subjects" && method === "POST") {
				return {
					success: true,
					id: `subject-${Date.now()}`,
					...data,
				};
			}

			// GET /api/subjects/:id
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+$/) &&
				method === "GET"
			) {
				// Devolver directamente el objeto para mantener compatibilidad
				return this.mockData.subjectDetails;
			}

			// PUT /api/subjects/:id
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+$/) &&
				method === "PUT"
			) {
				return {
					success: true,
					...data,
				};
			}

			// DELETE /api/subjects/:id
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+$/) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Asignatura eliminada correctamente",
				};
			}

			// === PROFESORES ===
			// POST /api/subjects/:id/professors
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

			// DELETE /api/subjects/:id/professors/:profId
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/professors\/[\w-]+$/
				) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Profesor eliminado correctamente",
				};
			}

			// === TEMAS ===
			// POST /api/subjects/:id/topics
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

			// PATCH /api/subjects/:id/topics/:topicId
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
				method === "PATCH"
			) {
				return {
					success: true,
					...data,
				};
			}

			// DELETE /api/subjects/:id/topics/:topicId
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Tema eliminado correctamente",
				};
			}

			// GET /api/subjects/:id/topics/:topicId
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
				method === "GET"
			) {
				// Devolver directamente el objeto para mantener compatibilidad
				return this.mockData.topicDetails;
			}

			// === PREGUNTAS ===
			// GET /api/subjects/:id/topics/:topicId/questions
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questions$/
				) &&
				method === "GET"
			) {
				return this.mockData.questionsHttp;
			}

			// POST /api/subjects/:id/topics/:topicId/questions
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questions$/
				) &&
				method === "POST"
			) {
				return {
					success: true,
					id: `question-${Date.now()}`,
					...data,
				};
			}

			// DELETE /api/subjects/:id/topics/:topicId/questions/:questionId
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questions\/[\w-]+$/
				) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Pregunta eliminada correctamente",
				};
			}

			// === CUESTIONARIOS ===
			// GET /api/subjects/:id/topics/:topicId/questionnaires
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires$/
				) &&
				method === "GET"
			) {
				return this.mockData.questionnairesHttp;
			}

			// POST /api/subjects/:id/topics/:topicId/questionnaires
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires$/
				) &&
				method === "POST"
			) {
				return {
					success: true,
					id: `questionnaire-${Date.now()}`,
					...data,
				};
			}

			// DELETE /api/subjects/:id/topics/:topicId/questionnaires/:questionnaireId
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires\/[\w-]+$/
				) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Cuestionario eliminado correctamente",
				};
			}

			// === GENERACIÓN Y DESCARGA ===
			// POST /api/subjects/:id/topics/:topicId/generate-questionnaire
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/generate-questionnaire$/
				) &&
				method === "POST"
			) {
				return {
					success: true,
					id: `questionnaire-${Date.now()}`,
					title: data.title,
					description: data.description,
					questionIds: data.questionIds,
					createdAt: new Date().toISOString(),
					message: "Cuestionario generado correctamente",
				};
			}

			// POST /api/subjects/:id/topics/:topicId/download-questions
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/download-questions$/
				) &&
				method === "POST"
			) {
				return {
					success: true,
					format: data.format,
					questionIds: data.questionIds,
					message: `Preguntas descargadas en formato ${data.format}`,
				};
			}

			// GET /api/subjects/:id/topics/:topicId/questionnaires/:questionnaireId/download
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires\/[\w-]+\/download/
				) &&
				method === "GET"
			) {
				const format = endpoint.includes("format=")
					? endpoint.split("format=")[1]
					: "pdf";

				return {
					success: true,
					format,
					message: `Cuestionario descargado en formato ${format}`,
				};
			}

			// === SUBTEMAS ===
			// POST /api/subjects/:id/topics/:topicId/subtopics
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics$/
				) &&
				method === "POST"
			) {
				return {
					success: true,
					id: `subtopic-${Date.now()}`,
					...data,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
			}

			// PUT /api/subjects/:id/topics/:topicId/subtopics/:subtopicId
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+$/
				) &&
				method === "PUT"
			) {
				return {
					success: true,
					...data,
					updatedAt: new Date().toISOString(),
				};
			}

			// DELETE /api/subjects/:id/topics/:topicId/subtopics/:subtopicId
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+$/
				) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Subtema eliminado correctamente",
				};
			}

			// Endpoint no implementado
			return {
				success: false,
				error: "Endpoint no implementado en simulación",
				endpoint,
			};
		} catch (error) {
			console.error("Error procesando la solicitud:", error);
			return {
				success: false,
				error: `Error al procesar la solicitud: ${error.message}`,
				details: error.stack,
			};
		}
	}

	// Métodos de utilidad
	setLogging(enable) {
		this.enableLogging = enable;
		console.log(`ℹ️ API: Logging ${enable ? "activado" : "desactivado"}`);
	}

	clearCache() {
		this.responseCache.clear();
		console.log(
			`ℹ️ API: Caché limpiada (${this.responseCache.size} entradas)`
		);
	}
}

// Exportar una única instancia para toda la aplicación
const apiService = new ApiService();

export default apiService;
