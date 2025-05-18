import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Subtopic, Question, File } from "@/app/manager/models";

// GET - Obtener un subtema específico
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
		const { id, topicId, subtopicId } = params;

		// Verificar si el usuario tiene acceso a esta asignatura
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

		// Obtener el subtema
		const subtopic = await Subtopic.findOne({
			_id: subtopicId,
			topic: topicId,
		})
			.populate({
				path: "questions",
				options: { sort: { createdAt: -1 } },
			})
			.populate({
				path: "files",
				options: { sort: { createdAt: -1 } },
			});

		if (!subtopic) {
			return NextResponse.json(
				{ success: false, message: "Subtema no encontrado" },
				{ status: 404 }
			);
		}

		// Preparar respuesta con formato
		const formattedSubtopic = {
			id: subtopic._id,
			title: subtopic.title,
			description: subtopic.description || "",
			content: subtopic.content || "",
			createdAt: subtopic.createdAt,
			updatedAt: subtopic.updatedAt,
			topicId: topic._id,
			topicTitle: topic.title,
			subjectId: subject._id,
			subjectTitle: subject.title,
			questions: subtopic.questions || [],
			files: subtopic.files || [],
		};

		return NextResponse.json(formattedSubtopic);
	} catch (error) {
		console.error("Error al obtener subtema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar un subtema
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
		const { title, description, content } = await req.json();

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

		// Actualizar campos
		if (title !== undefined) subtopic.title = title;
		if (description !== undefined) subtopic.description = description;
		if (content !== undefined) subtopic.content = content;

		await subtopic.save();

		return NextResponse.json({
			success: true,
			id: subtopic._id,
			title: subtopic.title,
			description: subtopic.description,
			content: subtopic.content,
			message: "Subtema actualizado correctamente",
		});
	} catch (error) {
		console.error("Error al actualizar subtema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// DELETE - Eliminar un subtema
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
		const { id, topicId, subtopicId } = params;

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

		// Verificar que el subtema exista
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

		// Eliminar archivos asociados
		await File.deleteMany({ subtopic: subtopicId });

		// Eliminar preguntas asociadas
		await Question.deleteMany({ subtopic: subtopicId });

		// Eliminar el subtema
		await Subtopic.deleteOne({ _id: subtopicId });

		return NextResponse.json({
			success: true,
			message: "Subtema eliminado correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar subtema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
