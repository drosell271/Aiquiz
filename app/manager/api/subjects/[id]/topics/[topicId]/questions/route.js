import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Question } from "@/app/manager/models";

// GET - Obtener todas las preguntas de un tema
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

		// Obtener todas las preguntas del tema y sus subtemas
		const topicQuestions = await Question.find({ topic: topicId });

		// Obtener IDs de los subtemas
		const subtopicIds = await Subtopic.find({ topic: topicId }).select(
			"_id"
		);

		// Obtener preguntas de los subtemas
		const subtopicQuestions = await Question.find({
			subtopic: { $in: subtopicIds.map((s) => s._id) },
		});

		// Combinar y eliminar duplicados
		const allQuestions = [...topicQuestions, ...subtopicQuestions];

		// Eliminar duplicados por ID
		const uniqueQuestions = Array.from(
			new Map(allQuestions.map((q) => [q._id.toString(), q])).values()
		);

		return NextResponse.json(uniqueQuestions);
	} catch (error) {
		console.error("Error al obtener preguntas:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear una nueva pregunta
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
		const { text, type, difficulty, choices, subtopicId } =
			await req.json();

		// Validar datos
		if (!text || !type) {
			return NextResponse.json(
				{
					success: false,
					message: "El texto y tipo de pregunta son obligatorios",
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

		// Verificar subtema si se proporciona
		if (subtopicId) {
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
		}

		// Crear la pregunta
		const question = new Question({
			text,
			type,
			difficulty: difficulty || "Medio",
			topic: topicId,
			subtopic: subtopicId || null,
			choices: choices || [],
			createdBy: user.id,
			verified: false,
			rejected: false,
			createdAt: new Date(),
		});

		await question.save();

		return NextResponse.json({
			success: true,
			id: question._id,
			text: question.text,
			type: question.type,
			difficulty: question.difficulty,
			choices: question.choices,
			verified: question.verified,
			rejected: question.rejected,
			createdAt: question.createdAt,
			message: "Pregunta creada correctamente",
		});
	} catch (error) {
		console.error("Error al crear pregunta:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
