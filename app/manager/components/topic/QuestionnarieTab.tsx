// app/manager/components/topic/QuestionnaireTab.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useApiRequest from "../../hooks/useApiRequest";
import SearchBar from "../subject/SearchBar";

interface Questionnaire {
	id: string;
	title: string;
	description: string;
	questions: number;
	createdAt: string;
	downloadCount: number;
}

interface QuestionnaireTabProps {
	topicId: string;
	subjectId: string;
}

const QuestionnaireTab = ({ topicId, subjectId }: QuestionnaireTabProps) => {
	const { t } = useTranslation();
	const [filteredQuestionnaires, setFilteredQuestionnaires] = useState<
		Questionnaire[]
	>([]);
	const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<
		string | null
	>(null);

	// Estados para el modal de creación de cuestionario
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newTitle, setNewTitle] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [numQuestions, setNumQuestions] = useState(10);

	// API para obtener cuestionarios
	const {
		data: questionnaires,
		loading,
		error,
		makeRequest: fetchQuestionnaires,
	} = useApiRequest(
		`/api/subjects/${subjectId}/topics/${topicId}/questionnaires`,
		"GET",
		null,
		true
	);

	// API para crear cuestionario
	const { makeRequest: createQuestionnaire, loading: creatingQuestionnaire } =
		useApiRequest(
			`/api/subjects/${subjectId}/topics/${topicId}/questionnaires`,
			"POST",
			null,
			false
		);

	// API para eliminar cuestionario
	const { makeRequest: deleteQuestionnaire, loading: deletingQuestionnaire } =
		useApiRequest("", "DELETE", null, false);

	// API para descargar cuestionario
	const {
		makeRequest: downloadQuestionnaire,
		loading: downloadingQuestionnaire,
	} = useApiRequest("", "GET", null, false);

	useEffect(() => {
		if (questionnaires) {
			setFilteredQuestionnaires(questionnaires);
		}
	}, [questionnaires]);

	const handleSearch = (query: string) => {
		if (!query) {
			setFilteredQuestionnaires(questionnaires || []);
			return;
		}

		const filtered = (questionnaires || []).filter(
			(questionnaire) =>
				questionnaire.title
					.toLowerCase()
					.includes(query.toLowerCase()) ||
				questionnaire.description
					.toLowerCase()
					.includes(query.toLowerCase())
		);

		setFilteredQuestionnaires(filtered);
	};

	const handleCreateQuestionnaire = async () => {
		if (!newTitle.trim()) return;

		try {
			const response = await createQuestionnaire({
				title: newTitle,
				description: newDescription,
				numQuestions,
			});

			if (response.success) {
				await fetchQuestionnaires();
				setShowCreateModal(false);
				setNewTitle("");
				setNewDescription("");
				setNumQuestions(10);
			}
		} catch (error) {
			console.error("Error al crear cuestionario:", error);
		}
	};

	const handleDeleteQuestionnaire = async (id: string) => {
		try {
			setSelectedQuestionnaire(id);

			const response = await deleteQuestionnaire(
				null,
				false,
				`${subjectId}/topics/${topicId}/questionnaires/${id}`
			);

			if (response.success) {
				await fetchQuestionnaires();
			}
		} catch (error) {
			console.error("Error al eliminar cuestionario:", error);
		} finally {
			setSelectedQuestionnaire(null);
		}
	};

	const handleDownloadQuestionnaire = async (id: string, format: string) => {
		try {
			setSelectedQuestionnaire(id);

			await downloadQuestionnaire(
				null,
				false,
				`${subjectId}/topics/${topicId}/questionnaires/${id}/download?format=${format}`
			);

			// Simular descarga en desarrollo
			console.log(`Descargando cuestionario ${id} en formato ${format}`);

			// En producción, aquí se procesaría la respuesta para descargar el archivo
			setTimeout(() => {
				setSelectedQuestionnaire(null);
			}, 1000);
		} catch (error) {
			console.error("Error al descargar cuestionario:", error);
			setSelectedQuestionnaire(null);
		}
	};

	return (
		<div>
			<div className="flex items-center mb-4">
				<SearchBar
					placeholder={
						t("topicDetail.searchQuestionnairesPlaceholder") ||
						"Buscar cuestionarios..."
					}
					onSearch={handleSearch}
				/>

				<button
					onClick={() => setShowCreateModal(true)}
					className="ml-4 bg-gray-800 text-white py-2 px-4 rounded-md flex items-center disabled:opacity-50"
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
					{t("topicDetail.newQuestionnaire") || "Nuevo cuestionario"}
				</button>
			</div>

			{loading ? (
				<div className="flex justify-center my-8">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
				</div>
			) : error ? (
				<div className="bg-red-100 p-4 rounded-md text-red-700">
					{t("topicDetail.errorLoadingQuestionnaires") ||
						"Error al cargar los cuestionarios"}
				</div>
			) : filteredQuestionnaires.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>
						{t("topicDetail.noQuestionnairesFound") ||
							"No se encontraron cuestionarios"}
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
									{t("topicDetail.title") || "Título"}
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.description") ||
										"Descripción"}
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.questions") || "Preguntas"}
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
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{t("topicDetail.downloads") || "Descargas"}
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
							{filteredQuestionnaires.map((questionnaire) => (
								<tr
									key={questionnaire.id}
									className="hover:bg-gray-50"
								>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">
										{questionnaire.title}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
										{questionnaire.description}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{questionnaire.questions}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{new Date(
											questionnaire.createdAt
										).toLocaleDateString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{questionnaire.downloadCount}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<div className="flex justify-end space-x-3">
											<div className="relative group">
												<button
													className="text-blue-600 hover:text-blue-900 flex items-center"
													title={
														t(
															"topicDetail.download"
														) || "Descargar"
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
															d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
														/>
													</svg>
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
												<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
													<button
														onClick={() =>
															handleDownloadQuestionnaire(
																questionnaire.id,
																"pdf"
															)
														}
														className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
														disabled={
															selectedQuestionnaire ===
																questionnaire.id &&
															downloadingQuestionnaire
														}
													>
														PDF
													</button>
													<button
														onClick={() =>
															handleDownloadQuestionnaire(
																questionnaire.id,
																"moodle"
															)
														}
														className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
														disabled={
															selectedQuestionnaire ===
																questionnaire.id &&
															downloadingQuestionnaire
														}
													>
														Moodle XML
													</button>
												</div>
											</div>
											<button
												onClick={() =>
													handleDeleteQuestionnaire(
														questionnaire.id
													)
												}
												className="text-red-600 hover:text-red-900"
												title={
													t("topicDetail.delete") ||
													"Eliminar"
												}
												disabled={
													selectedQuestionnaire ===
														questionnaire.id &&
													deletingQuestionnaire
												}
											>
												{selectedQuestionnaire ===
													questionnaire.id &&
												deletingQuestionnaire ? (
													<svg
														className="animate-spin w-5 h-5"
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
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												)}
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Modal para crear nuevo cuestionario */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">
								{t("topicDetail.newQuestionnaire") ||
									"Nuevo cuestionario"}
							</h2>
							<button
								onClick={() => setShowCreateModal(false)}
								className="text-gray-500 hover:text-gray-700"
								disabled={creatingQuestionnaire}
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

						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleCreateQuestionnaire();
							}}
						>
							<div className="mb-4">
								<label
									htmlFor="questionnaireTitle"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									{t("topicDetail.title") || "Título"}
								</label>
								<input
									type="text"
									id="questionnaireTitle"
									value={newTitle}
									onChange={(e) =>
										setNewTitle(e.target.value)
									}
									className="w-full p-2 border rounded-md"
									required
									disabled={creatingQuestionnaire}
								/>
							</div>

							<div className="mb-4">
								<label
									htmlFor="questionnaireDescription"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									{t("topicDetail.description") ||
										"Descripción"}
								</label>
								<textarea
									id="questionnaireDescription"
									value={newDescription}
									onChange={(e) =>
										setNewDescription(e.target.value)
									}
									className="w-full p-2 border rounded-md h-32"
									disabled={creatingQuestionnaire}
								/>
							</div>

							<div className="mb-6">
								<label
									htmlFor="numQuestions"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									{t("topicDetail.numQuestions") ||
										"Número de preguntas"}
								</label>
								<input
									type="number"
									id="numQuestions"
									value={numQuestions}
									onChange={(e) =>
										setNumQuestions(Number(e.target.value))
									}
									min="1"
									max="50"
									className="w-full p-2 border rounded-md"
									disabled={creatingQuestionnaire}
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<button
									type="button"
									onClick={() => setShowCreateModal(false)}
									className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
									disabled={creatingQuestionnaire}
								>
									{t("topicDetail.cancel") || "Cancelar"}
								</button>
								<button
									type="submit"
									disabled={
										creatingQuestionnaire ||
										!newTitle.trim()
									}
									className="px-4 py-2 bg-gray-800 text-white rounded-md disabled:opacity-50 flex items-center"
								>
									{creatingQuestionnaire ? (
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
										t("topicDetail.create") || "Crear"
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

export default QuestionnaireTab;
