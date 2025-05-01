// app/manager/components/topic/SettingsTab.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Topic, Subtopic } from "../../contexts/TopicContext";

interface SettingsTabProps {
	topic: Topic;
	editMode: boolean;
	editedTopic: Topic;
	onEditToggle: () => void;
	onInputChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void;
	onSaveChanges: () => void;
	isLoading?: boolean;
}

const SettingsTab = ({
	topic,
	editMode,
	editedTopic,
	onEditToggle,
	onInputChange,
	onSaveChanges,
	isLoading = false,
}: SettingsTabProps) => {
	const { t } = useTranslation();
	const [editingSubtopicId, setEditingSubtopicId] = useState<string | null>(
		null
	);
	const [editingSubtopicTitle, setEditingSubtopicTitle] = useState("");

	const handleStartEditSubtopic = (subtopic: Subtopic) => {
		setEditingSubtopicId(subtopic.id);
		setEditingSubtopicTitle(subtopic.title);
	};

	const handleSaveSubtopicEdit = () => {
		// Esta funcionalidad debería implementarse en el componente padre
		// Por ahora, solo reseteamos el estado local
		setEditingSubtopicId(null);
		setEditingSubtopicTitle("");
	};

	const handleCancelSubtopicEdit = () => {
		setEditingSubtopicId(null);
		setEditingSubtopicTitle("");
	};

	return (
		<div>
			{editMode ? (
				<div className="flex gap-4 mb-6">
					<button
						className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center disabled:opacity-50"
						onClick={onSaveChanges}
						disabled={isLoading}
					>
						{isLoading ? (
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
								{t("common.saving") || "Guardando..."}
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
										d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
									/>
								</svg>
								{t("topicDetail.saveChanges") ||
									"Guardar cambios"}
							</>
						)}
					</button>

					<button
						className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md disabled:opacity-50"
						onClick={onEditToggle}
						disabled={isLoading}
					>
						{t("topicDetail.cancel") || "Cancelar"}
					</button>
				</div>
			) : (
				<div className="mb-6">
					<button
						className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
						onClick={onEditToggle}
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
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
						{t("topicDetail.editTopic") || "Editar tema"}
					</button>
				</div>
			)}

			<div className="bg-white shadow rounded-lg overflow-hidden">
				<div className="p-6">
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							{t("topicDetail.name") || "Nombre"}
						</label>
						{editMode ? (
							<input
								type="text"
								name="title"
								value={editedTopic.title}
								onChange={onInputChange}
								className="w-full p-2 border rounded-md"
								disabled={isLoading}
							/>
						) : (
							<div className="p-2 bg-gray-100 rounded-md">
								{topic.title}
							</div>
						)}
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							{t("topicDetail.subject") || "Asignatura"}
						</label>
						<div className="p-2 bg-gray-100 rounded-md">
							{topic.subjectTitle}
						</div>
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							{t("topicDetail.description") || "Descripción"}
						</label>
						{editMode ? (
							<textarea
								name="description"
								value={editedTopic.description}
								onChange={onInputChange}
								className="w-full p-2 border rounded-md h-32"
								disabled={isLoading}
							/>
						) : (
							<div className="p-2 bg-gray-100 rounded-md">
								{topic.description}
							</div>
						)}
					</div>

					{/* Sección de subtemas */}
					<div className="mb-10">
						<h3 className="text-lg font-medium mb-2">
							{t("topicDetail.subtopicsList") ||
								"Lista de subtemas"}
						</h3>
						<div className="grid grid-cols-2 gap-4">
							{topic.subtopics.map((subtopic) => (
								<div
									key={subtopic.id}
									className="p-4 bg-gray-100 rounded-md"
								>
									{editingSubtopicId === subtopic.id ? (
										<div className="flex flex-col">
											<input
												type="text"
												value={editingSubtopicTitle}
												onChange={(e) =>
													setEditingSubtopicTitle(
														e.target.value
													)
												}
												className="w-full p-2 border rounded-md mb-2"
											/>
											<div className="flex justify-end space-x-2">
												<button
													onClick={
														handleSaveSubtopicEdit
													}
													className="text-green-600 hover:text-green-800"
												>
													{t("topicDetail.save") ||
														"Guardar"}
												</button>
												<button
													onClick={
														handleCancelSubtopicEdit
													}
													className="text-gray-500 hover:text-gray-700"
												>
													{t("topicDetail.cancel") ||
														"Cancelar"}
												</button>
											</div>
										</div>
									) : (
										<div className="flex justify-between items-center">
											<span>{subtopic.title}</span>
											{editMode && (
												<div className="flex">
													<button
														className="text-gray-600 hover:text-gray-800 mr-2 disabled:opacity-50"
														onClick={() =>
															handleStartEditSubtopic(
																subtopic
															)
														}
														disabled={isLoading}
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
																d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
															/>
														</svg>
													</button>
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsTab;
