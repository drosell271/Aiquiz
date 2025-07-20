// /app/manager/components/subject/AddTopicModal.tsx
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

interface AddTopicModalProps {
	onClose: () => void;
	onAdd: (title: string, description: string) => void;
	isLoading?: boolean;
}

/**
 * Modal para añadir un nuevo tema
 */
const AddTopicModal: React.FC<AddTopicModalProps> = ({
	onClose,
	onAdd,
	isLoading = false,
}) => {
	const { t } = useTranslation();

	// Estado unificado para el formulario
	const [formData, setFormData] = useState({
		title: "",
		description: "",
	});

	/**
	 * Maneja los cambios en los campos del formulario
	 */
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const { name, value } = e.target;
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		},
		[]
	);

	/**
	 * Maneja el envío del formulario
	 */
	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!formData.title.trim()) return;

			onAdd(formData.title, formData.description);
		},
		[formData, onAdd]
	);

	/**
	 * Maneja el cierre con Escape
	 */
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose]
	);

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div
				className="bg-white rounded-lg shadow-xl max-w-md w-full"
				onKeyDown={handleKeyDown}
				tabIndex={-1}
			>
				{/* Encabezado */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">
						{t("subjectDetail.addTopic") || "Añadir Tema"}
					</h3>
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
						aria-label="Cerrar modal"
					>
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Contenido del formulario */}
				<form onSubmit={handleSubmit} className="p-6">
					<div className="space-y-4">
						{/* Campo de título */}
						<div>
							<label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
								{t("common.title") || "Título"} <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="title"
								name="title"
								value={formData.title}
								onChange={handleInputChange}
								disabled={isLoading}
								placeholder={t("subjectDetail.topicTitlePlaceholder") || "Ingrese el título del tema"}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								required
								autoFocus
							/>
						</div>

						{/* Campo de descripción */}
						<div>
							<label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
								{t("common.description") || "Descripción"}
							</label>
							<textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								disabled={isLoading}
								placeholder={t("subjectDetail.topicDescriptionPlaceholder") || "Ingrese una descripción opcional"}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								rows={3}
							/>
						</div>
					</div>

					{/* Botones */}
					<div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							disabled={isLoading}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{t("common.cancel") || "Cancelar"}
						</button>
						<button
							type="submit"
							disabled={isLoading || !formData.title.trim()}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
						>
							{isLoading && (
								<svg
									className="w-4 h-4 mr-2 animate-spin"
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
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
							)}
							{t("common.add") || "Añadir"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddTopicModal;