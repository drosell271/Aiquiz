import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useApiRequest from "../../hooks/useApiRequest";
import SearchBar from "../subject/SearchBar";

interface Question {
	id: string;
	text: string;
	type: string;
	difficulty: string;
	createdAt: string;
}

interface QuestionsTabProps {
	topicId: string;
	subjectId: string;
}

const QuestionsTab = ({ topicId, subjectId }: QuestionsTabProps) => {
	const { t } = useTranslation();
	const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

	// Datos simulados para pruebas mientras no tenemos la API real
	const mockQuestions = [
		{
			id: "q1",
			text: "¿Cuál es la estructura básica de un documento HTML?",
			type: "Opción múltiple",
			difficulty: "Fácil",
			createdAt: "2023-11-15T10:00:00Z",
		},
		{
			id: "q2",
			text: "¿Qué significa HTML?",
			type: "Opción múltiple",
			difficulty: "Fácil",
			createdAt: "2023-11-16T11:30:00Z",
		},
		{
			id: "q3",
			text: "Explica la diferencia entre etiquetas semánticas y no semánticas en HTML",
			type: "Desarrollo",
			difficulty: "Medio",
			createdAt: "2023-11-18T14:20:00Z",
		},
		{
			id: "q4",
			text: "¿Cómo se crea un formulario en HTML?",
			type: "Opción múltiple",
			difficulty: "Medio",
			createdAt: "2023-11-20T09:15:00Z",
		},
		{
			id: "q5",
			text: "Explica el uso de la etiqueta 'meta' en HTML y sus atributos principales",
			type: "Desarrollo",
			difficulty: "Avanzado",
			createdAt: "2023-11-22T16:45:00Z",
		},
	];

	// Llamada a la API para obtener preguntas del tema
	const {
		data: questions,
		loading,
		error,
		makeRequest: refreshQuestions,
	} = useApiRequest(
		`/api/subjects/${subjectId}/topics/${topicId}/questions`,
		"GET",
		mockQuestions,
		true
	);

	// TODO: Implementar llamada real a la API para obtener preguntas

	useEffect(() => {
		if (questions) {
			setFilteredQuestions(questions);
		}
	}, [questions]);

	const handleSearch = (query: string) => {
		if (!query) {
			setFilteredQuestions(questions || []);
			return;
		}

		const filtered = questions?.filter(
			(question) =>
				question.text.toLowerCase().includes(query.toLowerCase()) ||
				question.type.toLowerCase().includes(query.toLowerCase())
		);

		setFilteredQuestions(filtered || []);
	};

	const handleAddQuestion = () => {
		// TODO: Implementar lógica para añadir una nueva pregunta
		console.log("Añadir nueva pregunta");
	};

	const handleViewQuestion = (questionId: string) => {
		// TODO: Implementar lógica para ver detalle de pregunta
		console.log(`Ver pregunta con ID: ${questionId}`);
	};

	const handleEditQuestion = (questionId: string) => {
		// TODO: Implementar lógica para editar pregunta
		console.log(`Editar pregunta con ID: ${questionId}`);
	};

	const handleDeleteQuestion = (questionId: string) => {
		// TODO: Implementar lógica para eliminar pregunta
		console.log(`Eliminar pregunta con ID: ${questionId}`);
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<SearchBar
					placeholder={
						t("topicDetail.searchQuestionsPlaceholder") ||
						"Buscar preguntas..."
					}
					onSearch={handleSearch}
				/>

				<button
					onClick={handleAddQuestion}
					className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center disabled:opacity-50"
					disabled={loading}
				>
					<svg
						className="w-5 h-5 mr-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					{t("topicDetail.newQuestion") || "Nueva pregunta"}
				</button>
			</div>

			{loading ? (
				<div className="flex justify-center my-8">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
				</div>
			) : error ? (
				<div className="bg-red-100 p-4 rounded-md text-red-700">
					{t("topicDetail.errorLoadingQuestions") ||
						"Error al cargar las preguntas"}
				</div>
			) : filteredQuestions.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>
						{t("topicDetail.noQuestionsFound") ||
							"No se encontraron preguntas"}
					</p>
				</div>
			) : (
				<div className="bg-white shadow overflow-hidden rounded-md">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.questionText") ||
										"Pregunta"}
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.type") || "Tipo"}
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.difficulty") ||
										"Dificultad"}
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.createdAt") ||
										"Fecha de creación"}
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.actions") || "Acciones"}
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredQuestions.map((question) => (
								<tr
									key={question.id}
									className="hover:bg-gray-50"
								>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">
										{question.text}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{question.type}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												question.difficulty === "Fácil"
													? "bg-green-100 text-green-800"
													: question.difficulty ===
													  "Medio"
													? "bg-yellow-100 text-yellow-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{question.difficulty}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{new Date(
											question.createdAt
										).toLocaleDateString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<div className="flex justify-end space-x-3">
											<button
												onClick={() =>
													handleViewQuestion(
														question.id
													)
												}
												className="text-blue-600 hover:text-blue-900"
												title={
													t("topicDetail.view") ||
													"Ver"
												}
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
													/>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
													/>
												</svg>
											</button>
											<button
												onClick={() =>
													handleEditQuestion(
														question.id
													)
												}
												className="text-indigo-600 hover:text-indigo-900"
												title={
													t("topicDetail.edit") ||
													"Editar"
												}
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>
											<button
												onClick={() =>
													handleDeleteQuestion(
														question.id
													)
												}
												className="text-red-600 hover:text-red-900"
												title={
													t("topicDetail.delete") ||
													"Eliminar"
												}
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default QuestionsTab;
