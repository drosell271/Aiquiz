// /app/manager/subjects/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import useApiRequest from "../../hooks/useApiRequest";
import { useClipboard } from "../../hooks/useClipboard";
import { Subject, Topic, Professor } from "../../contexts/SubjectContext";

// Importamos los componentes actualizados
import TopicsTab from "../../components/topics/TopicsTab";
import ProfessorsTab from "../../components/topics/ProfessorsTab";
import SettingsTab from "../../components/topics/SettingsTab";
import InviteModal from "../../components/topics/InviteModal";
import EditTopicModal from "../../components/topics/EditTopicModal";
import SubjectDetailSidebar from "../../components/topics/SubjectDetailSidebar";

export default function SubjectDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const { t } = useTranslation();
	const { copied, copyToClipboard } = useClipboard();

	// Estados para UI
	const [activeTab, setActiveTab] = useState("topics");
	const [editMode, setEditMode] = useState(false);
	const [editedSubject, setEditedSubject] = useState<Subject | null>(null);
	const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [deletingTopicId, setDeletingTopicId] = useState<string>("");

	// Datos de la asignatura
	const {
		data: subject,
		loading,
		error,
		makeRequest: refetchSubject,
	} = useApiRequest(`/api/subjects/${id}`, "GET", null, true);

	// Sincronizar estado local cuando llegan los datos
	useEffect(() => {
		if (subject) {
			setEditedSubject(subject);
		}
	}, [subject]);

	// API para añadir profesor
	const { makeRequest: addProfessor, loading: addingProfessor } =
		useApiRequest(`/api/subjects/${id}/professors`, "POST", null, false);

	// API para eliminar profesor
	const { makeRequest: removeProfessor, loading: removingProfessor } =
		useApiRequest("", "DELETE", null, false);

	// API para añadir tema
	const { makeRequest: addTopic, loading: addingTopic } = useApiRequest(
		`/api/subjects/${id}/topics`,
		"POST",
		null,
		false
	);

	// API para editar tema
	const { makeRequest: editTopic, loading: editingTopicLoading } =
		useApiRequest("", "PATCH", null, false);

	// API para eliminar tema
	const { makeRequest: deleteTopic, loading: deletingTopic } = useApiRequest(
		"",
		"DELETE",
		null,
		false
	);

	// API para guardar cambios de la asignatura
	const { makeRequest: saveSubject, loading: savingSubject } = useApiRequest(
		`/api/subjects/${id}`,
		"PUT",
		null,
		false
	);

	// API para eliminar la asignatura
	const { makeRequest: deleteSubjectRequest, loading: deletingSubject } =
		useApiRequest(`/api/subjects/${id}`, "DELETE", null, false);

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	const handleCopySubjectUrl = () => {
		if (subject) {
			const url = `http://localhost:3000/${subject.acronym}`;
			copyToClipboard(url);
		}
	};

	// Handlers para la pantalla de ajustes
	const handleEditToggle = () => {
		setEditMode(!editMode);
		if (editMode && subject) {
			// Reset to original values if canceling edit
			setEditedSubject(subject);
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setEditedSubject((prev) => (prev ? { ...prev, [name]: value } : null));
	};

	const handleSaveChanges = async () => {
		if (!editedSubject) return;

		try {
			const response = await saveSubject(editedSubject);
			if (response.success) {
				refetchSubject(); // Recargar datos actualizados
				setEditMode(false);
			}
		} catch (error) {
			console.error("Error al actualizar la asignatura:", error);
		}
	};

	const handleAddProfessor = async (name: string, email: string) => {
		if (!subject) return;

		try {
			const response = await addProfessor({ name, email });
			if (response.success) {
				refetchSubject(); // Recargar los datos después de añadir
				setShowInviteModal(false);
			}
		} catch (error) {
			console.error("Error al añadir profesor:", error);
		}
	};

	const handleRemoveProfessor = async (professorId: string) => {
		if (!subject) return;

		try {
			const response = await removeProfessor(
				null,
				false,
				`${id}/professors/${professorId}`
			);
			if (response.success) {
				refetchSubject(); // Recargar los datos después de eliminar
			}
		} catch (error) {
			console.error("Error al eliminar profesor:", error);
		}
	};

	const handleAddTopicRequest = async () => {
		if (!subject) return;

		try {
			const newTopic = {
				title: t("subjectDetail.newTopic"),
				description: "",
			};

			const response = await addTopic(newTopic, true); // Forzar nueva llamada
			if (response.success) {
				refetchSubject(); // Recargar los datos después de añadir
			}
		} catch (error) {
			console.error("Error al añadir tema:", error);
		}
	};

	const handleEditTopicRequest = async (
		topicId: string,
		newTitle: string
	) => {
		if (!subject) return;

		try {
			const response = await editTopic(
				{ title: newTitle },
				false,
				`${id}/topics/${topicId}`
			);

			if (response.success) {
				refetchSubject(); // Recargar los datos después de editar
				setEditingTopic(null);
			}
		} catch (error) {
			console.error("Error al actualizar tema:", error);
		}
	};

	const handleDeleteTopicRequest = async (topicId: string) => {
		if (!subject) return;

		try {
			setDeletingTopicId(topicId);
			const response = await deleteTopic(
				null,
				false,
				`${id}/topics/${topicId}`
			);

			if (response.success) {
				refetchSubject(); // Recargar los datos después de eliminar
			}
		} catch (error) {
			console.error("Error al eliminar tema:", error);
		} finally {
			setDeletingTopicId("");
		}
	};

	const handleDeleteSubject = async () => {
		try {
			const response = await deleteSubjectRequest();
			if (response.success) {
				router.push("/manager/subjects");
			}
		} catch (error) {
			console.error("Error al eliminar asignatura:", error);
		}
	};

	if (loading) {
		return (
			<div className="p-6 sm:p-8">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
					<span className="ml-3 text-lg text-gray-700">
						{t("subjectDetail.loading")}
					</span>
				</div>
			</div>
		);
	}

	if (error || !subject) {
		return (
			<div className="p-6 sm:p-8">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-700">
						{t("subjectDetail.subjectNotFound")}
					</h2>
					<Link
						href="/manager/subjects"
						className="mt-4 inline-block text-blue-600 hover:underline"
					>
						{t("subjectDetail.backToSubjects")}
					</Link>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* Sidebar fijo en el lado izquierdo */}
			<div className="fixed top-16 left-0 bottom-0 w-64 z-40">
				<SubjectDetailSidebar
					subjectId={subject.id}
					subjectTitle={subject.title}
					topics={subject.topics}
				/>
			</div>

			<div className="p-6 sm:p-8">
				{/* Breadcrumbs y título */}
				<div className="mb-6">
					<div className="flex items-center text-sm text-gray-500 mb-2">
						<Link
							href="/manager/subjects"
							className="hover:text-gray-700"
						>
							{t("navigation.subjects")}
						</Link>
						<span className="mx-2">&gt;</span>
						<Link
							href={`/manager/subjects/${id}`}
							className="hover:text-gray-700"
						>
							{subject.title}
						</Link>
					</div>

					<div className="flex items-center justify-between">
						<h1 className="text-3xl font-bold flex items-center">
							{subject.title}
							<button
								onClick={handleCopySubjectUrl}
								className="ml-2 focus:outline-none"
								title={
									copied
										? t("subjectDetail.copied")
										: t("subjectDetail.copyLink")
								}
							>
								<svg
									className={`w-6 h-6 ${
										copied
											? "text-green-500"
											: "text-gray-500 hover:text-gray-700"
									}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/>
								</svg>
							</button>
						</h1>
					</div>

					<p className="text-gray-700 mt-2">
						{subject.description.length > 150
							? subject.description.substring(0, 150) + "..."
							: subject.description}
					</p>
				</div>

				{/* Tabs de navegación */}
				<div className="border-b border-gray-200 mb-6">
					<nav className="-mb-px flex space-x-8">
						<button
							onClick={() => handleTabChange("topics")}
							className={`py-4 px-1 ${
								activeTab === "topics"
									? "border-b-2 border-indigo-500 font-medium text-indigo-600"
									: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							}`}
						>
							{t("subjectDetail.topics")}
						</button>
						<button
							onClick={() => handleTabChange("professors")}
							className={`py-4 px-1 ${
								activeTab === "professors"
									? "border-b-2 border-indigo-500 font-medium text-indigo-600"
									: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							}`}
						>
							{t("subjectDetail.professors")}
						</button>
						<button
							onClick={() => handleTabChange("settings")}
							className={`py-4 px-1 ${
								activeTab === "settings"
									? "border-b-2 border-indigo-500 font-medium text-indigo-600"
									: "border-b-2 border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							}`}
						>
							{t("subjectDetail.settings")}
						</button>
					</nav>
				</div>

				{/* Contenido de las tabs */}
				<div className="mt-6">
					{activeTab === "topics" && (
						<TopicsTab
							subjectId={subject.id}
							topics={subject.topics}
							handleAddTopic={handleAddTopicRequest}
							handleDeleteTopic={handleDeleteTopicRequest}
							isLoading={addingTopic}
							deletingTopicId={deletingTopicId}
						/>
					)}

					{activeTab === "professors" && (
						<>
							<button
								className="mb-6 bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
								onClick={() => setShowInviteModal(true)}
								disabled={addingProfessor}
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
										d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
									/>
								</svg>
								{t("subjectDetail.inviteProfessor")}
							</button>

							<ProfessorsTab
								professors={subject.professors}
								onRemoveProfessor={handleRemoveProfessor}
								isLoading={removingProfessor}
							/>

							{showInviteModal && (
								<InviteModal
									onClose={() => setShowInviteModal(false)}
									onInvite={handleAddProfessor}
									isLoading={addingProfessor}
								/>
							)}
						</>
					)}

					{activeTab === "settings" && editedSubject && (
						<SettingsTab
							subject={subject}
							editMode={editMode}
							editedSubject={editedSubject}
							onEditToggle={handleEditToggle}
							onInputChange={handleInputChange}
							onSaveChanges={handleSaveChanges}
							onEditTopic={handleEditTopicRequest}
							onDeleteTopic={handleDeleteTopicRequest}
							onDeleteSubject={handleDeleteSubject}
							isLoading={savingSubject || deletingSubject}
							isDeletingTopic={Boolean(deletingTopicId)}
						/>
					)}

					{/* Modales */}
					{editingTopic && (
						<EditTopicModal
							topic={editingTopic}
							onClose={() => setEditingTopic(null)}
							onSave={handleEditTopicRequest}
							isLoading={editingTopicLoading}
						/>
					)}
				</div>
			</div>
		</>
	);
}
