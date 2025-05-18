import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Questionnaire, Question } from "@/app/manager/models";

// POST - Generar un cuestionario a partir de preguntas seleccionadas
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
		const { id, topicId } = params;
		const { title, description, questionIds } = await req.json();

		// Validar datos
		if (
			!title ||
			!questionIds ||
			!Array.isArray(questionIds) ||
			questionIds.length === 0
		) {
			return NextResponse.json(
				{
					success: false,
					message: "Título y preguntas son obligatorios",
				},
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

		// Verificar que las preguntas existan
		const questions = await Question.find({
			_id: { $in: questionIds },
		});

		if (questions.length !== questionIds.length) {
			return NextResponse.json(
				{
					success: false,
					message: "Una o más preguntas no fueron encontradas",
				},
				{ status: 404 }
			);
		}

		// Crear cuestionario
		const questionnaire = new Questionnaire({
			title,
			description: description || "",
			topic: topicId,
			questions: questionIds,
			createdBy: user.id,
			downloadCount: 0,
			isPublic: false,
		});

		await questionnaire.save();

		return NextResponse.json({
			success: true,
			id: questionnaire._id,
			title: questionnaire.title,
			description: questionnaire.description,
			questions: questionnaire.questions.length,
			createdAt: questionnaire.createdAt,
			downloadCount: questionnaire.downloadCount,
			message: "Cuestionario generado correctamente",
		});
	} catch (error) {
		console.error("Error al generar cuestionario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
