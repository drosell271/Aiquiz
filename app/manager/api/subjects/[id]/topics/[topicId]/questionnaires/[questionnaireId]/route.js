import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Questionnaire } from "@/app/manager/models";

// GET - Obtener un cuestionario específico
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
		const { id, topicId, questionnaireId } = params;

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

		// Obtener el cuestionario
		const questionnaire = await Questionnaire.findOne({
			_id: questionnaireId,
			topic: topicId,
		}).populate("questions");

		if (!questionnaire) {
			return NextResponse.json(
				{ success: false, message: "Cuestionario no encontrado" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			questionnaire: {
				id: questionnaire._id,
				title: questionnaire.title,
				description: questionnaire.description,
				questions: questionnaire.questions,
				createdAt: questionnaire.createdAt,
				downloadCount: questionnaire.downloadCount,
				isPublic: questionnaire.isPublic,
			},
		});
	} catch (error) {
		console.error("Error al obtener cuestionario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar un cuestionario
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
		const { id, topicId, questionnaireId } = params;
		const { title, description, questionIds, isPublic } = await req.json();

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

		// Obtener el cuestionario
		const questionnaire = await Questionnaire.findOne({
			_id: questionnaireId,
			topic: topicId,
		});

		if (!questionnaire) {
			return NextResponse.json(
				{ success: false, message: "Cuestionario no encontrado" },
				{ status: 404 }
			);
		}

		// Actualizar campos
		if (title !== undefined) questionnaire.title = title;
		if (description !== undefined) questionnaire.description = description;
		if (questionIds !== undefined) questionnaire.questions = questionIds;
		if (isPublic !== undefined) questionnaire.isPublic = isPublic;

		await questionnaire.save();

		return NextResponse.json({
			success: true,
			id: questionnaire._id,
			title: questionnaire.title,
			description: questionnaire.description,
			questions: questionnaire.questions.length,
			isPublic: questionnaire.isPublic,
			message: "Cuestionario actualizado correctamente",
		});
	} catch (error) {
		console.error("Error al actualizar cuestionario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// DELETE - Eliminar un cuestionario
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
		const { id, topicId, questionnaireId } = params;

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

		// Verificar que el cuestionario exista
		const questionnaire = await Questionnaire.findOne({
			_id: questionnaireId,
			topic: topicId,
		});

		if (!questionnaire) {
			return NextResponse.json(
				{ success: false, message: "Cuestionario no encontrado" },
				{ status: 404 }
			);
		}

		// Eliminar el cuestionario
		await Questionnaire.deleteOne({ _id: questionnaireId });

		return NextResponse.json({
			success: true,
			message: "Cuestionario eliminado correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar cuestionario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
