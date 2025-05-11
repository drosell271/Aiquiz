// app/manager/components/topic/QuestionnaireTab.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useApiRequest from "../../hooks/useApiRequest";
import SearchBar from "../subject/SearchBar";
import { ConfirmationModal } from "../common";

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
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [questionnaireToDelete, setQuestionnaireToDelete] =
		useState<string>("");
	const [showFormatOptions, setShowFormatOptions] = useState<string | null>(
		null
	);

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

	const handleDeleteQuestionnaire = async () => {
		if (!questionnaireToDelete) return;

		try {
			setSelectedQuestionnaire(questionnaireToDelete);

			const response = await deleteQuestionnaire(
				null,
				false,
				`${subjectId}/topics/${topicId}/questionnaires/${questionnaireToDelete}`
			);

			if (response.success) {
				await fetchQuestionnaires();
			}
		} catch (error) {
			console.error("Error al eliminar cuestionario:", error);
		} finally {
			setSelectedQuestionnaire(null);
			setQuestionnaireToDelete("");
			setShowDeleteModal(false);
		}
	};

	const toggleFormatOptions = (id: string) => {
		if (showFormatOptions === id) {
			setShowFormatOptions(null);
		} else {
			setShowFormatOptions(id);
		}
	};

	const confirmDeleteQuestionnaire = (id: string) => {
		setQuestionnaireToDelete(id);
		setShowDeleteModal(true);
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
				setShowFormatOptions(null);
			}, 1000);
		} catch (error) {
			console.error("Error al descargar cuestionario:", error);
			setSelectedQuestionnaire(null);
			setShowFormatOptions(null);
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
											<div className="relative">
												<button
													className="text-blue-600 hover:text-blue-900 flex items-center"
													title={
														t(
															"topicDetail.download"
														) || "Descargar"
													}
													onClick={() =>
														toggleFormatOptions(
															questionnaire.id
														)
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
														className={`w-4 h-4 ml-1 transition-transform ${
															showFormatOptions ===
															questionnaire.id
																? "rotate-180"
																: ""
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
												{showFormatOptions ===
													questionnaire.id && (
													<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
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
												)}
											</div>
											<button
												onClick={() =>
													confirmDeleteQuestionnaire(
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

			{/* Modal de confirmación para eliminar cuestionario */}
			<ConfirmationModal
				isOpen={showDeleteModal}
				title={
					t("confirmation.deleteQuestionnaire.title") ||
					"Eliminar cuestionario"
				}
				message={
					t("confirmation.deleteQuestionnaire.message") ||
					"¿Estás seguro de que deseas eliminar este cuestionario? Esta acción no se puede deshacer."
				}
				confirmButtonText={t("common.delete") || "Eliminar"}
				onConfirm={handleDeleteQuestionnaire}
				onCancel={() => setShowDeleteModal(false)}
				isLoading={deletingQuestionnaire}
				isDanger={true}
			/>
		</div>
	);
};

export default QuestionnaireTab;
