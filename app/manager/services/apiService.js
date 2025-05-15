// ApiService.js - Servicio completo para gestionar llamadas a la API
// Este servicio proporciona simulaciones para desarrollo y sirve como referencia para implementar el backend

// Importar datos JSON para simulaciones
import subjectsData from "../data/subjects.json";
import subjectDetailsData from "../data/subject-details.json";
import topicDetailsData from "../data/topic-details.json";
import questionsHttpStatusData from "../data/questions-http-status.json";
import questionnairesHttpData from "../data/questionnaires-http.json";
import subtopicDetailsData from "../data/subtopic-details.json";

/**
 * Clase ApiService para gestionar llamadas a la API y proporcionar simulaciones
 * durante el desarrollo. Este servicio debe usarse como referencia para
 * implementar el backend real.
 */
class ApiService {
	constructor() {
		// ===== CONFIGURACIÓN DEL SERVICIO =====

		// Control de llamadas y caché
		this.callRegistry = new Map(); // Registro de llamadas en curso para evitar duplicados
		this.responseCache = new Map(); // Caché de respuestas para optimizar
		this.callCounter = 0; // Contador de llamadas para debugging

		// Configuración del comportamiento
		this.preventDuplicateCalls = true; // Evita llamadas duplicadas simultáneas
		this.enableLogging = true; // Activa/desactiva logs detallados
		this.simulationDelay = 800; // Delay simulado en ms (simula latencia de red)

		// ===== DATOS PARA SIMULACIÓN =====

		// Datos de usuario de prueba
		this.userData = {
			id: "user123",
			name: "Carlos González",
			email: "carlos.gonzalez@upm.es",
			faculty: "ETSIT",
			department: "Ingeniería Telemática",
			lastLogin: "2025-04-20T10:30:00Z",
		};

		// Datos simulados precargados desde archivos JSON
		this.mockData = {
			subjects: subjectsData,
			subjectDetails: subjectDetailsData,
			topicDetails: topicDetailsData,
			questionsHttp: questionsHttpStatusData,
			questionnairesHttp: questionnairesHttpData,
			subtopicDetails: subtopicDetailsData,
		};

		console.log("🚀 ApiService inicializado con datos simulados");
	}

