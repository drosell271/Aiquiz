import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { User } from "@/app/manager/models";
import { hashPassword } from "@/app/manager/lib/auth";
import crypto from "crypto";

export async function POST(req) {
	try {
		await dbConnect();

		const { token, password } = await req.json();

		if (!token || !password) {
			return NextResponse.json(
				{
					success: false,
					message: "Token y contraseña son obligatorios",
				},
				{ status: 400 }
			);
		}

		// Validar longitud de contraseña
		if (password.length < 8) {
			return NextResponse.json(
				{
					success: false,
					message: "La contraseña debe tener al menos 8 caracteres",
				},
				{ status: 400 }
			);
		}

		// Calcular hash del token recibido
		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		// Buscar usuario con el token
		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Token inválido o expirado" },
				{ status: 400 }
			);
		}

		// Actualizar contraseña
		user.password = password; // El modelo User hará el hash automáticamente
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();

		return NextResponse.json({
			success: true,
			message: "Contraseña actualizada correctamente",
		});
	} catch (error) {
		console.error("Error al restablecer contraseña:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
