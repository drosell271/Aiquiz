import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, User } from "@/app/manager/models";
import { sendEmail, emailTemplates } from "@/app/manager/lib/email";

// POST - Añadir profesor a asignatura
export async function POST(req, { params }) {
	const user = await authMiddleware(req);
	if (!user) {
		return NextResponse.json(
			{ success: false, message: "No autorizado" },
			{ status: 401 }
		);
	}

	try {
		await dbConnect();
		const { id } = params;
		const { name, email } = await req.json();

		// Validar datos
		if (!name || !email) {
			return NextResponse.json(
				{ success: false, message: "Nombre y email son obligatorios" },
				{ status: 400 }
			);
		}

		// Verificar si el usuario tiene permisos para esta asignatura
		const subject = await Subject.findOne({
			_id: id,
			administrators: user.id,
		});

		if (!subject) {
			return NextResponse.json(
				{
					success: false,
					message: "No tienes permisos para añadir profesores",
				},
				{ status: 403 }
			);
		}

		// Verificar si el profesor ya existe
		let professor = await User.findOne({ email });

		// Si no existe, lo creamos
		if (!professor) {
			// Generar contraseña temporal
			const tempPassword = Math.random().toString(36).slice(-8);

			professor = new User({
				name,
				email,
				password: tempPassword,
				role: "professor",
			});

			await professor.save();

			// Enviar email con credenciales
			const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
			const loginUrl = `${baseUrl}/manager/login`;

			await sendEmail({
				to: email,
				...emailTemplates.professorInvitation(
					name,
					email,
					tempPassword,
					loginUrl
				),
			});
		}

		// Verificar si el profesor ya está en la asignatura
		if (subject.professors.includes(professor._id)) {
			return NextResponse.json(
				{
					success: false,
					message: "El profesor ya está en la asignatura",
				},
				{ status: 400 }
			);
		}

		// Añadir profesor a la asignatura
		subject.professors.push(professor._id);
		await subject.save();

		return NextResponse.json({
			success: true,
			id: professor._id,
			name: professor.name,
			email: professor.email,
			message: "Profesor añadido correctamente",
		});
	} catch (error) {
		console.error("Error al añadir profesor:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// GET - Obtener todos los profesores de una asignatura
export async function GET(req, { params }) {
	const user = await authMiddleware(req);
	if (!user) {
		return NextResponse.json(
			{ success: false, message: "No autorizado" },
			{ status: 401 }
		);
	}

	try {
		await dbConnect();
		const { id } = params;

		// Verificar si el usuario tiene acceso a esta asignatura
		const subject = await Subject.findOne({
			_id: id,
			$or: [{ administrators: user.id }, { professors: user.id }],
		}).populate("professors", "name email");

		if (!subject) {
			return NextResponse.json(
				{ success: false, message: "Asignatura no encontrada" },
				{ status: 404 }
			);
		}

		// Preparar respuesta con formato
		const professors = subject.professors.map((prof) => ({
			id: prof._id,
			name: prof.name,
			email: prof.email,
		}));

		return NextResponse.json({
			success: true,
			professors,
		});
	} catch (error) {
		console.error("Error al obtener profesores:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