	/**
	 * Imprime un log unificado con todos los detalles de la petición y respuesta
	 * @param {Object} request - Información de la petición
	 * @param {Object} response - Información de la respuesta
	 * @param {boolean} isCache - Indica si la respuesta viene de caché
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
				(isCache
					? "<1ms (caché)"
					: `~${this.simulationDelay}ms (simulado)`),
			"color: #7f8c8d; margin-top: 5px;",
			isCache ? "color: #9b59b6; font-weight: bold" : "color: inherit"
		);

		console.groupEnd();
	}

	/**
	 * Simula una llamada a la API
	 * @param {string} endpoint - Endpoint de la API
	 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE, PATCH)
	 * @param {Object} data - Datos a enviar en la petición
	 * @param {number} delay - Retraso simulado en ms
	 * @param {boolean} forceCall - Forzar llamada aunque exista una en curso
	 * @returns {Promise<Object>} - Promesa con la respuesta simulada
	 */
	async simulateApiCall(
		endpoint,
		method = "GET",
		data = null,
		delay = this.simulationDelay,
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
				try {
					const response = this._getMockResponse(
						endpoint,
						method,
						data
					);

					// Log unificado para petición y respuesta
					this.logComplete(requestInfo, response);

					// Guardar en caché si es GET
					if (method === "GET") {
						this.responseCache.set(callId, response);
					}

					// Eliminar del registro
					this.callRegistry.delete(callId);

					resolve(response);
				} catch (error) {
					console.error("Error en simulación de API:", error);
					const errorResponse = {
						success: false,
						error: `Error en simulación: ${error.message}`,
						details: error.stack,
					};
					this.logComplete(requestInfo, errorResponse);
					resolve(errorResponse);
				}
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
	 * @param {string} endpoint - Endpoint de la API
	 * @param {string} method - Método HTTP
	 * @param {Object} data - Datos enviados
	 * @returns {Object} - Respuesta simulada
	 */
	_getMockResponse(endpoint, method, data) {
		try {
			// ==========================================
			// ========== SECCIÓN AUTENTICACIÓN =========
			// ==========================================

			/**
			 * POST /api/auth/login
			 * Inicia sesión con email y contraseña
			 * Request: { email, password }
			 * Response: { success, token, user }
			 */
			if (endpoint === "/api/auth/login" && method === "POST") {
				// Validación básica (en un backend real se verificaría contra base de datos)
				const isValidCredentials =
					data?.email &&
					data?.password &&
					(data.password === "password123" || true); // En desarrollo aceptamos cualquier contraseña

				if (!isValidCredentials) {
					return {
						success: false,
						message: "Credenciales inválidas",
					};
				}

				return {
					success: true,
					token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Token JWT simulado
					user: {
						id: "user123",
						name: "Carlos González",
						email: data?.email || "admin@upm.es",
					},
				};
			}

			/**
			 * POST /api/auth/recovery
			 * Envía email de recuperación de contraseña
			 * Request: { email }
			 * Response: { success, message }
			 */
			if (endpoint === "/api/auth/recovery" && method === "POST") {
				// Validación básica del email
				if (!data?.email) {
					return {
						success: false,
						message: "Email no proporcionado",
					};
				}

				return {
					success: true,
					message: "Email de recuperación enviado",
				};
			}

			/**
			 * POST /api/auth/reset-password
			 * Restablece la contraseña con un token
			 * Request: { token, newPassword }
			 * Response: { success, message }
			 */
			if (endpoint === "/api/auth/reset-password" && method === "POST") {
				if (!data?.token || !data?.newPassword) {
					return {
						success: false,
						message: "Token o nueva contraseña no proporcionados",
					};
				}

				return {
					success: true,
					message: "Contraseña restablecida correctamente",
				};
			}

			// ==========================================
			// ============ SECCIÓN CUENTA ==============
			// ==========================================

			/**
			 * GET /api/account
			 * Obtiene los datos del usuario actual
			 * Response: { success, user }
			 */
			if (endpoint === "/api/account" && method === "GET") {
				return {
					success: true,
					user: this.userData,
				};
			}

			/**
			 * PUT /api/account
			 * Actualiza los datos del perfil del usuario
			 * Request: { name, email, faculty, etc. }
			 * Response: { success, user, message }
			 */
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

			/**
			 * PUT /api/account/password
			 * Cambia la contraseña del usuario
			 * Request: { currentPassword, newPassword, confirmPassword }
			 * Response: { success, message }
			 */
			if (endpoint === "/api/account/password" && method === "PUT") {
				if (!data?.currentPassword || !data?.newPassword) {
					return {
						success: false,
						message: "Faltan datos requeridos",
					};
				}

				// Simulamos validación de contraseña actual
				if (data.currentPassword !== "password123") {
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

			// ==========================================
			// =========== SECCIÓN ASIGNATURAS ==========
			// ==========================================

			/**
			 * GET /api/subjects
			 * Obtiene todas las asignaturas
			 * Response: [Subject]
			 */
			if (endpoint === "/api/subjects" && method === "GET") {
				// IMPORTANTE: Devolver directamente el array para que subjects.map funcione
				return this.mockData.subjects;
			}

			/**
			 * POST /api/subjects
			 * Crea una nueva asignatura
			 * Request: { title, acronym, description, professors }
			 * Response: { success, id, ...data }
			 */
			if (endpoint === "/api/subjects" && method === "POST") {
				// Validación básica
				if (!data?.title || !data?.acronym) {
					return {
						success: false,
						message: "Título y acrónimo son obligatorios",
					};
				}

				const newId = `subject-${Date.now()}`;

				// En una implementación real, aquí se guardaría en la base de datos
				return {
					success: true,
					id: newId,
					...data,
					message: "Asignatura creada correctamente",
				};
			}

			/**
			 * GET /api/subjects/:id
			 * Obtiene los detalles de una asignatura específica
			 * Response: Subject
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+$/) &&
				method === "GET"
			) {
				// En un backend real, se buscaría por ID en la base de datos
				return this.mockData.subjectDetails;
			}

			/**
			 * PUT /api/subjects/:id
			 * Actualiza una asignatura existente
			 * Request: { title, acronym, description, ... }
			 * Response: { success, ...data }
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+$/) &&
				method === "PUT"
			) {
				if (!data?.title) {
					return {
						success: false,
						message: "El título es obligatorio",
					};
				}

				return {
					success: true,
					...data,
					message: "Asignatura actualizada correctamente",
				};
			}

			/**
			 * DELETE /api/subjects/:id
			 * Elimina una asignatura
			 * Response: { success, message }
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+$/) &&
				method === "DELETE"
			) {
				// En un backend real, se verificaría permisos y se eliminaría de la BD
				return {
					success: true,
					message: "Asignatura eliminada correctamente",
				};
			}

			// ==========================================
			// =========== SECCIÓN PROFESORES ===========
			// ==========================================

			/**
			 * POST /api/subjects/:id/professors
			 * Añade un profesor a una asignatura
			 * Request: { name, email }
			 * Response: { success, id, ...data }
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/professors$/) &&
				method === "POST"
			) {
				if (!data?.name || !data?.email) {
					return {
						success: false,
						message: "Nombre y email son obligatorios",
					};
				}

				const newId = `professor-${Date.now()}`;

				return {
					success: true,
					id: newId,
					...data,
					message: "Profesor añadido correctamente",
				};
			}

			/**
			 * DELETE /api/subjects/:id/professors/:profId
			 * Elimina un profesor de una asignatura
			 * Response: { success, message }
			 */
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

			// ==========================================
			// ============= SECCIÓN TEMAS ==============
			// ==========================================

			/**
			 * GET /api/subjects/:id/topics
			 * Obtiene todos los temas de una asignatura
			 * Response: [Topic]
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics$/) &&
				method === "GET"
			) {
				// Extraemos los temas del objeto de detalles de asignatura
				return {
					success: true,
					topics: this.mockData.subjectDetails.topics || [],
				};
			}

			/**
			 * POST /api/subjects/:id/topics
			 * Crea un nuevo tema en una asignatura
			 * Request: { title, description }
			 * Response: { success, id, ...data }
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics$/) &&
				method === "POST"
			) {
				if (!data?.title) {
					return {
						success: false,
						message: "El título es obligatorio",
					};
				}

				const newId = `topic-${Date.now()}`;

				return {
					success: true,
					id: newId,
					...data,
					message: "Tema creado correctamente",
					subtopics: [],
				};
			}

			/**
			 * GET /api/subjects/:id/topics/:topicId
			 * Obtiene los detalles de un tema específico
			 * Response: Topic
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
				method === "GET"
			) {
				// Devuelve directamente el objeto de tema
				return this.mockData.topicDetails;
			}

			/**
			 * PUT /api/subjects/:id/topics/:topicId
			 * Actualiza un tema existente
			 * Request: { title, description }
			 * Response: { success, ...data }
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
				method === "PUT"
			) {
				if (!data?.title) {
					return {
						success: false,
						message: "El título es obligatorio",
					};
				}

				return {
					success: true,
					...data,
					message: "Tema actualizado correctamente",
				};
			}

			/**
			 * PATCH /api/subjects/:id/topics/:topicId
			 * Actualiza parcialmente un tema
			 * Request: { title } o { description } o ambos
			 * Response: { success, ...data }
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
				method === "PATCH"
			) {
				return {
					success: true,
					...data,
					message: "Tema actualizado correctamente",
				};
			}

			/**
			 * DELETE /api/subjects/:id/topics/:topicId
			 * Elimina un tema
			 * Response: { success, message }
			 */
			if (
				endpoint.match(/\/api\/subjects\/[\w-]+\/topics\/[\w-]+$/) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Tema eliminado correctamente",
				};
			}

			// ==========================================
			// ============ SECCIÓN SUBTEMAS ============
			// ==========================================

			/**
			 * GET /api/subjects/:id/topics/:topicId/subtopics
			 * Obtiene todos los subtemas de un tema
			 * Response: { success, subtopics }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics$/
				) &&
				method === "GET"
			) {
				return {
					success: true,
					subtopics: this.mockData.topicDetails.subtopics || [],
				};
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/subtopics
			 * Crea un nuevo subtema en un tema
			 * Request: { title, description }
			 * Response: { success, id, ...data }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics$/
				) &&
				method === "POST"
			) {
				if (!data?.title) {
					return {
						success: false,
						message: "El título es obligatorio",
					};
				}

				const newId = `subtopic-${Date.now()}`;

				return {
					success: true,
					id: newId,
					...data,
					message: "Subtema creado correctamente",
				};
			}

			/**
			 * GET /api/subjects/:id/topics/:topicId/subtopics/:subtopicId
			 * Obtiene los detalles de un subtema específico
			 * Response: Subtopic
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+$/
				) &&
				method === "GET"
			) {
				return this.mockData.subtopicDetails;
			}

			/**
			 * PUT /api/subjects/:id/topics/:topicId/subtopics/:subtopicId
			 * Actualiza un subtema existente
			 * Request: { title, description }
			 * Response: { success, ...data }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+$/
				) &&
				method === "PUT"
			) {
				if (!data) {
					return {
						success: false,
						message: "No se proporcionaron datos para actualizar",
					};
				}

				return {
					success: true,
					...data,
					message: "Subtema actualizado correctamente",
				};
			}

			/**
			 * DELETE /api/subjects/:id/topics/:topicId/subtopics/:subtopicId
			 * Elimina un subtema
			 * Response: { success, message }
			 */
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

			/**
			 * PUT /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/content
			 * Actualiza el contenido de un subtema
			 * Request: { content }
			 * Response: { success, content, updatedAt }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/content$/
				) &&
				method === "PUT"
			) {
				if (!data?.content) {
					return {
						success: false,
						message: "El contenido es obligatorio",
					};
				}

				return {
					success: true,
					content: data.content,
					updatedAt: new Date().toISOString(),
					message: "Contenido actualizado correctamente",
				};
			}

			// ==========================================
			// ====== SECCIÓN ARCHIVOS DE SUBTEMAS ======
			// ==========================================

			/**
			 * POST /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/files
			 * Sube un archivo a un subtema
			 * Request: formData con el archivo
			 * Response: { success, id, fileName, fileType, fileSize }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/files$/
				) &&
				method === "POST"
			) {
				if (!data) {
					return {
						success: false,
						message: "No se proporcionó ningún archivo",
					};
				}

				// En desarrollo simulamos el ID del archivo
				const fileId = `file-${Date.now()}`;

				return {
					success: true,
					id: fileId,
					...data,
					message: "Archivo subido correctamente",
				};
			}

			/**
			 * DELETE /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/files/:fileId
			 * Elimina un archivo de un subtema
			 * Response: { success, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/files\/[\w-]+$/
				) &&
				method === "DELETE"
			) {
				return {
					success: true,
					message: "Archivo eliminado correctamente",
				};
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/videos
			 * Añade una URL de video a un subtema
			 * Request: { url, platform }
			 * Response: { success, id, url, platform }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/videos$/
				) &&
				method === "POST"
			) {
				if (!data?.url) {
					return {
						success: false,
						message: "La URL del video es obligatoria",
					};
				}

				// En desarrollo simulamos el ID del video
				const videoId = `video-${Date.now()}`;

				return {
					success: true,
					id: videoId,
					...data,
					message: "URL de video añadida correctamente",
				};
			}

			// ==========================================
			// =========== SECCIÓN PREGUNTAS ============
			// ==========================================

			/**
			 * GET /api/subjects/:id/topics/:topicId/questions
			 * Obtiene todas las preguntas de un tema
			 * Response: [Question]
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questions$/
				) &&
				method === "GET"
			) {
				return this.mockData.questionsHttp;
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/questions
			 * Crea una nueva pregunta en un tema
			 * Request: { text, type, difficulty, choices }
			 * Response: { success, id, ...data }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questions$/
				) &&
				method === "POST"
			) {
				if (!data?.text || !data?.type) {
					return {
						success: false,
						message: "El texto y tipo de pregunta son obligatorios",
					};
				}

				const newId = `question-${Date.now()}`;

				return {
					success: true,
					id: newId,
					...data,
					createdAt: new Date().toISOString(),
					verified: false,
					rejected: false,
					message: "Pregunta creada correctamente",
				};
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/questions/verify
			 * Verifica o rechaza una pregunta
			 * Request: { questionId, isValid }
			 * Response: { success, questionId, verified, rejected, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questions\/verify$/
				) &&
				method === "POST"
			) {
				if (!data?.questionId) {
					return {
						success: false,
						message: "ID de pregunta no proporcionado",
					};
				}

				const isValid = data.isValid === true;

				// En un backend real, aquí se actualizaría la base de datos
				// Para la simulación, ya actualizamos el objeto en la implementación de simulateApiCall

				return {
					success: true,
					questionId: data.questionId,
					verified: isValid,
					rejected: !isValid,
					message: isValid
						? "Pregunta verificada correctamente"
						: "Pregunta rechazada correctamente",
				};
			}

			/**
			 * DELETE /api/subjects/:id/topics/:topicId/questions/:questionId
			 * Elimina una pregunta
			 * Response: { success, message }
			 */
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

			/**
			 * POST /api/subjects/:id/topics/:topicId/download-questions
			 * Descarga preguntas en un formato específico
			 * Request: { questionIds, format }
			 * Response: { success, format, questionIds, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/download-questions$/
				) &&
				method === "POST"
			) {
				if (!data?.questionIds || !data?.format) {
					return {
						success: false,
						message: "IDs de preguntas y formato son obligatorios",
					};
				}

				return {
					success: true,
					format: data.format,
					questionIds: data.questionIds,
					message: `Preguntas descargadas en formato ${data.format}`,
				};
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/generate-questions
			 * Genera nuevas preguntas automáticamente
			 * Request: { count, difficulty, type }
			 * Response: { success, questions, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/generate-questions$/
				) &&
				method === "POST"
			) {
				const count = data?.count || 5;
				const difficulty = data?.difficulty || "FÁCIL";

				// Generar preguntas simuladas
				const newQuestions = Array.from(
					{ length: count },
					(_, index) => ({
						id: `question-new-${Date.now()}-${index}`,
						text: `Nueva pregunta generada #${
							index + 1
						} sobre ${difficulty}`,
						type: "Opción múltiple",
						difficulty:
							difficulty === "FÁCIL"
								? "Fácil"
								: difficulty === "INTERMEDIO"
								? "Medio"
								: "Avanzado",
						createdAt: new Date().toISOString(),
						verified: false,
						rejected: false,
						choices: [
							{
								text: "Opción correcta generada",
								isCorrect: true,
							},
							{ text: "Opción incorrecta 1", isCorrect: false },
							{ text: "Opción incorrecta 2", isCorrect: false },
							{ text: "Opción incorrecta 3", isCorrect: false },
						],
					})
				);

				// Añadir las nuevas preguntas a nuestra colección simulada
				if (this.mockData.questionsHttp) {
					this.mockData.questionsHttp = [
						...newQuestions,
						...this.mockData.questionsHttp,
					];
				}

				return {
					success: true,
					questions: newQuestions,
					message: `${count} preguntas generadas correctamente`,
				};
			}

			// ==========================================
			// ====== SECCIÓN PREGUNTAS DE SUBTEMAS =====
			// ==========================================

			/**
			 * GET /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/questions
			 * Obtiene las preguntas específicas de un subtema
			 * Response: [Question]
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/questions$/
				) &&
				method === "GET"
			) {
				return this.mockData.subtopicDetails.questions || [];
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/generate-questions
			 * Genera preguntas para un subtema específico
			 * Request: { count, difficulty }
			 * Response: { success, questions, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/generate-questions$/
				) &&
				method === "POST"
			) {
				const count = data?.count || 3;
				const difficulty = data?.difficulty || "FÁCIL";

				// Generar preguntas simuladas para el subtema
				const newQuestions = Array.from(
					{ length: count },
					(_, index) => ({
						id: `q-subtopic-new-${Date.now()}-${index}`,
						text: `Nueva pregunta generada #${
							index + 1
						} para el subtema`,
						type: "Opción múltiple",
						difficulty:
							difficulty === "FÁCIL"
								? "Fácil"
								: difficulty === "INTERMEDIO"
								? "Medio"
								: "Avanzado",
						createdAt: new Date().toISOString(),
						verified: false,
						rejected: false,
						choices: [
							{
								text: "Opción correcta generada",
								isCorrect: true,
							},
							{ text: "Opción incorrecta 1", isCorrect: false },
							{ text: "Opción incorrecta 2", isCorrect: false },
							{ text: "Opción incorrecta 3", isCorrect: false },
						],
					})
				);

				// Añadir las nuevas preguntas a nuestro subtema simulado
				if (this.mockData.subtopicDetails.questions) {
					this.mockData.subtopicDetails.questions = [
						...newQuestions,
						...this.mockData.subtopicDetails.questions,
					];
				} else {
					this.mockData.subtopicDetails.questions = newQuestions;
				}

				return {
					success: true,
					questions: newQuestions,
					message: `${count} preguntas generadas correctamente para el subtema`,
				};
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/questions/verify
			 * Verifica o rechaza una pregunta de un subtema
			 * Request: { questionId, isValid }
			 * Response: { success, questionId, verified, rejected, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/questions\/verify$/
				) &&
				method === "POST"
			) {
				const { questionId, isValid } = data;

				// Actualizar estado de verificación de la pregunta
				if (this.mockData.subtopicDetails.questions) {
					const questionIndex =
						this.mockData.subtopicDetails.questions.findIndex(
							(q) => q.id === questionId
						);

					if (questionIndex >= 0) {
						this.mockData.subtopicDetails.questions[
							questionIndex
						].verified = isValid;
						this.mockData.subtopicDetails.questions[
							questionIndex
						].rejected = !isValid;
					}
				}

				return {
					success: true,
					questionId,
					verified: isValid,
					rejected: !isValid,
					message: isValid
						? "Pregunta verificada correctamente"
						: "Pregunta rechazada correctamente",
				};
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/subtopics/:subtopicId/download-questions
			 * Descarga preguntas de un subtema en un formato específico
			 * Request: { questionIds, format }
			 * Response: { success, format, questionIds, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/download-questions$/
				) &&
				method === "POST"
			) {
				return {
					success: true,
					format: data.format,
					questionIds: data.questionIds,
					message: `Preguntas del subtema descargadas en formato ${data.format}`,
				};
			}

			// ==========================================
			// ========= SECCIÓN CUESTIONARIOS ==========
			// ==========================================

			/**
			 * GET /api/subjects/:id/topics/:topicId/questionnaires
			 * Obtiene todos los cuestionarios de un tema
			 * Response: [Questionnaire]
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires$/
				) &&
				method === "GET"
			) {
				return this.mockData.questionnairesHttp;
			}

			/**
			 * POST /api/subjects/:id/topics/:topicId/questionnaires
			 * Crea un nuevo cuestionario
			 * Request: { title, description, questionIds }
			 * Response: { success, id, ...data }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires$/
				) &&
				method === "POST"
			) {
				if (!data?.title) {
					return {
						success: false,
						message: "El título es obligatorio",
					};
				}

				const newId = `questionnaire-${Date.now()}`;

				return {
					success: true,
					id: newId,
					...data,
					createdAt: new Date().toISOString(),
					downloadCount: 0,
					message: "Cuestionario creado correctamente",
				};
			}

			/**
			 * DELETE /api/subjects/:id/topics/:topicId/questionnaires/:questionnaireId
			 * Elimina un cuestionario
			 * Response: { success, message }
			 */
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

			/**
			 * POST /api/subjects/:id/topics/:topicId/generate-questionnaire
			 * Genera un cuestionario a partir de preguntas seleccionadas
			 * Request: { title, description, questionIds }
			 * Response: { success, id, title, description, questionIds, createdAt, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/generate-questionnaire$/
				) &&
				method === "POST"
			) {
				if (
					!data?.title ||
					!data?.questionIds ||
					data.questionIds.length === 0
				) {
					return {
						success: false,
						message: "Título y preguntas son obligatorios",
					};
				}

				const newId = `questionnaire-${Date.now()}`;

				// En un backend real, aquí se crearía el cuestionario en la BD

				return {
					success: true,
					id: newId,
					title: data.title,
					description: data.description || "",
					questionIds: data.questionIds,
					questions: data.questionIds.length,
					createdAt: new Date().toISOString(),
					downloadCount: 0,
					message: "Cuestionario generado correctamente",
				};
			}

			/**
			 * GET /api/subjects/:id/topics/:topicId/questionnaires/:questionnaireId/download
			 * Descarga un cuestionario en un formato específico
			 * Query params: format (pdf, moodle, etc.)
			 * Response: { success, format, message }
			 */
			if (
				endpoint.match(
					/\/api\/subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires\/[\w-]+\/download/
				)
			) {
				const format = endpoint.includes("format=")
					? endpoint.split("format=")[1]
					: "pdf";

				// En un backend real, aquí se generaría el archivo y se incrementaría el contador

				return {
					success: true,
					format,
					message: `Cuestionario descargado en formato ${format}`,
				};
			}

			// Si llegamos aquí, el endpoint no está implementado
			return {
				success: false,
				error: "Endpoint no implementado en simulación",
				endpoint,
				method,
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

	// ==========================================
	// =========== MÉTODOS DE UTILIDAD ==========
	// ==========================================

	/**
	 * Activa o desactiva el logging de peticiones
	 * @param {boolean} enable - True para activar, false para desactivar
	 */
	setLogging(enable) {
		this.enableLogging = enable;
		console.log(`ℹ️ API: Logging ${enable ? "activado" : "desactivado"}`);
	}

	/**
	 * Limpia la caché de respuestas
	 */
	clearCache() {
		this.responseCache.clear();
		console.log(
			`ℹ️ API: Caché limpiada (${this.responseCache.size} entradas)`
		);
	}

	/**
	 * Configura el retraso simulado para peticiones
	 * @param {number} delay - Retraso en milisegundos
	 */
	setSimulationDelay(delay) {
		this.simulationDelay = delay;
		console.log(`ℹ️ API: Retraso de simulación configurado a ${delay}ms`);
	}
}

// Exportar una única instancia para toda la aplicación
const apiService = new ApiService();

export default apiService;
