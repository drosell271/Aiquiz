// app/manager/components/topic/GenerateQuestionsModal.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface GenerateQuestionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onGenerate: (difficulty: string, count: number) => void;
	isLoading?: boolean;
}

export default function GenerateQuestionsModal({
	isOpen,
	onClose,
	onGenerate,
	isLoading = false,
}: GenerateQuestionsModalProps) {
	const { t } = useTranslation();
	const [difficulty, setDifficulty] = useState<string>("FÁCIL");
	const [count, setCount] = useState<number>(15);

	const handleGenerate = () => {
		onGenerate(difficulty, count);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-xl">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						{t(
							"topicDetail.generateQuestionsTitle",
							"Generar preguntas de HTTP > URL"
						)}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
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

				<div className="mb-6">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						{t("topicDetail.difficulty", "Dificultad")}
					</label>
					<div className="flex flex-wrap md:flex-nowrap gap-2">
						<button
							className={`px-4 py-2 rounded-md flex items-center w-full ${
								difficulty === "FÁCIL"
									? "bg-green-100 text-green-800 border border-green-300"
									: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
							}`}
							onClick={() => setDifficulty("FÁCIL")}
						>
							<div
								className={`w-3 h-3 rounded-full ${
									difficulty === "FÁCIL"
										? "bg-green-500"
										: "bg-gray-300"
								} mr-2`}
							></div>
							{t("topicDetail.easy", "FÁCIL")}
						</button>
						<button
							className={`px-4 py-2 rounded-md flex items-center w-full ${
								difficulty === "INTERMEDIO"
									? "bg-yellow-100 text-yellow-800 border border-yellow-300"
									: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
							}`}
							onClick={() => setDifficulty("INTERMEDIO")}
						>
							<div
								className={`w-3 h-3 rounded-full ${
									difficulty === "INTERMEDIO"
										? "bg-yellow-500"
										: "bg-gray-300"
								} mr-2`}
							></div>
							{t("topicDetail.intermediate", "INTERMEDIO")}
						</button>
						<button
							className={`px-4 py-2 rounded-md flex items-center w-full ${
								difficulty === "AVANZADO"
									? "bg-red-100 text-red-800 border border-red-300"
									: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
							}`}
							onClick={() => setDifficulty("AVANZADO")}
						>
							<div
								className={`w-3 h-3 rounded-full ${
									difficulty === "AVANZADO"
										? "bg-red-500"
										: "bg-gray-300"
								} mr-2`}
							></div>
							{t("topicDetail.advanced", "AVANZADO")}
						</button>
					</div>
				</div>

				<div className="mb-6">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						{t(
							"topicDetail.numberOfQuestions",
							"Número de preguntas"
						)}
					</label>
					<div className="flex justify-between gap-2">
						{[5, 10, 15, 20].map((num) => (
							<button
								key={num}
								className={`flex-1 py-2 px-4 rounded-full ${
									count === num
										? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
										: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
								}`}
								onClick={() => setCount(num)}
							>
								{num}
							</button>
						))}
					</div>
				</div>

				<div className="flex justify-end">
					<button
						className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center disabled:opacity-50"
						onClick={handleGenerate}
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
								{t("common.processing", "Procesando...")}
							</>
						) : (
							t(
								"topicDetail.generateQuestions",
								"Generar preguntas"
							)
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
