import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { User } from "@/app/manager/models";
import { sendEmail, emailTemplates } from "@/app/manager/lib/email";
import crypto from "crypto";

export async function POST(req) {
	try {
		await dbConnect();

		const { email } = await req.json();

		if (!email) {
			return NextResponse.json(
				{ success: false, message: "Email no proporcionado" },
				{ status: 400 }
			);
		}

		// Buscar usuario por email
		const user = await User.findOne({ email });
		if (!user) {
			// No revelamos si el email existe o no por seguridad
			return NextResponse.json({
				success: true,
				message:
					"Si el email existe, recibirás instrucciones para recuperar tu contraseña",
			});
		}

		// Generar token de recuperación
		const resetToken = crypto.randomBytes(32).toString("hex");

		// Almacenar el hash del token
		const hashedToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");

		user.resetPasswordToken = hashedToken;
		user.resetPasswordExpires = Date.now() + 3600000; // Expira en 1 hora
		await user.save({ validateBeforeSave: false });

		// URL para resetear contraseña
		const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
		const resetURL = `${baseUrl}/manager/reset-password/${resetToken}`;

		// Enviar email
		const emailResult = await sendEmail({
			to: user.email,
			...emailTemplates.passwordRecovery(resetURL, user.name),
		});

		if (!emailResult.success) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;
			await user.save({ validateBeforeSave: false });

			console.error("Error al enviar email:", emailResult.error);
			return NextResponse.json(
				{
					success: false,
					message: "Error al enviar email de recuperación",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Email de recuperación enviado correctamente",
		});
	} catch (error) {
		console.error("Error en recuperación de contraseña:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
