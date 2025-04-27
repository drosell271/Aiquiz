"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
	useTopic,
	TopicProvider,
	Subtopic,
} from "../../../../contexts/TopicContext";
import useApiRequest from "../../../../hooks/useApiRequest";
import { ConfirmationModal } from "../../../../components/common/index";
import {
	SubtopicsTab,
	InformationTab,
	QuestionsTab,
	AddSubtopicModal,
	EditSubtopicModal,
} from "../../../../components/topic";

// Datos de preguntas simulados para la pestaña de preguntas
const MOCK_QUESTIONS = [
	{
		id: "q1",
		text: "¿Cuál es la estructura básica de un documento HTML?",
		type: "Opción múltiple",
		difficulty: "Fácil",
		createdAt: "2023-11-15T10:00:00Z",
	},
	{
		id: "q2",
		text: "¿Qué significa HTML?",
		type: "Opción múltiple",
		difficulty: "Fácil",
		createdAt: "2023-11-16T11:30:00Z",
	},
	{
		id: "q3",
		text: "Explica la diferencia entre etiquetas semánticas y no semánticas en HTML",
		type: "Desarrollo",
		difficulty: "Medio",
		createdAt: "2023-11-18T14:20:00Z",
	},
	{
		id: "q4",
		text: "¿Cómo se crea un formulario en HTML?",
		type: "Opción múltiple",
		difficulty: "Medio",
		createdAt: "2023-11-20T09:15:00Z",
	},
	{
		id: "q5",
		text: "Explica el uso de la etiqueta 'meta' en HTML y sus atributos principales",
		type: "Desarrollo",
		difficulty: "Avanzado",
		createdAt: "2023-11-22T16:45:00Z",
	},
];

