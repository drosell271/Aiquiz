import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, User } from "@/app/manager/models";
import { sendEmail, emailTemplates } from "@/app/manager/lib/email";

// GET - Obtener todas las asignaturas
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

		// Obtener asignaturas donde el usuario es profesor o administrador
		const subjects = await Subject.find({
			$or: [{ administrators: user.id }, { professors: user.id }],
		}).populate("administrators professors", "name email");

		// Transformar el resultado para ajustarse al formato esperado por el frontend
		const formattedSubjects = subjects.map((subject) => {
			const administrator =
				subject.administrators.length > 0
					? subject.administrators[0].name
					: "Sin administrador";

			// Extraer temas si están disponibles
			const topics = subject.topics
				? subject.topics.map((t) => t.title)
				: ["Sin temas"];

			return {
				id: subject._id,
				title: subject.title,
				description: subject.description || "",
				administrator,
				topics,
			};
		});

		return NextResponse.json(formattedSubjects);
	} catch (error) {
		console.error("Error al obtener asignaturas:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear una nueva asignatura
export async function POST(req) {
	const user = await authMiddleware(req);
	if (!user) {
		return NextResponse.json(
			{ success: false, message: "No autorizado" },
			{ status: 401 }
		);
	}

	try {
		await dbConnect();

		const { title, acronym, description, professors } = await req.json();

		// Validar datos
		if (!title || !acronym) {
			return NextResponse.json(
				{
					success: false,
					message: "Título y acrónimo son obligatorios",
				},
				{ status: 400 }
			);
		}

		// Crear asignatura
		const subject = new Subject({
			title,
			acronym,
			description: description || "",
			administrators: [user.id],
			professors: [],
		});

		// Añadir profesores si hay
		if (professors && Array.isArray(professors)) {
			const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
			const loginUrl = `${baseUrl}/manager/login`;

			for (const prof of professors) {
				if (!prof.name || !prof.email) continue;

				// Verificar si el profesor existe
				let professorUser = await User.findOne({ email: prof.email });

				// Si no existe, lo creamos
				if (!professorUser) {
					// Generar contraseña temporal
					const tempPassword = Math.random().toString(36).slice(-8);

					professorUser = new User({
						name: prof.name,
						email: prof.email,
						password: tempPassword,
						role: "professor",
					});

					await professorUser.save();

					// Enviar email con credenciales
					await sendEmail({
						to: prof.email,
						...emailTemplates.professorInvitation(
							prof.name,
							prof.email,
							tempPassword,
							loginUrl
						),
					});
				}

				// Añadir a la lista de profesores si no está ya
				if (!subject.professors.includes(professorUser._id)) {
					subject.professors.push(professorUser._id);
				}
			}
		}

		await subject.save();

		return NextResponse.json({
			success: true,
			id: subject._id,
			title: subject.title,
			acronym: subject.acronym,
			description: subject.description,
			message: "Asignatura creada correctamente",
		});
	} catch (error) {
		console.error("Error al crear asignatura:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
