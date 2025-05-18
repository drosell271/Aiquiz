import { NextResponse } from "next/server";

export async function POST() {
	try {
		// Crear respuesta
		const response = NextResponse.json({
			success: true,
			message: "Sesión cerrada correctamente",
		});

		// Eliminar cookie de JWT
		response.cookies.set({
			name: "jwt_token",
			value: "",
			httpOnly: true,
			expires: new Date(0),
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Error al cerrar sesión:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
