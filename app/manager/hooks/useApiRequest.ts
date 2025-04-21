// /app/manager/hooks/useApiRequest.ts
import { useState, useEffect, useRef } from "react";
import apiService from "../services/apiService";

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

			// TODO: Cuando implementes la API real, modifica esta llamada
			// para usar la API real en lugar de la simulación
			const response = await apiService.simulateApiCall(
				targetEndpoint,
				method,
				requestData,
				800,
				forceCall
			);

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
