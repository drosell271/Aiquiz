import nodemailer from "nodemailer";

// Configuración del transportador de email
const createTransporter = () => {
	// Configuración para desarrollo (ethereal.email)
	if (process.env.NODE_ENV === "development") {
		return nodemailer.createTransport({
			host: "smtp.ethereal.email",
			port: 587,
			secure: false,
			auth: {
				user: process.env.EMAIL_USER || "desarrollo@example.com",
				pass: process.env.EMAIL_PASS || "password123",
			},
		});
	}

	// Configuración para producción
	return nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		secure: process.env.EMAIL_SECURE === "true",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});
};

// Función para enviar emails
export async function sendEmail({ to, subject, text, html }) {
	try {
		const transporter = createTransporter();

		const result = await transporter.sendMail({
			from: process.env.EMAIL_FROM || '"AIQUIZ" <noreply@aiquiz.com>',
			to,
			subject,
			text,
			html,
		});

		console.log("Email enviado: %s", result.messageId);
		return { success: true, messageId: result.messageId };
	} catch (error) {
		console.error("Error al enviar email:", error);
		return { success: false, error: error.message };
	}
}

// Plantillas de email
export const emailTemplates = {
	// Recuperación de contraseña
	passwordRecovery: (resetUrl, userName) => ({
		subject: "AIQUIZ - Recuperación de contraseña",
		text: `Hola ${
			userName || "usuario"
		},\n\nHas solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para continuar:\n\n${resetUrl}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, puedes ignorar este mensaje.\n\nSaludos,\nEl equipo de AIQUIZ`,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Recuperación de contraseña</h2>
				<p>Hola ${userName || "usuario"},</p>
				<p>Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para continuar:</p>
				<p style="margin: 20px 0;">
					<a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
						Restablecer contraseña
					</a>
				</p>
				<p>O copia y pega este enlace en tu navegador:</p>
				<p style="word-break: break-all;">${resetUrl}</p>
				<p>Este enlace expirará en 1 hora.</p>
				<p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
				<p>Saludos,<br>El equipo de AIQUIZ</p>
			</div>
		`,
	}),

	// Invitación a profesor
	professorInvitation: (name, email, password, loginUrl) => ({
		subject: "AIQUIZ - Invitación como profesor",
		text: `Hola ${name},\n\nHas sido invitado a unirte a AIQUIZ como profesor. A continuación encontrarás tus credenciales de acceso:\n\nEmail: ${email}\nContraseña temporal: ${password}\n\nPor favor, inicia sesión en la siguiente URL y cambia tu contraseña:\n\n${loginUrl}\n\nSaludos,\nEl equipo de AIQUIZ`,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Invitación a AIQUIZ</h2>
				<p>Hola ${name},</p>
				<p>Has sido invitado a unirte a AIQUIZ como profesor. A continuación encontrarás tus credenciales de acceso:</p>
				<div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px;">
					<p><strong>Email:</strong> ${email}</p>
					<p><strong>Contraseña temporal:</strong> ${password}</p>
				</div>
				<p>Por favor, inicia sesión y cambia tu contraseña:</p>
				<p style="margin: 20px 0;">
					<a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
						Iniciar sesión
					</a>
				</p>
				<p>Saludos,<br>El equipo de AIQUIZ</p>
			</div>
		`,
	}),
};
