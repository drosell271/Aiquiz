import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Question } from "@/app/manager/models";

// POST - Verificar o rechazar una pregunta
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
		const { questionId, isValid } = await req.json();

		// Validar datos
		if (!questionId) {
			return NextResponse.json(
				{ success: false, message: "ID de pregunta no proporcionado" },
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

		// Buscar la pregunta
		const question = await Question.findOne({
			_id: questionId,
			topic: topicId,
		});

		if (!question) {
			// Buscar también en las preguntas de los subtemas
			const questionInSubtopic = await Question.findOne({
				_id: questionId,
				$or: [
					{ topic: topicId },
					{ subtopic: { $exists: true, $ne: null } },
				],
			});

			if (!questionInSubtopic) {
				return NextResponse.json(
					{ success: false, message: "Pregunta no encontrada" },
					{ status: 404 }
				);
			}

			// Actualizar estado
			questionInSubtopic.verified = isValid === true;
			questionInSubtopic.rejected = isValid === false;
			await questionInSubtopic.save();

			return NextResponse.json({
				success: true,
				questionId: questionInSubtopic._id,
				verified: questionInSubtopic.verified,
				rejected: questionInSubtopic.rejected,
				message: isValid
					? "Pregunta verificada correctamente"
					: "Pregunta rechazada correctamente",
			});
		}

		// Actualizar estado
		question.verified = isValid === true;
		question.rejected = isValid === false;
		await question.save();

		return NextResponse.json({
			success: true,
			questionId: question._id,
			verified: question.verified,
			rejected: question.rejected,
			message: isValid
				? "Pregunta verificada correctamente"
				: "Pregunta rechazada correctamente",
		});
	} catch (error) {
		console.error("Error al verificar pregunta:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
