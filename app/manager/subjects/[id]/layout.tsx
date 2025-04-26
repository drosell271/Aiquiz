// /app/manager/subjects/[id]/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import { SubjectProvider } from "../../contexts/SubjectContext"; // Importación actualizada

export default function SubjectDetailLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Comprobar si el usuario está autenticado
		const token = localStorage.getItem("jwt_token");
		if (!token) {
			router.push("/manager/login");
		} else {
			setIsLoading(false);
		}
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex h-screen overflow-hidden bg-gray-50">
				<div className="fixed top-0 left-0 right-0 z-50">
					<Header />
				</div>
				<div className="ml-0 md:ml-64 mt-16 w-full overflow-y-auto">
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden bg-gray-50">
			{/* Header fijo en la parte superior */}
			<div className="fixed top-0 left-0 right-0 z-50">
				<Header />
			</div>

			{/* Contenido principal con scroll */}
			<div className="ml-0 md:ml-64 mt-16 w-full overflow-y-auto">
				<SubjectProvider>
					<main className="flex-1 h-full">{children}</main>
				</SubjectProvider>
			</div>
		</div>
	);
}
