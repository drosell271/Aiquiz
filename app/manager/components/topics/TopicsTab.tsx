// /app/manager/components/topics/TopicsTab.tsx (actualizado)
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import SearchBar from "./SearchBar";

interface SubTopic {
	id: string;
	title: string;
}

interface Topic {
	id: string;
	title: string;
	description: string;
	subtopics: SubTopic[];
}

interface TopicsTabProps {
	subjectId: string;
	topics: Topic[];
	handleAddTopic: () => void;
	handleDeleteTopic: (topicId: string) => void;
	isLoading?: boolean;
	deletingTopicId?: string | null;
}

const TopicsTab = ({
	subjectId,
	topics,
	handleAddTopic,
	handleDeleteTopic,
	isLoading = false,
	deletingTopicId = "",
}: TopicsTabProps) => {
	const { t } = useTranslation();
	const [filteredTopics, setFilteredTopics] = useState(topics);

	const handleSearch = (query: string) => {
		if (!query) {
			setFilteredTopics(topics);
			return;
		}

		const filtered = topics.filter(
			(topic) =>
				topic.title.toLowerCase().includes(query.toLowerCase()) ||
				topic.description.toLowerCase().includes(query.toLowerCase()) ||
				topic.subtopics.some((subtopic) =>
					subtopic.title.toLowerCase().includes(query.toLowerCase())
				)
		);
		setFilteredTopics(filtered);
	};

	return (
		<div>
			<div className="flex items-center mb-4">
				<SearchBar
					placeholder={t("subjectDetail.searchPlaceholder")}
					onSearch={handleSearch}
				/>

				<button
					onClick={handleAddTopic}
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
							{t("subjectDetail.newTopic")}
						</>
					)}
				</button>
			</div>

			{filteredTopics.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>{t("subjectDetail.noTopicsFound")}</p>
				</div>
			) : (
				filteredTopics.map((topic) => (
					<div
						key={topic.id}
						className="mb-8 bg-gray-50 p-6 rounded-md"
					>
						<div className="flex justify-between mb-2">
							<h3 className="text-xl font-bold flex items-center">
								{topic.title}
								<Link
									href={`/manager/subjects/${subjectId}/topics/${topic.id}`}
									className="ml-2"
								>
									<svg
										className="w-5 h-5 text-gray-700"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</Link>
							</h3>
							<div className="flex">
								<button
									className="text-red-500 hover:text-red-700 flex items-center disabled:opacity-50"
									onClick={() => handleDeleteTopic(topic.id)}
									disabled={
										isLoading ||
										deletingTopicId === topic.id
									}
								>
									{deletingTopicId === topic.id ? (
										<svg
											className="animate-spin w-5 h-5 mr-1"
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
											className="w-5 h-5 mr-1"
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
									{t("common.delete")}
								</button>
							</div>
						</div>

						<p className="text-gray-700 mb-4">
							{topic.description}
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{topic.subtopics.map((subtopic) => (
								<div
									key={subtopic.id}
									className="bg-gray-200 py-2 px-4 rounded"
								>
									{subtopic.title}
								</div>
							))}
						</div>
					</div>
				))
			)}
		</div>
	);
};

export default TopicsTab;
