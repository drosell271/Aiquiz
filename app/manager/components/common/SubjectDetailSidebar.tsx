// /app/manager/components/common/SubjectDetailSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Topic } from "../../contexts/SubjectContext";

interface SubjectDetailSidebarProps {
	subjectId: string;
	subjectTitle: string;
	topics: Topic[];
}

/**
 * Barra lateral para la navegación detallada de una asignatura
 */
const SubjectDetailSidebar: React.FC<SubjectDetailSidebarProps> = ({
	subjectId,
	subjectTitle,
	topics = [], // Valor predeterminado seguro
}) => {
	const pathname = usePathname();
	const [expandedTopics, setExpandedTopics] = useState<
		Record<string, boolean>
	>({});

	/**
	 * Inicializa los temas expandidos al cargar el componente
	 */
	useEffect(() => {
		// Skip if topics not available
		if (!topics || topics.length === 0) return;

		const initialExpanded: Record<string, boolean> = {};

		// Expand topics with subtopics by default
		topics.forEach((topic) => {
			if (topic?.subtopics?.length > 0) {
				initialExpanded[topic.id] = true;
			}
		});

		setExpandedTopics(initialExpanded);
	}, [topics]);

	/**
	 * Mantiene expandido el tema activo cuando cambia la ruta
	 */
	useEffect(() => {
		if (!pathname) return;

		// Check if we're on a topic page
		if (pathname?.includes("/topics/")) {
			const pathParts = pathname.split("/");
			// Find topic ID in URL
			const topicIndex = pathParts.findIndex((part) => part === "topics");
			const topicId =
				topicIndex >= 0 && pathParts.length > topicIndex + 1
					? pathParts[topicIndex + 1]
					: null;

			// Only update state if we have a topic ID and it's not already expanded
			if (topicId && !expandedTopics[topicId]) {
				setExpandedTopics((prev) => ({
					...prev,
					[topicId]: true,
				}));
			}
		}
	}, [pathname, expandedTopics]);

	/**
	 * Alterna la expansión de un tema
	 * @param topicId ID del tema a expandir/contraer
	 */
	const toggleTopic = (topicId: string): void => {
		setExpandedTopics((prev) => ({
			...prev,
			[topicId]: !prev[topicId],
		}));
	};

	/**
	 * Verifica si la ruta actual corresponde a un tema específico
	 * @param topicId ID del tema a verificar
	 */
	const isTopicActive = (topicId: string): boolean => {
		return pathname?.includes(`/topics/${topicId}`) || false;
	};

	/**
	 * Verifica si la ruta actual corresponde a un subtema específico
	 * @param subtopicId ID del subtema a verificar
	 */
	const isSubtopicActive = (subtopicId: string): boolean => {
		return pathname?.includes(`/subtopics/${subtopicId}`) || false;
	};

	// Renderizar mensaje si no hay temas
	if (!topics || topics.length === 0) {
		return (
			<div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-xl font-bold">
						{subjectTitle || "Asignatura"}
					</h2>
				</div>
				<div className="p-6 text-gray-500 italic">
					No hay temas disponibles
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
			<div className="p-6 border-b border-gray-200">
				<h2 className="text-xl font-bold">{subjectTitle}</h2>
			</div>

			<nav className="pt-4 pb-16">
				{topics.map((topic) => (
					<div key={topic.id} className="mb-2">
						<button
							onClick={() => toggleTopic(topic.id)}
							className={`flex items-center w-full py-2 px-6 text-left hover:bg-gray-100 ${
								isTopicActive(topic.id) ? "font-bold" : ""
							}`}
						>
							<span>{topic.title}</span>
							{topic.subtopics && topic.subtopics.length > 0 && (
								<svg
									className={`ml-auto h-5 w-5 transform transition-transform ${
										expandedTopics[topic.id]
											? "rotate-90"
											: ""
									}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							)}
						</button>

						{expandedTopics[topic.id] &&
							topic.subtopics &&
							topic.subtopics.length > 0 && (
								<div className="ml-6 border-l border-gray-200 pl-4">
									{topic.subtopics.map((subtopic) => (
										<Link
											key={subtopic.id}
											href={`/manager/subjects/${subjectId}/topics/${topic.id}/subtopics/${subtopic.id}`}
											className={`block py-2 px-4 hover:bg-gray-100 ${
												isSubtopicActive(subtopic.id)
													? "font-bold"
													: ""
											}`}
										>
											{subtopic.title}
										</Link>
									))}
								</div>
							)}
					</div>
				))}
			</nav>
		</div>
	);
};

export default SubjectDetailSidebar;
