// /app/manager/hooks/useApiRequest.ts
import { useState, useEffect, useRef } from "react";
import apiService from "../services/index";

/**
 * Mapea endpoints a métodos del servicio real de API
 * @param {string} endpoint - Endpoint de la API
 * @param {string} method - Método HTTP
 * @param {any} data - Datos para la petición
 * @returns {Promise<any>} Respuesta de la API
 */
async function mapEndpointToRealApi(endpoint: string, method: string, data: any) {
	// Parsear el endpoint para extraer IDs y determinar el método correcto
	const parts = endpoint.split('/').filter(Boolean);
	
	// Endpoints de autenticación
	if (endpoint === '/api/auth/login' && method === 'POST') {
		return await apiService.login(data.email, data.password);
	}
	
	if (endpoint === '/api/manager/auth/login' && method === 'POST') {
		return await apiService.login(data.email, data.password);
	}
	
	if (endpoint === '/api/auth/recovery' && method === 'POST') {
		return await apiService.recoverPassword(data.email);
	}
	
	if (endpoint === '/api/manager/auth/recovery' && method === 'POST') {
		return await apiService.recoverPassword(data.email);
	}
	
	if (endpoint === '/api/auth/reset-password' && method === 'POST') {
		return await apiService.resetPassword(data.token, data.newPassword);
	}
	
	if (endpoint === '/api/manager/auth/reset-password' && method === 'POST') {
		return await apiService.resetPassword(data.token, data.newPassword);
	}
	
	if (endpoint === '/api/manager/auth/me' && method === 'GET') {
		return await apiService.getUserProfile();
	}
	
	if (endpoint === '/api/manager/auth/me' && method === 'PUT') {
		return await apiService.updateUserProfile(data);
	}

	// Endpoint de cambio de contraseña
	if (endpoint === '/api/account/password' && method === 'PUT') {
		return await apiService.changePassword(data);
	}
	
	// Endpoints de asignaturas
	if (endpoint === '/api/subjects' && method === 'GET') {
		return await apiService.getSubjects();
	}
	
	if (endpoint === '/api/manager/subjects' && method === 'GET') {
		return await apiService.getSubjects();
	}
	
	if (endpoint === '/api/subjects' && method === 'POST') {
		return await apiService.createSubject(data);
	}
	
	if (endpoint === '/api/manager/subjects' && method === 'POST') {
		return await apiService.createSubject(data);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+$/) && method === 'GET') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		return await apiService.getSubject(subjectId);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+$/) && method === 'PUT') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		return await apiService.updateSubject(subjectId, data);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+$/) && method === 'DELETE') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		return await apiService.deleteSubject(subjectId);
	}

	// Endpoints de profesores
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/professors$/) && method === 'POST') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		return await apiService.addProfessorToSubject(subjectId, data);
	}

	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/professors\/[\w-]+$/) && method === 'DELETE') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const professorId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		return await apiService.removeProfessorFromSubject(subjectId, professorId);
	}
	
	// Endpoints de temas
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics$/) && method === 'GET') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		return await apiService.getTopics(subjectId);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics$/) && method === 'POST') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		return await apiService.createTopic(subjectId, data);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+$/) && method === 'GET') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		return await apiService.getTopic(subjectId, topicId);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+$/) && method === 'PUT') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		return await apiService.updateTopic(subjectId, topicId, data);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+$/) && method === 'DELETE') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		return await apiService.deleteTopic(subjectId, topicId);
	}
	
	// Endpoints de subtemas
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics$/) && method === 'GET') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		return await apiService.getSubtopics(subjectId, topicId);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics$/) && method === 'POST') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		return await apiService.createSubtopic(subjectId, topicId, data);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+$/) && method === 'GET') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		const subtopicId = endpoint.includes('/manager/') ? parts[7] : parts[6];
		return await apiService.getSubtopic(subjectId, topicId, subtopicId);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+$/) && method === 'PUT') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		const subtopicId = endpoint.includes('/manager/') ? parts[7] : parts[6];
		return await apiService.updateSubtopic(subjectId, topicId, subtopicId, data);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+$/) && method === 'DELETE') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		const subtopicId = endpoint.includes('/manager/') ? parts[7] : parts[6];
		return await apiService.deleteSubtopic(subjectId, topicId, subtopicId);
	}
	
	// Endpoints de archivos y videos
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/files$/) && method === 'POST') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		const subtopicId = endpoint.includes('/manager/') ? parts[7] : parts[6];
		return await apiService.uploadFile(subjectId, topicId, subtopicId, data);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/files$/) && method === 'GET') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		const subtopicId = endpoint.includes('/manager/') ? parts[7] : parts[6];
		return await apiService.getSubtopicFiles(subjectId, topicId, subtopicId);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/files\/[\w-]+$/) && method === 'DELETE') {
		const pathParts = endpoint.split('/').filter(p => p);
		const managerIndex = pathParts.indexOf('manager');
		const baseIndex = managerIndex >= 0 ? managerIndex + 1 : 1; // Skip 'api' and optionally 'manager'
		
		const subjectId = pathParts[baseIndex + 1]; // subjects/[id]
		const topicId = pathParts[baseIndex + 3];   // topics/[id]  
		const subtopicId = pathParts[baseIndex + 5]; // subtopics/[id]
		const fileId = pathParts[baseIndex + 7];     // files/[id]
		
		return await apiService.deleteSubtopicFile(subjectId, topicId, subtopicId, fileId);
	}
	
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/subtopics\/[\w-]+\/videos$/) && method === 'POST') {
		const subjectId = endpoint.includes('/manager/') ? parts[3] : parts[2];
		const topicId = endpoint.includes('/manager/') ? parts[5] : parts[4];
		const subtopicId = endpoint.includes('/manager/') ? parts[7] : parts[6];
		return await apiService.addVideoUrl(subjectId, topicId, subtopicId, data);
	}
	
	// Endpoints de cuestionarios
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/questionnaires$/) && method === 'GET') {
		// Retornar array vacío directamente (sin wrapper de success)
		return [];
	}
	
	// Endpoints de preguntas
	if (endpoint.match(/^\/api\/(manager\/)?subjects\/[\w-]+\/topics\/[\w-]+\/questions$/) && method === 'GET') {
		// Retornar array vacío directamente (sin wrapper de success)
		return [];
	}
	
	// Si no se encuentra el endpoint, lanzar error
	throw new Error(`Endpoint no soportado: ${method} ${endpoint}`);
}

