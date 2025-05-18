import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Subtopic, Question } from "@/app/manager/models";

// GET - Obtener preguntas de un subtema específico
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

		// Verificar que el tema y subtema existan
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

		// Obtener preguntas
		const questions = await Question.find({
			subtopic: subtopicId,
		}).sort({ createdAt: -1 });

		return NextResponse.json(questions);
	} catch (error) {
		console.error("Error al obtener preguntas:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear una nueva pregunta en un subtema
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
		const { id, topicId, subtopicId } = params;
		const { text, type, difficulty, choices } = await req.json();

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

		// Verificar que el tema y subtema existan
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

		// Crear la pregunta
		const question = new Question({
			text,
			type,
			difficulty: difficulty || "Medio",
			topic: topicId,
			subtopic: subtopicId,
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
			...question.toObject(),
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
