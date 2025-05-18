import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Subtopic } from "@/app/manager/models";

// PUT - Actualizar contenido de un subtema
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
		const { id, topicId, subtopicId } = params;
		const { content } = await req.json();

		// Validar datos
		if (content === undefined) {
			return NextResponse.json(
				{ success: false, message: "El contenido es obligatorio" },
				{ status: 400 }
			);
		}

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

		// Verificar que el tema exista
		const topic = await Topic.findOne({
			_id: topicId,
			subject: id,
		});

		if (!topic) {
			return NextResponse.json(
				{ success: false, message: "Tema no encontrado" },
				{ status: 404 }
			);
		}

		// Obtener y actualizar el subtema
		const subtopic = await Subtopic.findOne({
			_id: subtopicId,
			topic: topicId,
		});

		if (!subtopic) {
			return NextResponse.json(
				{ success: false, message: "Subtema no encontrado" },
				{ status: 404 }
			);
		}

		// Actualizar contenido
		subtopic.content = content;
		await subtopic.save();

		return NextResponse.json({
			success: true,
			content: subtopic.content,
			updatedAt: subtopic.updatedAt,
			message: "Contenido actualizado correctamente",
		});
	} catch (error) {
		console.error("Error al actualizar contenido:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
