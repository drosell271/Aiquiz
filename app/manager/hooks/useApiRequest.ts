// /app/manager/hooks/useApiRequest.ts
import { useState, useEffect, useRef } from "react";

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
				? `${endpoint
						.split("/")
						.slice(0, -1)
						.join("/")}/${customEndpoint}`
				: endpoint;

			// Crear la URL completa para el endpoint con el nuevo prefijo
			const apiEndpoint = targetEndpoint.replace(
				/^\/api/,
				"/manager/api"
			);

			// Configurar opciones para la solicitud fetch
			const options: RequestInit = {
				method,
				headers: {
					"Content-Type": "application/json",
					// Incluir token de autenticación si está disponible
					...(localStorage.getItem("jwt_token")
						? {
								Authorization: `Bearer ${localStorage.getItem(
									"jwt_token"
								)}`,
						  }
						: {}),
				},
			};

			// Añadir cuerpo de la solicitud para métodos que lo requieren
			if (requestData && ["POST", "PUT", "PATCH"].includes(method)) {
				options.body = JSON.stringify(requestData);
			}

			// Realizar la solicitud HTTP real
			const response = await fetch(apiEndpoint, options);
			const responseData = await response.json();

			// Comprobar si la respuesta es exitosa
			if (!response.ok) {
				throw new Error(
					responseData.message || "Error en la solicitud"
				);
			}

			setData(responseData);
			return responseData;
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
