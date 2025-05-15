// /app/manager/components/topic/QuestionsTab.tsx
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useApiRequest from "../../hooks/useApiRequest";
import SearchBar from "../subject/SearchBar";
import { ConfirmationModal } from "../common";
import QuestionStatusFilter, { StatusFilter } from "./QuestionStatusFilter";
import GenerateQuestionsModal from "./GenerateQuestionsModal";

interface Choice {
	text: string;
	isCorrect: boolean;
}

interface Question {
	id: string;
	text: string;
	type: string;
	difficulty: string;
	createdAt: string;
	choices?: Choice[];
	verified?: boolean;
	rejected?: boolean;
}

interface QuestionsTabProps {
	topicId: string;
	subjectId: string;
}

/**
 * Componente de pestaña para gestionar preguntas
 */
const QuestionsTab: React.FC<QuestionsTabProps> = ({ topicId, subjectId }) => {
	const { t } = useTranslation();

	// Estados para los datos
	const [questions, setQuestions] = useState<Question[]>([]);
	const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

	// Estados para la selección
	const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState<boolean>(false);

	// Estados para UI
	const [showFormatOptions, setShowFormatOptions] = useState<boolean>(false);
	const [showQuestionDetails, setShowQuestionDetails] = useState<
		string | null
	>(null);
	const [expandAllQuestions, setExpandAllQuestions] =
		useState<boolean>(false);
	const [statusFilter, setStatusFilter] =
		useState<StatusFilter>("unverified");
	const [searchQuery, setSearchQuery] = useState<string>("");

	// Estados para modales
	const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
	const [generationTitle, setGenerationTitle] = useState<string>("");
	const [generationDescription, setGenerationDescription] =
		useState<string>("");
	const [showGenerateQuestionsModal, setShowGenerateQuestionsModal] =
		useState<boolean>(false);

	// API para obtener preguntas
	const {
		data: questionsData,
		loading,
		error,
		makeRequest: fetchQuestions,
	} = useApiRequest(
		`/api/subjects/${subjectId}/topics/${topicId}/questions`,
		"GET",
		null,
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

	// API para generar nuevas preguntas
	const {
		makeRequest: generateNewQuestions,
		loading: generatingNewQuestions,
	} = useApiRequest(
		`/api/subjects/${subjectId}/topics/${topicId}/generate-questions`,
		"POST",
		null,
		false
	);

	// API para verificar o rechazar preguntas
	const { makeRequest: verifyQuestion, loading: verifyingQuestion } =
		useApiRequest(
			`/api/subjects/${subjectId}/topics/${topicId}/questions/verify`,
			"POST",
			null,
			false
		);

	/**
	 * Inicializa las preguntas a partir de los datos obtenidos
	 */
	useEffect(() => {
		if (questionsData) {
			const questionsWithSelected = questionsData.map((q: Question) => ({
				...q,
				selected: selectedQuestions.includes(q.id),
				verified: q.verified !== undefined ? q.verified : false,
				rejected: q.rejected !== undefined ? q.rejected : false,
			}));
			setQuestions(questionsWithSelected);
			applyFilters(questionsWithSelected, searchQuery, statusFilter);
		}
	}, [questionsData, selectedQuestions]);

	/**
	 * Aplica filtros por estado y búsqueda
	 */
	const applyFilters = useCallback(
		(questionsList: Question[], query: string, filter: StatusFilter) => {
			let filtered = [...questionsList];

			// Filtrar por estado
			if (filter !== "all") {
				if (filter === "unverified") {
					filtered = filtered.filter(
						(q) => !q.verified && !q.rejected
					);
				} else if (filter === "verified") {
					filtered = filtered.filter((q) => q.verified);
				} else if (filter === "rejected") {
					filtered = filtered.filter((q) => q.rejected);
				}
			}

			// Filtrar por búsqueda
			if (query) {
				const queryLower = query.toLowerCase();
				filtered = filtered.filter(
					(question) =>
						question.text.toLowerCase().includes(queryLower) ||
						question.type.toLowerCase().includes(queryLower) ||
						question.difficulty.toLowerCase().includes(queryLower)
				);
			}

			setFilteredQuestions(filtered);
		},
		[]
	);

	/**
	 * Maneja la búsqueda de preguntas
	 */
	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			applyFilters(questions, query, statusFilter);
		},
		[questions, statusFilter, applyFilters]
	);

	/**
	 * Maneja el cambio de filtro por estado
	 */
	const handleStatusFilterChange = useCallback(
		(filter: StatusFilter) => {
			setStatusFilter(filter);
			applyFilters(questions, searchQuery, filter);
		},
		[questions, searchQuery, applyFilters]
	);

	/**
	 * Maneja la selección de una pregunta
	 */
	const handleSelectQuestion = useCallback((id: string) => {
		setSelectedQuestions((prev) => {
			if (prev.includes(id)) {
				return prev.filter((qId) => qId !== id);
			} else {
				return [...prev, id];
			}
		});
	}, []);

	/**
	 * Maneja la selección/deselección de todas las preguntas
	 */
	const handleSelectAll = useCallback(() => {
		setSelectAll(!selectAll);
		if (!selectAll) {
			// Seleccionar todas las preguntas filtradas
			setSelectedQuestions(filteredQuestions.map((q) => q.id));
		} else {
			// Deseleccionar todas
			setSelectedQuestions([]);
		}
	}, [selectAll, filteredQuestions]);

	/**
	 * Alterna la expansión de todas las preguntas
	 */
	const toggleExpandAllQuestions = useCallback(() => {
		setExpandAllQuestions(!expandAllQuestions);
	}, [expandAllQuestions]);

	/**
	 * Alterna la visualización de detalles de una pregunta
	 */
	const handleToggleDetails = useCallback(
		(id: string) => {
			if (expandAllQuestions) return;
			setShowQuestionDetails(showQuestionDetails === id ? null : id);
		},
		[expandAllQuestions, showQuestionDetails]
	);

	/**
	 * Maneja la verificación o rechazo de una pregunta
	 */
	const handleVerifyQuestion = useCallback(
		async (id: string, isValid: boolean) => {
			try {
				// Llamada a la API para verificar/rechazar pregunta
				await verifyQuestion({
					questionId: id,
					isValid,
				});

				// Actualizar estado local
				const updatedQuestions = questions.map((q) =>
					q.id === id
						? { ...q, verified: isValid, rejected: !isValid }
						: q
				);

				setQuestions(updatedQuestions);
				applyFilters(updatedQuestions, searchQuery, statusFilter);
			} catch (error) {
				console.error("Error al verificar pregunta:", error);
			}
		},
		[questions, searchQuery, statusFilter, verifyQuestion, applyFilters]
	);

	/**
	 * Genera un cuestionario a partir de las preguntas seleccionadas
	 */
	const handleGenerateQuestionnaire = useCallback(
		async (title: string, description: string) => {
			if (selectedQuestions.length === 0 || !title.trim()) return;

			try {
				const response = await generateQuestionnaire({
					title: title,
					description: description,
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
		},
		[selectedQuestions, generateQuestionnaire]
	);

	/**
	 * Descarga las preguntas seleccionadas en el formato especificado
	 */
	const handleDownloadQuestions = useCallback(
		async (format: string) => {
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

				// Cerrar menú desplegable
				setShowFormatOptions(false);
			} catch (error) {
				console.error("Error al descargar preguntas:", error);
			}
		},
		[selectedQuestions, downloadQuestions]
	);

	/**
	 * Genera nuevas preguntas
	 */
	const handleGenerateNewQuestions = useCallback(
		async (difficulty: string, count: number) => {
			try {
				const response = await generateNewQuestions({
					difficulty: difficulty,
					count: count,
					type: "URL", // Asumimos que este es el tipo basado en la UI mostrada
				});

				if (response.success && response.questions) {
					// Actualizar con las nuevas preguntas
					await fetchQuestions();
					setShowGenerateQuestionsModal(false);
				}
			} catch (error) {
				console.error("Error al generar nuevas preguntas:", error);
			}
		},
		[generateNewQuestions, fetchQuestions]
	);

	/**
	 * Renderiza los botones de acción para preguntas seleccionadas
	 */
	const renderActionButtons = useCallback(() => {
		if (selectedQuestions.length === 0) return null;

		return (
			<div className="flex space-x-2">
				<div className="relative">
					<button
						className="bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
						onClick={() => setShowFormatOptions(!showFormatOptions)}
						disabled={loading}
						aria-label="Descargar preguntas"
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
							className={`w-4 h-4 ml-1 transition-transform ${
								showFormatOptions ? "rotate-180" : ""
							}`}
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
					{showFormatOptions && (
						<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
							<button
								onClick={() => handleDownloadQuestions("pdf")}
								className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
								disabled={downloadingQuestions}
							>
								PDF
							</button>
							<button
								onClick={() =>
									handleDownloadQuestions("moodle")
								}
								className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
								disabled={downloadingQuestions}
							>
								Moodle XML
							</button>
						</div>
					)}
				</div>

				<button
					onClick={() => setShowGenerateModal(true)}
					className="bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
					disabled={loading}
					aria-label="Generar cuestionario"
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
			</div>
		);
	}, [
		selectedQuestions.length,
		showFormatOptions,
		loading,
		downloadingQuestions,
		t,
		handleDownloadQuestions,
	]);

	/**
	 * Renderiza el botón para generar nuevas preguntas
	 */
	const renderGenerateNewQuestionsButton = useCallback(() => {
		return (
			<button
				onClick={() => setShowGenerateQuestionsModal(true)}
				className="bg-indigo-600 text-white py-2 px-4 rounded-md flex items-center"
				disabled={generatingNewQuestions}
				aria-label="Generar nuevas preguntas"
			>
				{generatingNewQuestions ? (
					<>
						<svg
							className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
						{t("common.processing")}
					</>
				) : (
					<>
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
								d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{t("topicDetail.generateNewQuestions") ||
							"Generar nuevas"}
					</>
				)}
			</button>
		);
	}, [generatingNewQuestions, t]);

	/**
	 * Renderiza la tabla de preguntas
	 */
	const renderQuestionsTable = useCallback(() => {
		return (
			<div className="overflow-hidden">
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
										aria-label="Seleccionar todas"
									/>
								</div>
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								{t("topicDetail.questionText") || "Pregunta"}
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
								{t("topicDetail.difficulty") || "Dificultad"}
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								{t("topicDetail.status") || "Estado"}
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								{t("topicDetail.actions") || "Acciones"}
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredQuestions.map((question) =>
							renderQuestionRow(question)
						)}
					</tbody>
				</table>
			</div>
		);
	}, [filteredQuestions, selectAll, t, handleSelectAll]);

	/**
	 * Renderiza una fila de pregunta
	 */
	const renderQuestionRow = useCallback(
		(question: Question) => {
			const isSelected = selectedQuestions.includes(question.id);
			const isExpanded =
				expandAllQuestions || showQuestionDetails === question.id;

			return (
				<>
					<tr
						key={question.id}
						className={`hover:bg-gray-50 ${
							isSelected
								? "bg-blue-50"
								: question.verified
								? "bg-green-50"
								: question.rejected
								? "bg-red-50"
								: ""
						}`}
					>
						<td className="px-6 py-4 whitespace-nowrap">
							<div className="flex items-center">
								<input
									type="checkbox"
									className="h-4 w-4 text-blue-600 border-gray-300 rounded"
									checked={isSelected}
									onChange={() =>
										handleSelectQuestion(question.id)
									}
									aria-label={`Seleccionar pregunta ${question.text.substring(
										0,
										20
									)}...`}
								/>
							</div>
						</td>
						<td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md">
							<button
								className="text-left hover:text-blue-600 focus:outline-none w-full overflow-ellipsis overflow-hidden"
								onClick={() => handleToggleDetails(question.id)}
								aria-label={`Ver detalles de pregunta: ${question.text.substring(
									0,
									20
								)}...`}
							>
								{question.text}
								{!expandAllQuestions && (
									<svg
										className="w-4 h-4 ml-1 inline-block"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										{showQuestionDetails === question.id ? (
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 15l7-7 7 7"
											/>
										) : (
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M19 9l-7 7-7-7"
											/>
										)}
									</svg>
								)}
							</button>
						</td>
						<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{question.type}
						</td>
						<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<span
								className={`px-2 py-1 rounded-full text-xs font-medium ${
									question.difficulty === "Fácil"
										? "bg-green-100 text-green-800"
										: question.difficulty === "Medio"
										? "bg-yellow-100 text-yellow-800"
										: "bg-red-100 text-red-800"
								}`}
							>
								{question.difficulty}
							</span>
						</td>
						<td className="px-6 py-4 whitespace-nowrap text-sm text-center">
							<span
								className={`px-2 py-1 rounded-full text-xs font-medium ${
									question.verified
										? "bg-green-100 text-green-800"
										: question.rejected
										? "bg-red-100 text-red-800"
										: "bg-gray-100 text-gray-800"
								}`}
							>
								{question.verified
									? t("topicDetail.verified") || "Verificada"
									: question.rejected
									? t("topicDetail.rejected") || "Rechazada"
									: t("topicDetail.unverified") ||
									  "No verificada"}
							</span>
						</td>
						<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
							<div className="flex justify-center space-x-2">
								<button
									onClick={() =>
										handleVerifyQuestion(question.id, true)
									}
									disabled={
										question.verified || question.rejected
									}
									className={`p-1 rounded-full ${
										question.verified
											? "bg-green-100 text-green-700"
											: "hover:bg-green-100 text-gray-500 hover:text-green-700"
									}`}
									title={
										t("topicDetail.verify") || "Verificar"
									}
									aria-label="Verificar pregunta"
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
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</button>
								<button
									onClick={() =>
										handleVerifyQuestion(question.id, false)
									}
									disabled={
										question.verified || question.rejected
									}
									className={`p-1 rounded-full ${
										question.rejected
											? "bg-red-100 text-red-700"
											: "hover:bg-red-100 text-gray-500 hover:text-red-700"
									}`}
									title={
										t("topicDetail.reject") || "Rechazar"
									}
									aria-label="Rechazar pregunta"
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
						</td>
					</tr>
					{isExpanded && renderQuestionDetails(question)}
				</>
			);
		},
		[
			selectedQuestions,
			expandAllQuestions,
			showQuestionDetails,
			t,
			handleSelectQuestion,
			handleToggleDetails,
			handleVerifyQuestion,
		]
	);

	/**
	 * Renderiza los detalles de una pregunta
	 */
	const renderQuestionDetails = useCallback((question: Question) => {
		return (
			<tr className="bg-gray-50">
				<td colSpan={6} className="px-6 py-4">
					<div className="text-sm text-gray-800">
						{question.choices ? (
							<div className="space-y-2">
								<h4 className="font-medium">Opciones:</h4>
								<ul className="ml-4 space-y-1">
									{question.choices.map((choice, index) => (
										<li
											key={index}
											className={`flex items-start ${
												choice.isCorrect
													? "text-green-700 font-medium"
													: ""
											}`}
										>
											<span
												className={`mr-2 ${
													choice.isCorrect
														? "text-green-600"
														: "text-gray-400"
												}`}
											>
												{choice.isCorrect ? (
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
															d="M5 13l4 4L19 7"
														/>
													</svg>
												) : (
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
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												)}
											</span>
											{choice.text}
										</li>
									))}
								</ul>
							</div>
						) : (
							<div>
								<h4 className="font-medium mb-2">
									Pregunta de tipo test sin opciones definidas
								</h4>
							</div>
						)}
					</div>
				</td>
			</tr>
		);
	}, []);

	/**
	 * Renderiza el modal de generación de cuestionario
	 */
	const renderGenerateQuestionnaireModal = useCallback(() => {
		if (!showGenerateModal) return null;

		return (
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
							aria-label="Cerrar"
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
							handleGenerateQuestionnaire(
								generationTitle,
								generationDescription
							);
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
								{t("topicDetail.description") || "Descripción"}
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
									!generationTitle.trim() ||
									selectedQuestions.length === 0
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
		);
	}, [
		showGenerateModal,
		generationTitle,
		generationDescription,
		selectedQuestions.length,
		generatingQuestionnaire,
		t,
		handleGenerateQuestionnaire,
	]);

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<div className="flex-1">
					<SearchBar
						placeholder={
							t("topicDetail.searchQuestionsPlaceholder") ||
							"Buscar preguntas..."
						}
						onSearch={handleSearch}
					/>
				</div>

				<div className="flex space-x-2">
					{renderActionButtons()}
					{renderGenerateNewQuestionsButton()}
				</div>
			</div>

			{/* Filtros y controles */}
			<div className="flex justify-between items-center mb-4">
				<QuestionStatusFilter
					currentFilter={statusFilter}
					onFilterChange={handleStatusFilterChange}
				/>

				<button
					onClick={toggleExpandAllQuestions}
					className="flex items-center text-gray-700 hover:text-blue-600"
					aria-label={
						expandAllQuestions ? "Contraer todas" : "Expandir todas"
					}
				>
					<svg
						className="w-5 h-5 mr-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						{expandAllQuestions ? (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M5 15l7-7 7 7"
							/>
						) : (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M19 9l-7 7-7-7"
							/>
						)}
					</svg>
					{expandAllQuestions
						? t("topicDetail.collapseAll") || "Contraer todas"
						: t("topicDetail.expandAll") || "Expandir todas"}
				</button>
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
					renderQuestionsTable()
				)}
			</div>

			{/* Modal para generar cuestionario */}
			{renderGenerateQuestionnaireModal()}

			{/* Modal para generar nuevas preguntas */}
			<GenerateQuestionsModal
				isOpen={showGenerateQuestionsModal}
				onClose={() => setShowGenerateQuestionsModal(false)}
				onGenerate={handleGenerateNewQuestions}
				isLoading={generatingNewQuestions}
			/>
		</div>
	);
};

export default QuestionsTab;
