// /app/manager/components/topics/SubjectDetailSidebar.tsx
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

const SubjectDetailSidebar: React.FC<SubjectDetailSidebarProps> = ({
	subjectId,
	subjectTitle,
	topics,
}) => {
	const pathname = usePathname();
	const [expandedTopics, setExpandedTopics] = useState<
		Record<string, boolean>
	>({});

	// Inicializar expandiendo todos los temas que tienen subtemas
	useEffect(() => {
		const initialExpanded: Record<string, boolean> = {};
		topics.forEach((topic) => {
			if (topic.subtopics && topic.subtopics.length > 0) {
				initialExpanded[topic.id] = true;
			}
		});
		setExpandedTopics(initialExpanded);
	}, [topics]);

	// Adicionalmente, asegurarse de mantener expandido el tema activo
	useEffect(() => {
		if (pathname?.includes("/topics/")) {
			const pathParts = pathname.split("/");
			// Buscamos el id del topic en la URL
			const topicIndex = pathParts.findIndex((part) => part === "topics");
			const topicId =
				topicIndex >= 0 && pathParts.length > topicIndex + 1
					? pathParts[topicIndex + 1]
					: null;

			if (topicId) {
				// Solo actualizar si hay cambios para evitar re-renders innecesarios
				setExpandedTopics((prev) => {
					const newState = { ...prev };
					if (!newState[topicId]) {
						newState[topicId] = true;
						return newState;
					}
					return prev;
				});
			}
		}
	}, [pathname, topics]);

	const toggleTopic = (topicId: string) => {
		setExpandedTopics((prev) => ({
			...prev,
			[topicId]: !prev[topicId],
		}));
	};

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
								pathname?.includes(`/topics/${topic.id}`)
									? "font-bold"
									: ""
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
												pathname?.includes(
													`/subtopics/${subtopic.id}`
												)
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
