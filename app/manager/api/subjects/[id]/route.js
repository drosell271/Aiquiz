import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import {
	Subject,
	Topic,
	Subtopic,
	Question,
	Questionnaire,
	File,
} from "@/app/manager/models";

// GET - Obtener detalles de una asignatura
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
		})
			.populate("administrators professors", "name email")
			.populate({
				path: "topics",
				options: { sort: { order: 1 } },
				populate: {
					path: "subtopics",
					options: { sort: { order: 1 } },
					select: "id title description",
				},
			});

		if (!subject) {
			return NextResponse.json(
				{ success: false, message: "Asignatura no encontrada" },
				{ status: 404 }
			);
		}

		// Formato que espera el frontend
		const formattedSubject = {
			id: subject._id,
			title: subject.title,
			acronym: subject.acronym,
			description: subject.description,
			topics: subject.topics.map((topic) => ({
				id: topic._id,
				title: topic.title,
				description: topic.description || "",
				subtopics: topic.subtopics.map((subtopic) => ({
					id: subtopic._id,
					title: subtopic.title,
				})),
			})),
			professors: subject.professors.map((prof) => ({
				id: prof._id,
				name: prof.name,
				email: prof.email,
			})),
		};

		return NextResponse.json(formattedSubject);
	} catch (error) {
		console.error("Error al obtener detalles de asignatura:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar asignatura
export async function PUT(req, { params }) {
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
		const { title, acronym, description } = await req.json();

		// Verificar si el usuario tiene permisos para esta asignatura
		const subject = await Subject.findOne({
			_id: id,
			$or: [{ administrators: user.id }, { professors: user.id }],
		});

		if (!subject) {
			return NextResponse.json(
				{ success: false, message: "Asignatura no encontrada" },
				{ status: 404 }
			);
		}

		// Verificar si es administrador para permitir la edición
		const isAdmin = subject.administrators.some(
			(admin) => admin.toString() === user.id
		);

		if (!isAdmin) {
			return NextResponse.json(
				{
					success: false,
					message: "No tienes permisos para editar esta asignatura",
				},
				{ status: 403 }
			);
		}

		// Actualizar datos
		if (title) subject.title = title;
		if (acronym) subject.acronym = acronym;
		if (description !== undefined) subject.description = description;

		await subject.save();

		return NextResponse.json({
			success: true,
			id: subject._id,
			title: subject.title,
			acronym: subject.acronym,
			description: subject.description,
			message: "Asignatura actualizada correctamente",
		});
	} catch (error) {
		console.error("Error al actualizar asignatura:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// DELETE - Eliminar asignatura
export async function DELETE(req, { params }) {
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

		// Verificar si el usuario es administrador de esta asignatura
		const subject = await Subject.findOne({
			_id: id,
			administrators: user.id,
		});

		if (!subject) {
			return NextResponse.json(
				{
					success: false,
					message: "No tienes permisos para eliminar esta asignatura",
				},
				{ status: 403 }
			);
		}

		// Buscar todos los temas de la asignatura
		const topics = await Topic.find({ subject: id });

		// Para cada tema, buscar sus subtemas y eliminar su contenido
		for (const topic of topics) {
			const subtopics = await Subtopic.find({ topic: topic._id });

			for (const subtopic of subtopics) {
				// Eliminar preguntas asociadas
				await Question.deleteMany({ subtopic: subtopic._id });

				// Eliminar archivos asociados
				await File.deleteMany({ subtopic: subtopic._id });
			}

			// Eliminar cuestionarios asociados al tema
			await Questionnaire.deleteMany({ topic: topic._id });

			// Eliminar subtemas
			await Subtopic.deleteMany({ topic: topic._id });

			// Eliminar preguntas directamente asociadas al tema
			await Question.deleteMany({ topic: topic._id });
		}

		// Eliminar temas
		await Topic.deleteMany({ subject: id });

		// Finalmente, eliminar la asignatura
		await Subject.deleteOne({ _id: id });

		return NextResponse.json({
			success: true,
			message: "Asignatura eliminada correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar asignatura:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
