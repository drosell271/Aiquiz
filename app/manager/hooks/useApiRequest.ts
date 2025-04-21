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

	// Función para realizar la solicitud
	const makeRequest = async (
		requestData: any = null,
		forceCall: boolean = false
	) => {
		setLoading(true);
		setError(null);

		try {
			// TODO: Cuando implementes la API real, modifica esta llamada
			// para usar la API real en lugar de la simulación
			const response = await apiService.simulateApiCall(
				endpoint,
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
		}
	};

	// Cargar datos al montar el componente si loadOnMount es true
	useEffect(() => {
		if (loadOnMount && !dataFetchedRef.current) {
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
