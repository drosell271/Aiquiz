// /app/manager/subjects/[id]/page.tsx (versión con multiidioma)
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import subjectData from "../../data/subject-details.json";

// Interfaces
interface Topic {
	id: string;
	title: string;
	description: string;
	subtopics: Array<{
		id: string;
		title: string;
	}>;
}

interface Professor {
	id: string;
	name: string;
	email: string;
	role: string;
}

interface Subject {
	id: string;
	title: string;
	acronym: string;
	description: string;
	topics: Topic[];
	professors: Professor[];
}

export default function SubjectDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const { t } = useTranslation();

	const [subject, setSubject] = useState<Subject | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("topics");

	// Datos para la pantalla de ajustes
	const [editMode, setEditMode] = useState(false);
	const [editedSubject, setEditedSubject] = useState<Subject | null>(null);

	// Estados para la pantalla de profesores
	const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(
		null
	);
	const [newProfessor, setNewProfessor] = useState({
		name: "",
		email: "",
		role: "Admin",
	});

	useEffect(() => {
		const fetchSubjectDetails = async () => {
			setLoading(true);
			try {
				// TODO: Reemplazar con llamada real a la API cuando esté implementada
				// const response = await fetch(`/api/subjects/${id}`, {
				//   headers: {
				//     'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
				//   }
				// });
				// const data = await response.json();

				console.log(`📤 Simulando petición GET a /api/subjects/${id}`);

				// Usar los datos del JSON
				setTimeout(() => {
					console.log(
						`📥 Respuesta simulada recibida para asignatura ${id}`
					);
					setSubject(subjectData);
					setEditedSubject(subjectData);
					setLoading(false);
				}, 800);
			} catch (error) {
				console.error("Error fetching subject details:", error);
				setLoading(false);
			}
		};

		if (id) {
			fetchSubjectDetails();
		}
	}, [id]);

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	// Handlers para la pantalla de ajustes
	const handleEditToggle = () => {
		setEditMode(!editMode);
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setEditedSubject((prev) => (prev ? { ...prev, [name]: value } : null));
	};

	const handleSaveChanges = () => {
		if (!editedSubject) return;

		console.log(`📤 Simulando petición PUT a /api/subjects/${id}`);
		console.log("Datos enviados:", editedSubject);

		// Simular guardado exitoso
		setTimeout(() => {
			console.log(`📥 Respuesta simulada: actualización exitosa`);
			setSubject(editedSubject);
			setEditMode(false);
		}, 800);
	};

	const handleAddProfessor = () => {
		console.log(
			`📤 Simulando petición POST a /api/subjects/${id}/professors`
		);
		console.log("Datos enviados:", newProfessor);

		// Simular añadir profesor
		setTimeout(() => {
			console.log(`📥 Respuesta simulada: profesor añadido exitosamente`);
			if (subject && newProfessor.name && newProfessor.email) {
				const newProfessorWithId = {
					...newProfessor,
					id: `temp-${Date.now()}`,
				};

				setSubject({
					...subject,
					professors: [...subject.professors, newProfessorWithId],
				});

				// Resetear formulario
				setNewProfessor({ name: "", email: "", role: "Admin" });
			}
		}, 800);
	};

	const handleRemoveProfessor = (professorId: string) => {
		console.log(
			`📤 Simulando petición DELETE a /api/subjects/${id}/professors/${professorId}`
		);

		// Simular eliminar profesor
		setTimeout(() => {
			console.log(
				`📥 Respuesta simulada: profesor eliminado exitosamente`
			);
			if (subject) {
				setSubject({
					...subject,
					professors: subject.professors.filter(
						(p) => p.id !== professorId
					),
				});
			}
		}, 800);
	};

	const handleChangeRole = (professorId: string, newRole: string) => {
		console.log(
			`📤 Simulando petición PATCH a /api/subjects/${id}/professors/${professorId}`
		);
		console.log("Nuevo rol:", newRole);

		// Simular cambio de rol
		setTimeout(() => {
			console.log(`📥 Respuesta simulada: rol actualizado exitosamente`);
			if (subject) {
				setSubject({
					...subject,
					professors: subject.professors.map((p) =>
						p.id === professorId ? { ...p, role: newRole } : p
					),
				});
				setShowRoleDropdown(null);
			}
		}, 800);
	};

	const handleAddTopic = () => {
		console.log(`📤 Simulando petición POST a /api/subjects/${id}/topics`);
		console.log("Datos enviados: Nuevo tema");

		// Simular añadir tema
		setTimeout(() => {
			console.log(`📥 Respuesta simulada: tema añadido exitosamente`);
			if (subject) {
				const newTopic = {
					id: `topic-${Date.now()}`,
					title: t("subjectDetail.newTopic"),
					description: "",
					subtopics: [],
				};

				setSubject({
					...subject,
					topics: [...subject.topics, newTopic],
				});
			}
		}, 800);
	};

	const renderTopicsTab = () => {
		if (!subject) return null;

		return (
			<div>
				<div className="flex items-center mb-4">
					<div className="relative w-full max-w-md">
						<input
							type="text"
							placeholder={t("subjectDetail.searchPlaceholder")}
							className="w-full p-2 pl-10 border rounded-md"
						/>
						<div className="absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								className="w-5 h-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
					</div>

					<button
						onClick={handleAddTopic}
						className="ml-4 bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
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
								d="M12 4v16m8-8H4"
							/>
						</svg>
						{t("subjectDetail.newTopic")}
					</button>
				</div>

				{subject.topics.map((topic) => (
					<div
						key={topic.id}
						className="mb-8 bg-gray-50 p-6 rounded-md"
					>
						<div className="flex justify-between mb-2">
							<h3 className="text-xl font-bold flex items-center">
								{topic.title}
								<Link
									href={`/manager/subjects/${id}/topics/${topic.id}`}
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
				))}
			</div>
		);
	};

	const renderProfessorsTab = () => {
		if (!subject) return null;

		return (
			<div>
				<button
					className="mb-6 bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
					onClick={() => {
						/* Mostrar modal de invitación */
					}}
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

				{/* Formulario mejorado para añadir profesor */}
				<div className="mb-8 p-6 bg-gray-50 rounded-md">
					<h3 className="text-lg font-medium mb-4">
						{t("subjectDetail.addProfessor")}
					</h3>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="professorName"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{t("subjectDetail.name")}
							</label>
							<input
								id="professorName"
								type="text"
								placeholder={t("subjectDetail.namePlaceholder")}
								className="w-full p-2 border rounded-md"
								value={newProfessor.name}
								onChange={(e) =>
									setNewProfessor({
										...newProfessor,
										name: e.target.value,
									})
								}
							/>
						</div>

						<div>
							<label
								htmlFor="professorEmail"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{t("subjectDetail.email")}
							</label>
							<input
								id="professorEmail"
								type="email"
								placeholder={t(
									"subjectDetail.emailPlaceholder"
								)}
								className="w-full p-2 border rounded-md"
								value={newProfessor.email}
								onChange={(e) =>
									setNewProfessor({
										...newProfessor,
										email: e.target.value,
									})
								}
							/>
						</div>

						<div>
							<label
								htmlFor="professorRole"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{t("subjectDetail.role")}
							</label>
							<select
								id="professorRole"
								className="w-full p-2 border rounded-md"
								value={newProfessor.role}
								onChange={(e) =>
									setNewProfessor({
										...newProfessor,
										role: e.target.value,
									})
								}
							>
								<option value="Admin">Admin</option>
								<option value="Viewer">Viewer</option>
							</select>
						</div>

						<button
							className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
							onClick={handleAddProfessor}
							disabled={!newProfessor.name || !newProfessor.email}
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
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							{t("subjectDetail.addProfessor")}
						</button>
					</div>
				</div>

				{/* Lista de profesores */}
				<h3 className="text-lg font-medium mb-4">
					{t("subjectDetail.professors")}
				</h3>
				{subject.professors.length === 0 ? (
					<p className="text-gray-500 italic">
						No hay profesores asignados a esta asignatura.
					</p>
				) : (
					subject.professors.map((professor) => (
						<div
							key={professor.id}
							className="flex items-center justify-between p-4 border-b last:border-b-0"
						>
							<div className="flex-grow">
								<div className="font-medium">
									{professor.name}
								</div>
								<div className="text-gray-600">
									{professor.email}
								</div>
							</div>

							<div className="relative flex items-center">
								<div className="mr-4">
									{showRoleDropdown === professor.id ? (
										<div className="absolute right-12 top-0 bg-white border rounded-md shadow-lg z-10">
											<button
												className="block w-full text-left px-4 py-2 hover:bg-gray-100"
												onClick={() =>
													handleChangeRole(
														professor.id,
														"Admin"
													)
												}
											>
												Admin
											</button>
											<button
												className="block w-full text-left px-4 py-2 hover:bg-gray-100"
												onClick={() =>
													handleChangeRole(
														professor.id,
														"Viewer"
													)
												}
											>
												Viewer
											</button>
										</div>
									) : (
										<button
											className="bg-gray-100 px-3 py-1 rounded-md text-sm"
											onClick={() =>
												setShowRoleDropdown(
													professor.id
												)
											}
										>
											{professor.role}
										</button>
									)}
								</div>

								<button
									className="text-gray-500 hover:text-gray-700 mr-2"
									title={t("subjectDetail.edit")}
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
									className="text-red-500 hover:text-red-700"
									title={t("subjectDetail.delete")}
									onClick={() =>
										handleRemoveProfessor(professor.id)
									}
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
						</div>
					))
				)}
			</div>
		);
	};

	const renderSettingsTab = () => {
		if (!subject || !editedSubject) return null;

		return (
			<div>
				{editMode ? (
					<div className="flex gap-4 mb-6">
						<button
							className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
							onClick={handleSaveChanges}
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
									d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
								/>
							</svg>
							{t("subjectDetail.saveChanges")}
						</button>

						<button
							className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md"
							onClick={() => {
								setEditMode(false);
								setEditedSubject(subject); // Restaurar valores originales
							}}
						>
							{t("subjectDetail.cancel")}
						</button>
					</div>
				) : (
					<div className="mb-6">
						<button
							className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center"
							onClick={handleEditToggle}
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
							{t("subjectDetail.edit")}
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
							onChange={handleInputChange}
							className="w-full p-2 border rounded-md"
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
							onChange={handleInputChange}
							className="w-full p-2 border rounded-md"
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
							onChange={handleInputChange}
							className="w-full p-2 border rounded-md h-32"
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
						{subject.topics.map((topic, index) => (
							<div
								key={topic.id}
								className="p-4 bg-gray-100 rounded-md flex justify-between items-center"
							>
								<span>{topic.title}</span>
								{editMode && (
									<div className="flex">
										<button className="text-gray-600 hover:text-gray-800 mr-2">
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
										<button className="text-red-500 hover:text-red-700">
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
						{editMode && (
							<div className="p-4 bg-gray-100 rounded-md flex justify-center items-center">
								<button
									className="text-gray-600 hover:text-gray-800"
									onClick={handleAddTopic}
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
											d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										/>
									</svg>
								</button>
							</div>
						)}
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
						className="bg-red-800 text-white py-2 px-4 rounded-md flex items-center"
						onClick={() => {
							console.log(
								`📤 Simulando petición DELETE a /api/subjects/${id}`
							);
							setTimeout(() => {
								console.log(
									`📥 Respuesta simulada: asignatura eliminada`
								);
								router.push("/manager/subjects");
							}, 800);
						}}
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
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						{t("subjectDetail.delete")}
					</button>
				</div>
			</div>
		);
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
						<svg
							className="ml-2 w-6 h-6 text-gray-500"
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
				{activeTab === "topics" && renderTopicsTab()}
				{activeTab === "professors" && renderProfessorsTab()}
				{activeTab === "settings" && renderSettingsTab()}
			</div>
		</div>
	);
}
