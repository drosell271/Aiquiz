import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Subtopic, Question } from "@/app/manager/models";

// POST - Generar preguntas para un subtema
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
		const { count = 3, difficulty = "FÁCIL" } = await req.json();

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

		// Convertir dificultad al formato almacenado
		const difficultyMap = {
			FÁCIL: "Fácil",
			INTERMEDIO: "Medio",
			AVANZADO: "Avanzado",
		};

		const mappedDifficulty = difficultyMap[difficulty] || "Medio";

		// Aquí iría la lógica para generar preguntas con IA basadas en el contenido del subtema
		// En esta implementación se crean preguntas de ejemplo

		const questions = [];
		for (let i = 0; i < count; i++) {
			const question = new Question({
				text: `Nueva pregunta generada #${i + 1} sobre ${
					subtopic.title
				}`,
				type: "Opción múltiple",
				difficulty: mappedDifficulty,
				topic: topicId,
				subtopic: subtopicId,
				createdBy: user.id,
				verified: false,
				rejected: false,
				choices: [
					{ text: "Opción correcta generada", isCorrect: true },
					{ text: "Opción incorrecta 1", isCorrect: false },
					{ text: "Opción incorrecta 2", isCorrect: false },
					{ text: "Opción incorrecta 3", isCorrect: false },
				],
				createdAt: new Date(),
			});

			await question.save();
			questions.push(question);
		}

		return NextResponse.json({
			success: true,
			questions,
			message: `${count} preguntas generadas correctamente para el subtema`,
		});
	} catch (error) {
		console.error("Error al generar preguntas:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
