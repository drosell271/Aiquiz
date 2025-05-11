// app/manager/components/topic/QuestionStatusFilter.tsx
import { useTranslation } from "react-i18next";

type StatusFilter = "all" | "unverified" | "verified" | "rejected";

interface QuestionStatusFilterProps {
	currentFilter: StatusFilter;
	onFilterChange: (filter: StatusFilter) => void;
}

const QuestionStatusFilter = ({
	currentFilter,
	onFilterChange,
}: QuestionStatusFilterProps) => {
	const { t } = useTranslation();

	return (
		<div className="flex space-x-2 items-center">
			<span className="text-sm font-medium text-gray-700">
				{t("topicDetail.filterByStatus") || "Filtrar por estado:"}
			</span>
			<div className="bg-white border border-gray-300 rounded-md flex divide-x">
				<button
					className={`px-3 py-1 text-sm ${
						currentFilter === "unverified"
							? "bg-gray-100 text-gray-900 font-medium"
							: "text-gray-700 hover:bg-gray-50"
					}`}
					onClick={() => onFilterChange("unverified")}
				>
					{t("topicDetail.unverified") || "No verificadas"}
				</button>
				<button
					className={`px-3 py-1 text-sm ${
						currentFilter === "verified"
							? "bg-gray-100 text-gray-900 font-medium"
							: "text-gray-700 hover:bg-gray-50"
					}`}
					onClick={() => onFilterChange("verified")}
				>
					{t("topicDetail.verified") || "Verificadas"}
				</button>
				<button
					className={`px-3 py-1 text-sm ${
						currentFilter === "rejected"
							? "bg-gray-100 text-gray-900 font-medium"
							: "text-gray-700 hover:bg-gray-50"
					}`}
					onClick={() => onFilterChange("rejected")}
				>
					{t("topicDetail.rejected") || "Rechazadas"}
				</button>
				<button
					className={`px-3 py-1 text-sm ${
						currentFilter === "all"
							? "bg-gray-100 text-gray-900 font-medium"
							: "text-gray-700 hover:bg-gray-50"
					}`}
					onClick={() => onFilterChange("all")}
				>
					{t("topicDetail.allQuestions") || "Todas"}
				</button>
			</div>
		</div>
	);
};

export default QuestionStatusFilter;
