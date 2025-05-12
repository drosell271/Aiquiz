// /app/manager/components/subtopic/ContentTab.tsx
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Subtopic } from "../../contexts/SubtopicContext";

interface ContentFile {
	id: string;
	name: string;
	type: string;
}

interface ContentTabProps {
	subtopic: Subtopic;
	subjectId: string;
	topicId: string;
	onUploadDocument: () => void;
	onAddVideoUrl: (url: string) => void;
	onDeleteFile: (fileId: string) => void;
	isLoading?: boolean;
}

/**
 * Componente de pestaña para gestionar el contenido de un subtema
 */
const ContentTab: React.FC<ContentTabProps> = ({
	subtopic,
	subjectId,
	topicId,
	onUploadDocument,
	onAddVideoUrl,
	onDeleteFile,
	isLoading = false,
}) => {
	const { t } = useTranslation();
	const [videoUrl, setVideoUrl] = useState<string>("");

	// Datos simulados de archivos (en una implementación real vendrían de la API)
	const files: ContentFile[] = [
		{
			id: "file-1",
			name: "Fundamentos URLs.pdf",
			type: "document",
		},
		{
			id: "file-2",
			name: "URL.ppt",
			type: "document",
		},
		{
			id: "file-3",
			name: "video-url-introduccion.txt",
			type: "document",
		},
	];

	/**
	 * Maneja el cambio en el campo de URL de video
	 */
	const handleVideoUrlChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setVideoUrl(e.target.value);
		},
		[]
	);

	/**
	 * Añade la URL de video al subtema
	 */
	const handleAddVideoUrl = useCallback(() => {
		if (videoUrl.trim()) {
			onAddVideoUrl(videoUrl);
			setVideoUrl("");
		}
	}, [videoUrl, onAddVideoUrl]);

	/**
	 * Determina el icono adecuado según la extensión del archivo
	 */
	const getFileIcon = useCallback((fileName: string): JSX.Element => {
		const extension = fileName.split(".").pop()?.toLowerCase();

		if (extension === "pdf") {
			return (
				<svg
					className="w-4 h-4 text-red-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			);
		} else if (["ppt", "pptx"].includes(extension || "")) {
			return (
				<svg
					className="w-4 h-4 text-orange-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			);
		} else if (["doc", "docx"].includes(extension || "")) {
			return (
				<svg
					className="w-4 h-4 text-blue-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			);
		} else {
			return (
				<svg
					className="w-4 h-4 text-gray-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			);
		}
	}, []);

	/**
	 * Renderiza un archivo individual
	 */
	const renderFile = (file: ContentFile): JSX.Element => {
		return (
			<div
				key={file.id}
				className="flex items-center justify-between p-3 bg-gray-100 rounded-md"
			>
				<div className="flex items-center">
					{getFileIcon(file.name)}
					<span className="ml-2">{file.name}</span>
				</div>
				<button
					onClick={() => onDeleteFile(file.id)}
					className="text-gray-500 hover:text-red-600"
					title={t("subtopicDetail.deleteFile") || "Eliminar archivo"}
					aria-label={`Eliminar archivo ${file.name}`}
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		);
	};

	/**
	 * Renderiza el botón para subir documentos
	 */
	const renderUploadButton = (): JSX.Element => {
		return (
			<button
				onClick={onUploadDocument}
				className="px-3 py-2 bg-gray-800 text-white rounded-md flex items-center text-sm"
				disabled={isLoading}
				aria-label="Subir documento"
			>
				<svg
					className="w-4 h-4 mr-1"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{t("subtopicDetail.uploadDocument") || "Subir documento"}
			</button>
		);
	};

	/**
	 * Renderiza el formulario para añadir URL de video
	 */
	const renderVideoUrlForm = (): JSX.Element => {
		return (
			<div className="flex-1 flex items-center gap-2">
				<input
					type="text"
					placeholder={
						t("subtopicDetail.enterVideoUrl") || "Inserta la URL"
					}
					value={videoUrl}
					onChange={handleVideoUrlChange}
					className="flex-1 p-2 border rounded-md text-sm"
					aria-label="URL del video"
				/>
				<button
					onClick={handleAddVideoUrl}
					disabled={!videoUrl.trim() || isLoading}
					className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm disabled:opacity-50"
					aria-label="Añadir URL de video"
				>
					{t("subtopicDetail.urlOfVideo") || "URL de video"}
				</button>
			</div>
		);
	};

	return (
		<div>
			<p className="text-gray-700 mb-4">
				{t("subtopicDetail.contentDescription") ||
					"El contenido de los documentos se utilizará para generar preguntas del subtema."}
			</p>

			<div className="flex gap-2 mb-4">
				{renderUploadButton()}
				{renderVideoUrlForm()}
			</div>

			<div className="mt-1 text-xs text-gray-500 mb-4">
				{t("subtopicDetail.allowedFiles") ||
					"Formatos admitidos: pdf, ppt, doc, docx..."}
			</div>

			{/* Lista de archivos */}
			{files.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
					<p className="text-gray-500">
						{t("subtopicDetail.noFiles") ||
							"No hay documentos ni videos asociados a este subtema."}
					</p>
				</div>
			) : (
				<div className="space-y-2">{files.map(renderFile)}</div>
			)}
		</div>
	);
};

export default ContentTab;
