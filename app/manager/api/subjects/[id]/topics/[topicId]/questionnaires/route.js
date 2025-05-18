import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Questionnaire, Question } from "@/app/manager/models";

// GET - Obtener todos los cuestionarios de un tema
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

		// Obtener cuestionarios
		const questionnaires = await Questionnaire.find({
			topic: topicId,
		}).sort({ createdAt: -1 });

		// Preparar respuesta con formato
		const formattedQuestionnaires = questionnaires.map((q) => ({
			id: q._id,
			title: q.title,
			description: q.description || "",
			questions: q.questions.length,
			createdAt: q.createdAt,
			downloadCount: q.downloadCount,
		}));

		return NextResponse.json(formattedQuestionnaires);
	} catch (error) {
		console.error("Error al obtener cuestionarios:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear un nuevo cuestionario
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
		let questions = [];
		if (questionIds && questionIds.length > 0) {
			questions = await Question.find({
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
		}

		// Crear cuestionario
		const questionnaire = new Questionnaire({
			title,
			description: description || "",
			topic: topicId,
			questions: questionIds || [],
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
			message: "Cuestionario creado correctamente",
		});
	} catch (error) {
		console.error("Error al crear cuestionario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
