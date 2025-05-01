// app/manager/components/topic/QuestionsTab.tsx
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
	selected?: boolean;
}

interface QuestionsTabProps {
	topicId: string;
	subjectId: string;
}

const QuestionsTab = ({ topicId, subjectId }: QuestionsTabProps) => {
	const { t } = useTranslation();
	const [questions, setQuestions] = useState<Question[]>([]);
	const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
	const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState(false);

	// Estado para modal de generación de cuestionario
	const [showGenerateModal, setShowGenerateModal] = useState(false);
	const [generationTitle, setGenerationTitle] = useState("");
	const [generationDescription, setGenerationDescription] = useState("");

	// API para obtener preguntas
	const {
		data: questionsData,
		loading,
		error,
		makeRequest: fetchQuestions,
	} = useApiRequest(
		`/api/subjects/${subjectId}/topics/${topicId}/questions`,
		"GET",
		// Datos de ejemplo para desarrollo
		[
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
			{
				id: "q6",
				text: "¿Qué atributos son obligatorios en la etiqueta <img>?",
				type: "Opción múltiple",
				difficulty: "Medio",
				createdAt: "2023-12-05T08:30:00Z",
			},
			{
				id: "q7",
				text: "¿Cuál es la diferencia entre las etiquetas <div> y <span>?",
				type: "Opción múltiple",
				difficulty: "Medio",
				createdAt: "2023-12-10T14:20:00Z",
			},
			{
				id: "q8",
				text: "¿Cómo se crea una lista ordenada en HTML?",
				type: "Opción múltiple",
				difficulty: "Fácil",
				createdAt: "2023-12-15T11:45:00Z",
			},
			{
				id: "q9",
				text: "Explica la importancia de la accesibilidad web y cómo implementarla en HTML",
				type: "Desarrollo",
				difficulty: "Avanzado",
				createdAt: "2024-01-05T10:15:00Z",
			},
			{
				id: "q10",
				text: "¿Qué son los elementos semánticos en HTML5 y cómo ayudan a la estructura del documento?",
				type: "Desarrollo",
				difficulty: "Medio",
				createdAt: "2024-01-10T09:30:00Z",
			},
		],
		true
	);

	// API para generar cuestionario desde preguntas seleccionadas
	const {
		makeRequest: generateQuestionnaire,
		loading: generatingQuestionnaire,
	} = useApiRequest(
		`/api/subjects/${subjectId}/topics/${topicId}/generate-questionnaire`,
		"POST",
		null,
		false
	);

	// API para descargar preguntas seleccionadas
	const { makeRequest: downloadQuestions, loading: downloadingQuestions } =
		useApiRequest(
			`/api/subjects/${subjectId}/topics/${topicId}/download-questions`,
			"POST",
			null,
			false
		);

	useEffect(() => {
		if (questionsData) {
			const questionsWithSelected = questionsData.map((q: Question) => ({
				...q,
				selected: selectedQuestions.includes(q.id),
			}));
			setQuestions(questionsWithSelected);
			setFilteredQuestions(questionsWithSelected);
		}
	}, [questionsData, selectedQuestions]);

	const handleSearch = (query: string) => {
		if (!query) {
			setFilteredQuestions(questions);
			return;
		}

		const filtered = questions.filter(
			(question) =>
				question.text.toLowerCase().includes(query.toLowerCase()) ||
				question.type.toLowerCase().includes(query.toLowerCase()) ||
				question.difficulty.toLowerCase().includes(query.toLowerCase())
		);

		setFilteredQuestions(filtered);
	};

	const handleSelectQuestion = (id: string) => {
		setSelectedQuestions((prev) => {
			if (prev.includes(id)) {
				return prev.filter((qId) => qId !== id);
			} else {
				return [...prev, id];
			}
		});
	};

	const handleSelectAll = () => {
		setSelectAll(!selectAll);
		if (!selectAll) {
			// Seleccionar todas las preguntas filtradas
			setSelectedQuestions(filteredQuestions.map((q) => q.id));
		} else {
			// Deseleccionar todas
			setSelectedQuestions([]);
		}
	};

	const handleGenerateQuestionnaire = async () => {
		if (selectedQuestions.length === 0 || !generationTitle.trim()) return;

		try {
			const response = await generateQuestionnaire({
				title: generationTitle,
				description: generationDescription,
				questionIds: selectedQuestions,
			});

			if (response.success) {
				// Redirigir a la pestaña de cuestionarios o mostrar mensaje de éxito
				setShowGenerateModal(false);
				setGenerationTitle("");
				setGenerationDescription("");
				// Opcional: deseleccionar todas las preguntas
				setSelectedQuestions([]);
				setSelectAll(false);
			}
		} catch (error) {
			console.error("Error al generar cuestionario:", error);
		}
	};

	const handleDownloadQuestions = async (format: string) => {
		if (selectedQuestions.length === 0) return;

		try {
			await downloadQuestions({
				questionIds: selectedQuestions,
				format,
			});

			// Simular descarga en desarrollo
			console.log(
				`Descargando ${selectedQuestions.length} preguntas en formato ${format}`
			);

			// En producción, aquí se procesaría la respuesta para descargar el archivo
		} catch (error) {
			console.error("Error al descargar preguntas:", error);
		}
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

				<div className="flex space-x-2">
					{selectedQuestions.length > 0 && (
						<>
							<div className="relative inline-block text-left">
								<button
									className="bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
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
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									{t("topicDetail.download") || "Descargar"}
									<svg
										className="w-4 h-4 ml-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
								<div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 hidden group-hover:block">
									<div className="py-1">
										<button
											onClick={() =>
												handleDownloadQuestions("pdf")
											}
											className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
											disabled={downloadingQuestions}
										>
											PDF
										</button>
										<button
											onClick={() =>
												handleDownloadQuestions(
													"moodle"
												)
											}
											className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
											disabled={downloadingQuestions}
										>
											Moodle XML
										</button>
									</div>
								</div>
							</div>

							<button
								onClick={() => setShowGenerateModal(true)}
								className="bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
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
										d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								{t("topicDetail.generateQuestionnaire") ||
									"Generar cuestionario"}
							</button>
						</>
					)}
				</div>
			</div>

			<div className="bg-white shadow overflow-hidden rounded-md">
				{loading ? (
					<div className="flex justify-center my-8">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
					</div>
				) : error ? (
					<div className="p-4 bg-red-100 text-red-700">
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
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									<div className="flex items-center">
										<input
											type="checkbox"
											className="h-4 w-4 text-blue-600 border-gray-300 rounded"
											checked={selectAll}
											onChange={handleSelectAll}
										/>
									</div>
								</th>
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
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredQuestions.map((question) => (
								<tr
									key={question.id}
									className={`hover:bg-gray-50 ${
										selectedQuestions.includes(question.id)
											? "bg-blue-50"
											: ""
									}`}
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<input
												type="checkbox"
												className="h-4 w-4 text-blue-600 border-gray-300 rounded"
												checked={selectedQuestions.includes(
													question.id
												)}
												onChange={() =>
													handleSelectQuestion(
														question.id
													)
												}
											/>
										</div>
									</td>
									<td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md truncate">
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
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Modal para generar cuestionario */}
			{showGenerateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">
								{t("topicDetail.generateQuestionnaire") ||
									"Generar cuestionario"}
							</h2>
							<button
								onClick={() => setShowGenerateModal(false)}
								className="text-gray-500 hover:text-gray-700"
								disabled={generatingQuestionnaire}
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						<p className="mb-4 text-sm text-gray-600">
							{t("topicDetail.selectedQuestionsCount", {
								count: selectedQuestions.length,
							}) ||
								`Preguntas seleccionadas: ${selectedQuestions.length}`}
						</p>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleGenerateQuestionnaire();
							}}
						>
							<div className="mb-4">
								<label
									htmlFor="generationTitle"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									{t("topicDetail.title") || "Título"}
								</label>
								<input
									type="text"
									id="generationTitle"
									value={generationTitle}
									onChange={(e) =>
										setGenerationTitle(e.target.value)
									}
									className="w-full p-2 border rounded-md"
									required
									disabled={generatingQuestionnaire}
								/>
							</div>

							<div className="mb-6">
								<label
									htmlFor="generationDescription"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									{t("topicDetail.description") ||
										"Descripción"}
								</label>
								<textarea
									id="generationDescription"
									value={generationDescription}
									onChange={(e) =>
										setGenerationDescription(e.target.value)
									}
									className="w-full p-2 border rounded-md h-32"
									disabled={generatingQuestionnaire}
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<button
									type="button"
									onClick={() => setShowGenerateModal(false)}
									className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
									disabled={generatingQuestionnaire}
								>
									{t("topicDetail.cancel") || "Cancelar"}
								</button>
								<button
									type="submit"
									disabled={
										generatingQuestionnaire ||
										!generationTitle.trim()
									}
									className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 flex items-center"
								>
									{generatingQuestionnaire ? (
										<>
											<svg
												className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											{t("common.processing") ||
												"Procesando..."}
										</>
									) : (
										t("topicDetail.generate") || "Generar"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default QuestionsTab;