// Componente interno para la funcionalidad una vez cargado el contexto
const TopicSubtopicsContent = () => {
	const params = useParams();
	const id = params.id as string;
	const topicId = params.topicId as string; // Aseguramos que usamos el nombre correcto del parámetro

	const router = useRouter();
	const { t } = useTranslation();
	const { topic, loading, setTopic, refetchTopic } = useTopic();

	// Estados para UI
	const [activeTab, setActiveTab] = useState("subtopics");
	const [editMode, setEditMode] = useState(false);
	const [editedTopic, setEditedTopic] = useState(topic);
	const [showAddSubtopicModal, setShowAddSubtopicModal] = useState(false);
	const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(
		null
	);
	const [deletingSubtopicId, setDeletingSubtopicId] = useState<string>("");
	const [showDeleteSubtopicModal, setShowDeleteSubtopicModal] =
		useState(false);
	const [subtopicToDelete, setSubtopicToDelete] = useState<string>("");

	// Simulación de llamadas a la API
	const { makeRequest: addSubtopic, loading: addingSubtopic } = useApiRequest(
		`/api/subjects/${id}/topics/${topicId}/subtopics`,
		"POST",
		null,
		false
	);

	const { makeRequest: editSubtopic, loading: editingSubtopicLoading } =
		useApiRequest("", "PUT", null, false);

	const { makeRequest: deleteSubtopic, loading: deletingSubtopic } =
		useApiRequest("", "DELETE", null, false);

	const { makeRequest: updateTopic, loading: updatingTopic } = useApiRequest(
		`/api/subjects/${id}/topics/${topicId}`,
		"PUT",
		null,
		false
	);

	const { data: questions, loading: loadingQuestions } = useApiRequest(
		`/api/subjects/${id}/topics/${topicId}/questions`,
		"GET",
		MOCK_QUESTIONS,
		true
	);

	// Simular la carga de preguntas
	useEffect(() => {
		// TODO: Implementar la llamada real a la API cuando esté disponible
		// Por ahora usamos los datos simulados de MOCK_QUESTIONS
	}, []);

	// Sincronizar estado local cuando cambia el topic en el contexto
	useEffect(() => {
		if (topic) {
			setEditedTopic(topic);
		}
	}, [topic]);

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	// Manejadores para temas
	const handleEditToggle = () => {
		setEditMode(!editMode);
		if (editMode && topic) {
			// Reset to original values if canceling edit
			setEditedTopic(topic);
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setEditedTopic((prev) => (prev ? { ...prev, [name]: value } : null));
	};

	const handleSaveTopicChanges = async () => {
		if (!editedTopic) return;

		try {
			// TODO: Implementar la llamada real a la API cuando esté disponible
			const response = await updateTopic(editedTopic);

			if (response.success) {
				await refetchTopic();
				setEditMode(false);
			}
		} catch (error) {
			console.error("Error al actualizar el tema:", error);
		}
	};

	// Manejadores para subtemas
	const handleAddSubtopicRequest = () => {
		setShowAddSubtopicModal(true);
	};

	const handleAddSubtopic = async (title: string, description: string) => {
		if (!topic) return;

		try {
			// TODO: Implementar la llamada real a la API cuando esté disponible
			const response = await addSubtopic({ title, description });

			if (response.success) {
				await refetchTopic();
				setShowAddSubtopicModal(false);
			}
		} catch (error) {
			console.error("Error al añadir subtema:", error);
		}
	};

	const handleEditSubtopicRequest = (subtopic: Subtopic) => {
		setEditingSubtopic(subtopic);
	};

	const handleSaveSubtopic = async (
		subtopicId: string,
		title: string,
		description: string
	) => {
		if (!topic) return;

		try {
			// TODO: Implementar la llamada real a la API cuando esté disponible
			const response = await editSubtopic(
				{ title, description },
				false,
				`${id}/topics/${topicId}/subtopics/${subtopicId}`
			);

			if (response.success) {
				await refetchTopic();
				setEditingSubtopic(null);
			}
		} catch (error) {
			console.error("Error al editar subtema:", error);
		}
	};

	const handleConfirmDeleteSubtopic = (subtopicId: string) => {
		setSubtopicToDelete(subtopicId);
		setShowDeleteSubtopicModal(true);
	};

	const handleDeleteSubtopic = async () => {
		if (!topic || !subtopicToDelete) return;

		try {
			setDeletingSubtopicId(subtopicToDelete);

			// TODO: Implementar la llamada real a la API cuando esté disponible
			const response = await deleteSubtopic(
				null,
				false,
				`${id}/topics/${topicId}/subtopics/${subtopicToDelete}`
			);

			if (response.success) {
				await refetchTopic();
				setShowDeleteSubtopicModal(false);
				setSubtopicToDelete("");
			}
		} catch (error) {
			console.error("Error al eliminar subtema:", error);
		} finally {
			setDeletingSubtopicId("");
		}
	};

	if (loading) {
		return (
			<div className="p-6 sm:p-8">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
					<span className="ml-3 text-lg text-gray-700">
						{t("topicDetail.loading") || "Cargando..."}
					</span>
				</div>
			</div>
		);
	}

	if (!topic) {
		return (
			<div className="p-6 sm:p-8">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-700">
						{t("topicDetail.topicNotFound") || "Tema no encontrado"}
					</h2>
					<Link
						href={`/manager/subjects/${id}`}
						className="mt-4 inline-block text-blue-600 hover:underline"
					>
						{t("topicDetail.backToSubject") ||
							"Volver a la asignatura"}
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
						{topic.subjectTitle}
					</Link>
					<span className="mx-2">&gt;</span>
					<span className="text-gray-900">{topic.title}</span>
				</div>

				<h1 className="text-3xl font-bold">{topic.title}</h1>
				<p className="text-gray-700 mt-2">{topic.description}</p>
			</div>

			{/* Tabs de navegación */}
			<div className="border-b border-gray-200 mb-6">
				<nav className="-mb-px flex space-x-8">
					<button
						onClick={() => handleTabChange("subtopics")}
						className={`py-4 px-1 ${
							activeTab === "subtopics"
								? "border-b-2 border-indigo-500 font-medium text-indigo-600"
								: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						}`}
					>
						{t("topicDetail.subtopics") || "Subtemas"}
					</button>
					<button
						onClick={() => handleTabChange("information")}
						className={`py-4 px-1 ${
							activeTab === "information"
								? "border-b-2 border-indigo-500 font-medium text-indigo-600"
								: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						}`}
					>
						{t("topicDetail.information") || "Información"}
					</button>
					<button
						onClick={() => handleTabChange("questions")}
						className={`py-4 px-1 ${
							activeTab === "questions"
								? "border-b-2 border-indigo-500 font-medium text-indigo-600"
								: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						}`}
					>
						{t("topicDetail.questions") || "Preguntas"}
					</button>
				</nav>
			</div>

			{/* Contenido de las tabs */}
			<div className="mt-6">
				{activeTab === "subtopics" && topic && (
					<SubtopicsTab
						topicId={topicId}
						subjectId={id}
						subtopics={topic.subtopics}
						handleAddSubtopic={handleAddSubtopicRequest}
						handleEditSubtopic={handleEditSubtopicRequest}
						handleDeleteSubtopic={handleConfirmDeleteSubtopic}
						isLoading={addingSubtopic}
						deletingSubtopicId={deletingSubtopicId}
					/>
				)}

				{activeTab === "information" && topic && editedTopic && (
					<InformationTab
						topic={topic}
						editMode={editMode}
						editedTopic={editedTopic}
						onEditToggle={handleEditToggle}
						onInputChange={handleInputChange}
						onSaveChanges={handleSaveTopicChanges}
						isLoading={updatingTopic}
					/>
				)}

				{activeTab === "questions" && (
					<QuestionsTab topicId={topicId} subjectId={id} />
				)}
			</div>

			{/* Modales */}
			{showAddSubtopicModal && (
				<AddSubtopicModal
					onClose={() => setShowAddSubtopicModal(false)}
					onAdd={handleAddSubtopic}
					isLoading={addingSubtopic}
				/>
			)}

			{editingSubtopic && (
				<EditSubtopicModal
					subtopic={editingSubtopic}
					onClose={() => setEditingSubtopic(null)}
					onSave={handleSaveSubtopic}
					isLoading={editingSubtopicLoading}
				/>
			)}

			{/* Modal de confirmación para eliminar subtema */}
			<ConfirmationModal
				isOpen={showDeleteSubtopicModal}
				title={
					t("confirmation.deleteSubtopic.title") || "Eliminar subtema"
				}
				message={
					t("confirmation.deleteSubtopic.message") ||
					"¿Estás seguro de que deseas eliminar este subtema? Esta acción no se puede deshacer."
				}
				confirmButtonText={t("common.delete") || "Eliminar"}
				onConfirm={handleDeleteSubtopic}
				onCancel={() => setShowDeleteSubtopicModal(false)}
				isLoading={deletingSubtopic}
				isDanger={true}
			/>
		</div>
	);
};

// Componente principal con el provider del contexto
export default function TopicSubtopicsPage() {
	return (
		<TopicProvider>
			<TopicSubtopicsContent />
		</TopicProvider>
	);
}
