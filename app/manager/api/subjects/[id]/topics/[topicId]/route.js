import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import {
	Subject,
	Topic,
	Subtopic,
	Question,
	Questionnaire,
} from "@/app/manager/models";

// GET - Obtener un tema específico
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
		const { id, topicId } = params;

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

		// Obtener el tema
		const topic = await Topic.findOne({
			_id: topicId,
			subject: id,
		}).populate({
			path: "subtopics",
			options: { sort: { order: 1 } },
		});

		if (!topic) {
			return NextResponse.json(
				{ success: false, message: "Tema no encontrado" },
				{ status: 404 }
			);
		}

		// Preparar respuesta con formato
		const formattedTopic = {
			id: topic._id,
			title: topic.title,
			description: topic.description || "",
			subjectId: subject._id,
			subjectTitle: subject.title,
			subtopics: topic.subtopics.map((subtopic) => ({
				id: subtopic._id,
				title: subtopic.title,
				description: subtopic.description || "",
			})),
		};

		return NextResponse.json(formattedTopic);
	} catch (error) {
		console.error("Error al obtener tema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar un tema
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
		const { id, topicId } = params;
		const { title, description } = await req.json();

		// Validar datos
		if (!title) {
			return NextResponse.json(
				{ success: false, message: "El título es obligatorio" },
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

		// Obtener y actualizar el tema
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

		topic.title = title;
		topic.description = description || "";
		await topic.save();

		return NextResponse.json({
			success: true,
			id: topic._id,
			title: topic.title,
			description: topic.description,
			message: "Tema actualizado correctamente",
		});
	} catch (error) {
		console.error("Error al actualizar tema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// PATCH - Actualizar parcialmente un tema
export async function PATCH(req, { params }) {
	const user = await authMiddleware(req);
	if (!user) {
		return NextResponse.json(
			{ success: false, message: "No autorizado" },
			{ status: 401 }
		);
	}

	try {
		await dbConnect();
		const { id, topicId } = params;
		const updates = await req.json();

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

		// Obtener el tema
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

		// Aplicar actualizaciones
		if (updates.title !== undefined) topic.title = updates.title;
		if (updates.description !== undefined)
			topic.description = updates.description;
		if (updates.order !== undefined) topic.order = updates.order;

		await topic.save();

		return NextResponse.json({
			success: true,
			id: topic._id,
			...updates,
			message: "Tema actualizado correctamente",
		});
	} catch (error) {
		console.error("Error al actualizar tema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// DELETE - Eliminar un tema
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
		const { id, topicId } = params;

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

		// Eliminar subtemas asociados
		await Subtopic.deleteMany({ topic: topicId });

		// Eliminar preguntas asociadas
		await Question.deleteMany({ topic: topicId });

		// Eliminar cuestionarios asociados
		await Questionnaire.deleteMany({ topic: topicId });

		// Eliminar el tema
		await Topic.deleteOne({ _id: topicId });

		return NextResponse.json({
			success: true,
			message: "Tema eliminado correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar tema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
