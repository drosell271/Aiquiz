import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { User } from "@/app/manager/models";

// GET - Obtener datos del usuario
export async function GET(req) {
	const user = await authMiddleware(req);
	if (!user) {
		return NextResponse.json(
			{ success: false, message: "No autorizado" },
			{ status: 401 }
		);
	}

	try {
		await dbConnect();

		const userData = await User.findById(user.id).select(
			"-password -resetPasswordToken -resetPasswordExpires"
		);

		if (!userData) {
			return NextResponse.json(
				{ success: false, message: "Usuario no encontrado" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			user: userData,
		});
	} catch (error) {
		console.error("Error al obtener datos de usuario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar datos del usuario
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

		const { name, email, faculty } = await req.json();

		// Buscar usuario por id
		const userData = await User.findById(user.id);
		if (!userData) {
			return NextResponse.json(
				{ success: false, message: "Usuario no encontrado" },
				{ status: 404 }
			);
		}

		// Actualizar datos
		if (name) userData.name = name;
		if (faculty) userData.faculty = faculty;

		// Validar si se está cambiando el email
		if (email && email !== userData.email) {
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				return NextResponse.json(
					{ success: false, message: "El email ya está en uso" },
					{ status: 400 }
				);
			}
			userData.email = email;
		}

		await userData.save();

		return NextResponse.json({
			success: true,
			user: userData,
			message: "Perfil actualizado correctamente",
		});
	} catch (error) {
		console.error("Error al actualizar usuario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
