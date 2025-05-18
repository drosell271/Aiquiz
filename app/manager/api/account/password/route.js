import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware, comparePassword } from "@/app/manager/lib/auth";
import { User } from "@/app/manager/models";

// PUT - Cambiar contraseña
export async function PUT(req) {
	const user = await authMiddleware(req);
	if (!user) {
		return NextResponse.json(
			{ success: false, message: "No autorizado" },
			{ status: 401 }
		);
	}

	try {
		await dbConnect();

		const { currentPassword, newPassword } = await req.json();

		// Validar datos
		if (!currentPassword || !newPassword) {
			return NextResponse.json(
				{
					success: false,
					message: "Contraseña actual y nueva son obligatorias",
				},
				{ status: 400 }
			);
		}

		// Validar longitud de la nueva contraseña
		if (newPassword.length < 8) {
			return NextResponse.json(
				{
					success: false,
					message: "La contraseña debe tener al menos 8 caracteres",
				},
				{ status: 400 }
			);
		}

		// Buscar usuario por id
		const userData = await User.findById(user.id);
		if (!userData) {
			return NextResponse.json(
				{ success: false, message: "Usuario no encontrado" },
				{ status: 404 }
			);
		}

		// Verificar contraseña actual
		const isPasswordValid = await userData.comparePassword(currentPassword);
		if (!isPasswordValid) {
			return NextResponse.json(
				{
					success: false,
					message: "La contraseña actual es incorrecta",
				},
				{ status: 400 }
			);
		}

		// Actualizar contraseña
		userData.password = newPassword; // El modelo hará el hash automáticamente
		await userData.save();

		return NextResponse.json({
			success: true,
			message: "Contraseña actualizada correctamente",
		});
	} catch (error) {
		console.error("Error al cambiar contraseña:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
