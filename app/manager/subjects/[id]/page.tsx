// /app/manager/subjects/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import apiService from "../../services/apiService";
import { Subject, Topic } from "../../contexts/SubjectContext";
import SubjectDetailSidebar from "../../components/topics/SubjectDetailSidebar";

// Importamos los componentes necesarios
import TopicsTab from "../../components/topics/TopicsTab";
import ProfessorsTab from "../../components/topics/ProfessorsTab";
import SettingsTab from "../../components/topics/SettingsTab";
import InviteModal from "../../components/topics/InviteModal";
import EditTopicModal from "../../components/topics/EditTopicModal";

export default function SubjectDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const { t } = useTranslation();
	const fetchedRef = useRef(false);

	// Estados
	const [subject, setSubject] = useState<Subject | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("topics");
	const [copied, setCopied] = useState(false);

	// Datos para la pantalla de ajustes
	const [editMode, setEditMode] = useState(false);
	const [editedSubject, setEditedSubject] = useState<Subject | null>(null);
	const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
	const [showInviteModal, setShowInviteModal] = useState(false);

	// Cargar datos de la asignatura
	useEffect(() => {
		// Evitar llamadas duplicadas
		if (fetchedRef.current) return;

		const fetchSubjectData = async () => {
			setLoading(true);
			try {
				// TODO: Reemplazar con llamada real a la API cuando esté implementada
				console.log("🔄 Cargando datos de asignatura desde page.tsx");
				const data = await apiService.simulateApiCall(
					`/api/subjects/${id}`
				);
				setSubject(data);
				setEditedSubject(data);
				fetchedRef.current = true;
			} catch (error) {
				console.error("Error fetching subject details:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSubjectData();

		return () => {
			// Al desmontar el componente, resetear el flag
			fetchedRef.current = false;
		};
	}, [id]);

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	// Función para copiar la URL al portapapeles
	const copyToClipboard = (text: string) => {
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(text)
				.then(() => {
					setCopied(true);
					// Reset copied state after 2 seconds
					setTimeout(() => setCopied(false), 2000);
				})
				.catch((error) => {
					console.error("Error copying to clipboard:", error);
					setCopied(false);
				});
		} else {
			// Fallback for browsers that don't support clipboard API
			try {
				const textArea = document.createElement("textarea");
				textArea.value = text;
				textArea.style.position = "fixed";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				const successful = document.execCommand("copy");
				document.body.removeChild(textArea);
				setCopied(successful);
				if (successful) {
					setTimeout(() => setCopied(false), 2000);
				}
			} catch (error) {
				console.error("Fallback: Error copying to clipboard:", error);
				setCopied(false);
			}
		}
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
			// TODO: Reemplazar con llamada real a la API cuando esté implementada
			const response = await apiService.simulateApiCall(
				`/api/subjects/${id}`,
				"PUT",
				editedSubject
			);

			if (response.success) {
				setSubject(editedSubject);
				setEditMode(false);
			}
		} catch (error) {
			console.error("Error updating subject:", error);
		}
	};

	const handleAddProfessor = async (name: string, email: string) => {
		if (!subject) return;

		try {
			// TODO: Reemplazar con llamada real a la API cuando esté implementada
			const response = await apiService.simulateApiCall(
				`/api/subjects/${id}/professors`,
				"POST",
				{ name, email }
			);

			if (response.success) {
				const newProfessor = {
					id: response.id,
					name,
					email,
				};

				const updatedSubject = {
					...subject,
					professors: [...subject.professors, newProfessor],
				};

				setSubject(updatedSubject);
				if (editedSubject) {
					setEditedSubject(updatedSubject);
				}
			}
		} catch (error) {
			console.error("Error adding professor:", error);
		}
	};

	const handleRemoveProfessor = async (professorId: string) => {
		if (!subject) return;

		try {
			// TODO: Reemplazar con llamada real a la API cuando esté implementada
			const response = await apiService.simulateApiCall(
				`/api/subjects/${id}/professors/${professorId}`,
				"DELETE"
			);

			if (response.success) {
				const updatedSubject = {
					...subject,
					professors: subject.professors.filter(
						(p) => p.id !== professorId
					),
				};

				setSubject(updatedSubject);
				if (editedSubject) {
					setEditedSubject(updatedSubject);
				}
			}
		} catch (error) {
			console.error("Error removing professor:", error);
		}
	};

	const handleAddTopic = async () => {
		if (!subject) return;

		try {
			// TODO: Reemplazar con llamada real a la API cuando esté implementada
			const newTopic = {
				title: t("subjectDetail.newTopic"),
				description: "",
			};

			const response = await apiService.simulateApiCall(
				`/api/subjects/${id}/topics`,
				"POST",
				newTopic
			);

			if (response.success) {
				const topicWithId: Topic = {
					...newTopic,
					id: response.id || `topic-${Date.now()}`,
					subtopics: [],
				};

				const updatedSubject = {
					...subject,
					topics: [...subject.topics, topicWithId],
				};

				setSubject(updatedSubject);
				if (editedSubject) {
					setEditedSubject(updatedSubject);
				}
			}
		} catch (error) {
			console.error("Error adding topic:", error);
		}
	};

	const handleEditTopic = async (topicId: string, newTitle: string) => {
		if (!subject) return;

		try {
			// TODO: Reemplazar con llamada real a la API cuando esté implementada
			const response = await apiService.simulateApiCall(
				`/api/subjects/${id}/topics/${topicId}`,
				"PATCH",
				{ title: newTitle }
			);

			if (response.success) {
				const updatedTopics = subject.topics.map((topic) =>
					topic.id === topicId ? { ...topic, title: newTitle } : topic
				);

				const updatedSubject = {
					...subject,
					topics: updatedTopics,
				};

				setSubject(updatedSubject);
				if (editedSubject) {
					setEditedSubject(updatedSubject);
				}
			}
		} catch (error) {
			console.error("Error updating topic:", error);
		}
	};

	const handleDeleteSubject = async () => {
		try {
			// TODO: Reemplazar con llamada real a la API cuando esté implementada
			const response = await apiService.simulateApiCall(
				`/api/subjects/${id}`,
				"DELETE"
			);

			if (response.success) {
				router.push("/manager/subjects");
			}
		} catch (error) {
			console.error("Error deleting subject:", error);
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

	if (!subject) {
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
					subjectId={id as string}
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
							handleAddTopic={handleAddTopic}
						/>
					)}

					{activeTab === "professors" && (
						<>
							<button
								className="mb-6 bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
								onClick={() => setShowInviteModal(true)}
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
							/>

							{showInviteModal && (
								<InviteModal
									onClose={() => setShowInviteModal(false)}
									onInvite={handleAddProfessor}
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
							onEditTopic={handleEditTopic}
						/>
					)}

					{/* Modales */}
					{editingTopic && (
						<EditTopicModal
							topic={editingTopic}
							onClose={() => setEditingTopic(null)}
							onSave={handleEditTopic}
						/>
					)}
				</div>
			</div>
		</>
	);
}
