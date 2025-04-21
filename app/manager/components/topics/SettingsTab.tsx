// /app/manager/components/topics/SettingsTab.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Subject, Topic } from "../../contexts/SubjectContext";

interface SettingsTabProps {
	subject: Subject;
	editMode: boolean;
	editedSubject: Subject;
	onEditToggle: () => void;
	onInputChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void;
	onSaveChanges: () => void;
	onEditTopic: (topicId: string, newTitle: string) => void;
	onDeleteSubject: () => void;
	isLoading?: boolean;
}

const SettingsTab = ({
	subject,
	editMode,
	editedSubject,
	onEditToggle,
	onInputChange,
	onSaveChanges,
	onEditTopic,
	onDeleteSubject,
	isLoading = false,
}: SettingsTabProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [deletingConfirm, setDeletingConfirm] = useState(false);

	const handleDeleteConfirm = () => {
		if (deletingConfirm) {
			onDeleteSubject();
		} else {
			setDeletingConfirm(true);
		}
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
								{t("common.saving")}
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
								{t("subjectDetail.saveChanges")}
							</>
						)}
					</button>

					<button
						className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md disabled:opacity-50"
						onClick={onEditToggle}
						disabled={isLoading}
					>
						{t("subjectDetail.cancel")}
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
						{t("subjectDetail.editSubject")}
					</button>
				</div>
			)}

			<div className="mb-6">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					{t("subjectDetail.name")}
				</label>
				{editMode ? (
					<input
						type="text"
						name="title"
						value={editedSubject.title}
						onChange={onInputChange}
						className="w-full p-2 border rounded-md"
						disabled={isLoading}
					/>
				) : (
					<div className="p-2 bg-gray-100 rounded-md">
						{subject.title}
					</div>
				)}
			</div>

			<div className="mb-6">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					{t("subjectDetail.acronym")}
				</label>
				{editMode ? (
					<input
						type="text"
						name="acronym"
						value={editedSubject.acronym}
						onChange={onInputChange}
						className="w-full p-2 border rounded-md"
						disabled={isLoading}
					/>
				) : (
					<div className="p-2 bg-gray-100 rounded-md">
						{subject.acronym}
					</div>
				)}
			</div>

			<div className="mb-6">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					{t("subjectDetail.description")}
				</label>
				{editMode ? (
					<textarea
						name="description"
						value={editedSubject.description}
						onChange={onInputChange}
						className="w-full p-2 border rounded-md h-32"
						disabled={isLoading}
					/>
				) : (
					<div className="p-2 bg-gray-100 rounded-md">
						{subject.description}
					</div>
				)}
			</div>

			{/* Sección de temas */}
			<div className="mb-10">
				<h3 className="text-lg font-medium mb-2">
					{t("subjectDetail.topicsList")}
				</h3>
				<div className="grid grid-cols-2 gap-4">
					{subject.topics.map((topic) => (
						<div
							key={topic.id}
							className="p-4 bg-gray-100 rounded-md flex justify-between items-center"
						>
							<span>{topic.title}</span>
							{editMode && (
								<div className="flex">
									<button
										className="text-gray-600 hover:text-gray-800 mr-2 disabled:opacity-50"
										onClick={() => {}}
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
										className="text-red-500 hover:text-red-700 disabled:opacity-50"
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Sección para eliminar asignatura */}
			<div className="mt-16 p-6 bg-red-50 rounded-md border border-red-200">
				<h3 className="text-lg font-medium text-red-800 mb-2">
					{t("subjectDetail.deleteSubject")}
				</h3>
				<p className="text-red-700 mb-4">
					{t("subjectDetail.deleteWarning")}
				</p>
				<button
					className="bg-red-800 text-white py-2 px-4 rounded-md flex items-center disabled:opacity-50"
					onClick={handleDeleteConfirm}
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
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							{deletingConfirm
								? t("subjectDetail.confirmDelete")
								: t("subjectDetail.delete")}
						</>
					)}
				</button>
			</div>
		</div>
	);
};

export default SettingsTab;
