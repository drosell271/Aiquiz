// app/manager/components/topic/AddSubtopicModal.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface AddSubtopicModalProps {
	onClose: () => void;
	onAdd: (title: string, description: string) => void;
	isLoading?: boolean;
}

const AddSubtopicModal = ({
	onClose,
	onAdd,
	isLoading = false,
}: AddSubtopicModalProps) => {
	const { t } = useTranslation();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		onAdd(title, description);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						{t("topicDetail.newSubtopic") || "Nuevo subtema"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
						disabled={isLoading}
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

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							htmlFor="subtopicTitle"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{t("topicDetail.name") || "Nombre"}
						</label>
						<input
							type="text"
							id="subtopicTitle"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full p-2 border rounded-md"
							required
							disabled={isLoading}
						/>
					</div>

					<div className="mb-6">
						<label
							htmlFor="subtopicDescription"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{t("topicDetail.description") || "Descripción"}
						</label>
						<textarea
							id="subtopicDescription"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full p-2 border rounded-md h-32"
							disabled={isLoading}
						/>
					</div>

					<div className="flex justify-end space-x-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
							disabled={isLoading}
						>
							{t("topicDetail.cancel") || "Cancelar"}
						</button>
						<button
							type="submit"
							disabled={isLoading || !title.trim()}
							className="px-4 py-2 bg-gray-800 text-white rounded-md disabled:opacity-50 flex items-center"
						>
							{isLoading ? (
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
									{t("common.processing") || "Procesando..."}
								</>
							) : (
								t("topicDetail.add") || "Añadir"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddSubtopicModal;
