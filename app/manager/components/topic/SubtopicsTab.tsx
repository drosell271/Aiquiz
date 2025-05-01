import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Subtopic } from "../../contexts/TopicContext";
import SearchBar from "../subject/SearchBar";

interface SubtopicsTabProps {
	topicId: string;
	subjectId: string;
	subtopics: Subtopic[];
	handleAddSubtopic: () => void;
	handleEditSubtopic: (subtopic: Subtopic) => void;
	handleDeleteSubtopic: (subtopicId: string) => void;
	isLoading?: boolean;
	deletingSubtopicId?: string;
}

const SubtopicsTab = ({
	topicId,
	subjectId,
	subtopics = [], // Proporcionar un array vacío por defecto
	handleAddSubtopic,
	handleEditSubtopic,
	handleDeleteSubtopic,
	isLoading = false,
	deletingSubtopicId = "",
}: SubtopicsTabProps) => {
	const { t } = useTranslation();
	const [filteredSubtopics, setFilteredSubtopics] = useState(subtopics || []); // Asegurar que siempre hay un array

	const handleSearch = (query: string) => {
		if (!query) {
			setFilteredSubtopics(subtopics || []);
			return;
		}

		const filtered = (subtopics || []).filter(
			(subtopic) =>
				subtopic.title.toLowerCase().includes(query.toLowerCase()) ||
				subtopic.description.toLowerCase().includes(query.toLowerCase())
		);
		setFilteredSubtopics(filtered);
	};

	return (
		<div>
			<div className="flex items-center mb-4">
				<SearchBar
					placeholder={t("topicDetail.searchSubtopicsPlaceholder")}
					onSearch={handleSearch}
				/>

				<button
					onClick={handleAddSubtopic}
					className="ml-4 bg-gray-800 text-white py-2 px-4 rounded-md flex items-center disabled:opacity-50"
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
							{t("common.adding")}
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
									d="M12 4v16m8-8H4"
								/>
							</svg>
							{t("topicDetail.newSubtopic")}
						</>
					)}
				</button>
			</div>

			{filteredSubtopics.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>{t("topicDetail.noSubtopicsFound")}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{filteredSubtopics.map((subtopic) => (
						<div
							key={subtopic.id}
							className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
						>
							<div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
								<h3 className="text-lg font-semibold">
									{subtopic.title}
								</h3>
								<div className="flex space-x-2">
									<button
										onClick={() =>
											handleEditSubtopic(subtopic)
										}
										className="text-gray-600 hover:text-gray-800"
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
									<button
										onClick={() =>
											handleDeleteSubtopic(subtopic.id)
										}
										className="text-red-500 hover:text-red-700"
										disabled={
											isLoading ||
											deletingSubtopicId === subtopic.id
										}
									>
										{deletingSubtopicId === subtopic.id ? (
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
							</div>
							<div className="p-4">
								<p className="text-gray-700 mb-3">
									{subtopic.description}
								</p>
								{subtopic.createdAt && (
									<p className="text-sm text-gray-500">
										{t("topicDetail.createdAt")}:{" "}
										{new Date(
											subtopic.createdAt
										).toLocaleDateString()}
									</p>
								)}
								{subtopic.updatedAt && (
									<p className="text-sm text-gray-500">
										{t("topicDetail.updatedAt")}:{" "}
										{new Date(
											subtopic.updatedAt
										).toLocaleDateString()}
									</p>
								)}
								<div className="mt-4 flex justify-end">
									<a
										href={`/manager/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopic.id}`}
										className="text-blue-600 hover:text-blue-800 flex items-center"
									>
										{t("topicDetail.viewDetails")}
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
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</a>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default SubtopicsTab;
