// /app/manager/components/subject/SubjectCard.tsx
import Link from "next/link";
import { useManagerTranslation } from "../../hooks/useManagerTranslation";
import SubjectTags from "./SubjectTags";

export interface SubjectCardProps {
	id: string;
	title: string;
	description: string;
	administrator: string;
	topics: string[];
}

/**
 * Componente de tarjeta para mostrar la información básica de una asignatura
 */
const SubjectCard: React.FC<SubjectCardProps> = ({
	id,
	title,
	description,
	administrator,
	topics,
}) => {
	const { t } = useManagerTranslation();

	/**
	 * Obtiene la descripción truncada si es necesario
	 */
	const getTruncatedDescription = (
		text: string,
		maxLength: number = 150
	): string => {
		return text.length > maxLength
			? `${text.substring(0, maxLength)}(...)`
			: text;
	};

	return (
		<div className="bg-gray-100 rounded-md p-6">
			<h2 className="text-xl font-bold mb-2">{title || "Sin título"}</h2>

			<p className="text-gray-700 mb-2">
				{getTruncatedDescription(description)}
			</p>

			<Link
				href={`/manager/subjects/${id}`}
				className="text-blue-600 hover:underline mb-4 inline-block"
			>
				{t("subjects.viewMore")}
			</Link>

			<div className="mt-3">
				<p className="mb-1">
					<span className="font-bold mr-2">
						{t("subjects.administrator")}:
					</span>
					{administrator}
				</p>

				<SubjectTags tags={topics} category={t("subjects.topics")} />
			</div>
		</div>
	);
};

export default SubjectCard;