/**
 * Hook personalizado para realizar solicitudes a la API con manejo de estados
 * @param {string} endpoint - Endpoint de la API
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object} initialData - Datos iniciales para el estado
 * @param {boolean} loadOnMount - Si se debe cargar al montar el componente
 * @returns {{ data, loading, error, makeRequest, reset }}
 */
export function useApiRequest(
	endpoint: string,
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
	initialData: any = null,
	loadOnMount: boolean = true
) {
	const [data, setData] = useState(initialData);
	const [loading, setLoading] = useState(loadOnMount);
	const [error, setError] = useState<Error | null>(null);
	const dataFetchedRef = useRef(false);
	const requestInProgressRef = useRef(false);

	// Función para realizar la solicitud
	const makeRequest = async (
		requestData: any = null,
		forceCall: boolean = false,
		customEndpoint: string = ""
	) => {
		// Evitar llamadas simultáneas para el mismo endpoint
		if (requestInProgressRef.current && !forceCall) {
			console.log(
				`⚠️ Request in progress for ${endpoint}, skipping duplicate call`
			);
			return null;
		}

		setLoading(true);
		setError(null);
		requestInProgressRef.current = true;

		try {
			// Usar endpoint personalizado si se proporciona
			const targetEndpoint = customEndpoint
				? (customEndpoint.startsWith('/') ? customEndpoint : `${endpoint}/${customEndpoint}`)
				: endpoint;

			let response;
			
			// Usar la API real o simulada según la configuración
			if (apiService.isRealApi) {
				// Mapear endpoints a métodos del servicio real
				response = await mapEndpointToRealApi(targetEndpoint, method, requestData);
			} else {
				// Usar simulación
				response = await apiService.simulateApiCall(
					targetEndpoint,
					method,
					requestData,
					800,
					forceCall
				);
			}

			setData(response);
			return response;
		} catch (err) {
			const errorObj =
				err instanceof Error ? err : new Error("Error desconocido");
			setError(errorObj);
			throw errorObj;
		} finally {
			setLoading(false);
			requestInProgressRef.current = false;
		}
	};

	// Cargar datos al montar el componente si loadOnMount es true
	useEffect(() => {
		if (loadOnMount && !dataFetchedRef.current && method === "GET") {
			dataFetchedRef.current = true;
			makeRequest();
		}
	}, [endpoint, method, loadOnMount]);

	// Reset de los estados
	const reset = () => {
		setData(initialData);
		setLoading(false);
		setError(null);
		dataFetchedRef.current = false;
	};

	return {
		data,
		loading,
		error,
		makeRequest,
		reset,
	};
}

export default useApiRequest;
