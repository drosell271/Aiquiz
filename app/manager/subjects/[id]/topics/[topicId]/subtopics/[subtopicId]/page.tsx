"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
	SubtopicProvider,
	useSubtopic,
	Subtopic,
} from "../../../../../../contexts/SubtopicContext";
import useApiRequest from "../../../../../../hooks/useApiRequest";

// Importar los componentes de las pestañas
import { ContentTab, SettingsTab } from "../../../../../../components/subtopic";

// Componente interno para el contenido
const SubtopicDetailContent = () => {
	const params = useParams();
	const id = params.id as string;
	const topicId = params.topicId as string;
	const subtopicId = params.subtopicId as string;

	const router = useRouter();
	const { t } = useTranslation();
	const { subtopic, loading, setSubtopic, refetchSubtopic } = useSubtopic();

	// Estados para UI
	const [activeTab, setActiveTab] = useState("content");
	const [isUploading, setIsUploading] = useState(false);

	// API para modificaciones del subtema
	const { makeRequest: updateSubtopic, loading: updatingSubtopic } =
		useApiRequest(
			`/api/subjects/${id}/topics/${topicId}/subtopics/${subtopicId}`,
			"PUT",
			null,
			false
		);

	// API para eliminar subtema
	const { makeRequest: deleteSubtopic, loading: deletingSubtopic } =
		useApiRequest(
			`/api/subjects/${id}/topics/${topicId}/subtopics/${subtopicId}`,
			"DELETE",
			null,
			false
		);

	// API simulada para archivos
	const { makeRequest: uploadDocument, loading: uploadingDocument } =
		useApiRequest(
			`/api/subjects/${id}/topics/${topicId}/subtopics/${subtopicId}/files`,
			"POST",
			null,
			false
		);

	const { makeRequest: addVideoUrl, loading: addingVideoUrl } = useApiRequest(
		`/api/subjects/${id}/topics/${topicId}/subtopics/${subtopicId}/videos`,
		"POST",
		null,
		false
	);

	const { makeRequest: deleteFile, loading: deletingFile } = useApiRequest(
		"",
		"DELETE",
		null,
		false
	);

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	// Simulación de subida de documento con input de archivo
	const handleUploadDocument = () => {
		// Crear un input de archivo oculto
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = ".pdf,.doc,.docx,.ppt,.pptx,.txt";

		// Manejar el evento de cambio cuando se selecciona un archivo
		fileInput.onchange = async (e: Event) => {
			const target = e.target as HTMLInputElement;
			const files = target.files;

			if (files && files.length > 0) {
				const file = files[0];
				setIsUploading(true);

				try {
					// En una implementación real, aquí subirías el archivo al servidor
					console.log("Subiendo documento:", file.name);

					// Simular una llamada a la API
					await uploadDocument({
						fileName: file.name,
						fileType: "document",
						fileSize: file.size,
					});

					// Recargar los datos del subtema
					await refetchSubtopic();
				} catch (error) {
					console.error("Error al subir el documento:", error);
				} finally {
					setIsUploading(false);
				}
			}
		};

		// Hacer clic en el input de archivo
		fileInput.click();
	};

	const handleAddVideoUrl = async (url: string) => {
		try {
			// En una implementación real, aquí validarías la URL y la guardarías
			console.log("Añadiendo URL de video:", url);

			// Simular una llamada a la API
			await addVideoUrl({
				url: url,
				platform: url.includes("youtube") ? "youtube" : "vimeo",
			});

			// Recargar los datos del subtema
			await refetchSubtopic();
		} catch (error) {
			console.error("Error al añadir URL de video:", error);
		}
	};

	const handleDeleteFile = async (fileId: string) => {
		try {
			// En una implementación real, aquí eliminarías el archivo del servidor
			console.log("Eliminando archivo:", fileId);

			// Simular una llamada a la API
			await deleteFile(
				null,
				false,
				`${id}/topics/${topicId}/subtopics/${subtopicId}/files/${fileId}`
			);

			// Recargar los datos del subtema
			await refetchSubtopic();
		} catch (error) {
			console.error("Error al eliminar el archivo:", error);
		}
	};

	const handleSaveSubtopicChanges = async (
		updatedData: Partial<Subtopic>
	) => {
		try {
			const response = await updateSubtopic(updatedData);

			if (response.success) {
				await refetchSubtopic();
			}
		} catch (error) {
			console.error("Error al actualizar el subtema:", error);
		}
	};

	const handleDeleteSubtopic = async () => {
		try {
			const response = await deleteSubtopic();

			if (response.success) {
				// Redireccionar a la página del tema
				router.push(`/manager/subjects/${id}/topics/${topicId}`);
			}
		} catch (error) {
			console.error("Error al eliminar el subtema:", error);
		}
	};

	if (loading) {
		return (
			<div className="p-6 sm:p-8">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
					<span className="ml-3 text-lg text-gray-700">
						{t("subtopicDetail.loading") || "Cargando..."}
					</span>
				</div>
			</div>
		);
	}

	if (!subtopic) {
		return (
			<div className="p-6 sm:p-8">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-700">
						{t("subtopicDetail.subtopicNotFound") ||
							"Subtema no encontrado"}
					</h2>
					<Link
						href={`/manager/subjects/${id}/topics/${topicId}`}
						className="mt-4 inline-block text-blue-600 hover:underline"
					>
						{t("subtopicDetail.backToTopic") || "Volver al tema"}
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 sm:p-8">
			{/* Breadcrumbs y título */}
			<div className="mb-6">
				<div className="flex items-center text-sm text-gray-500 mb-2">
					<Link
						href="/manager/subjects"
						className="hover:text-gray-700"
					>
						{t("navigation.subjects") || "Asignaturas"}
					</Link>
					<span className="mx-2">&gt;</span>
					<Link
						href={`/manager/subjects/${id}`}
						className="hover:text-gray-700"
					>
						{subtopic.subjectTitle}
					</Link>
					<span className="mx-2">&gt;</span>
					<Link
						href={`/manager/subjects/${id}/topics/${topicId}`}
						className="hover:text-gray-700"
					>
						{subtopic.topicTitle}
					</Link>
					<span className="mx-2">&gt;</span>
					<span className="text-gray-900">{subtopic.title}</span>
				</div>

				<h1 className="text-3xl font-bold">{subtopic.title}</h1>
				<p className="text-gray-700 mt-2">{subtopic.description}</p>
			</div>

			{/* Tabs de navegación */}
			<div className="border-b border-gray-200 mb-6">
				<nav className="-mb-px flex space-x-8">
					<button
						onClick={() => handleTabChange("content")}
						className={`py-4 px-1 ${
							activeTab === "content"
								? "border-b-2 border-indigo-500 font-medium text-indigo-600"
								: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						}`}
					>
						{t("subtopicDetail.documentsAndVideos") ||
							"Documentos y videos"}
					</button>
					<button
						onClick={() => handleTabChange("settings")}
						className={`py-4 px-1 ${
							activeTab === "settings"
								? "border-b-2 border-indigo-500 font-medium text-indigo-600"
								: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						}`}
					>
						{t("subtopicDetail.settings") || "Ajustes"}
					</button>
				</nav>
			</div>

			{/* Contenido de las tabs */}
			<div className="mt-6">
				{activeTab === "content" && subtopic && (
					<ContentTab
						subtopic={subtopic}
						subjectId={id}
						topicId={topicId}
						onUploadDocument={handleUploadDocument}
						onAddVideoUrl={handleAddVideoUrl}
						onDeleteFile={handleDeleteFile}
						isLoading={
							isUploading ||
							uploadingDocument ||
							addingVideoUrl ||
							deletingFile
						}
					/>
				)}

				{activeTab === "settings" && subtopic && (
					<SettingsTab
						subtopic={subtopic}
						subjectId={id}
						topicId={topicId}
						onSaveChanges={handleSaveSubtopicChanges}
						onDeleteSubtopic={handleDeleteSubtopic}
						isLoading={updatingSubtopic || deletingSubtopic}
					/>
				)}
			</div>
		</div>
	);
};

// Componente principal con el provider del contexto
export default function SubtopicDetailPage() {
	return (
		<SubtopicProvider>
			<SubtopicDetailContent />
		</SubtopicProvider>
	);
}
