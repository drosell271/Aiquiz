// /app/manager/subjects/[id]/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SubjectDetailSidebar from "../../components/topics/SubjectDetailSidebar";
import Header from "../../components/common/Header";
import { SubjectContext } from "../../contexts/SubjectContext";

export default function SubjectDetailLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();

	useEffect(() => {
		// Comprobar si el usuario está autenticado
		const token = localStorage.getItem("jwt_token");
		if (!token) {
			router.push("/manager/login");
		}
	}, [router]);

	return (
		<div className="flex h-screen overflow-hidden bg-gray-50">
			{/* Header fijo en la parte superior */}
			<div className="fixed top-0 left-0 right-0 z-50">
				<Header />
			</div>

			{/* Contenido principal con scroll */}
			<div className="ml-64 mt-16 w-full overflow-y-auto">
				<main className="flex-1 h-full">{children}</main>
			</div>
		</div>
	);
}
