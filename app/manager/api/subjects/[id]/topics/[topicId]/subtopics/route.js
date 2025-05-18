import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Subtopic } from "@/app/manager/models";

// GET - Obtener todos los subtemas de un tema
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

		// Obtener los subtemas
		const subtopics = await Subtopic.find({ topic: topicId }).sort({
			order: 1,
		});

		// Preparar respuesta con formato
		const formattedSubtopics = subtopics.map((subtopic) => ({
			id: subtopic._id,
			title: subtopic.title,
			description: subtopic.description || "",
		}));

		return NextResponse.json({
			success: true,
			subtopics: formattedSubtopics,
		});
	} catch (error) {
		console.error("Error al obtener subtemas:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear un nuevo subtema
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

		// Obtener el último orden
		const lastSubtopic = await Subtopic.findOne({ topic: topicId })
			.sort({ order: -1 })
			.limit(1);

		const order = lastSubtopic ? lastSubtopic.order + 1 : 0;

		// Crear el subtema
		const subtopic = new Subtopic({
			title,
			description: description || "",
			topic: topicId,
			order,
		});

		await subtopic.save();

		return NextResponse.json({
			success: true,
			id: subtopic._id,
			title: subtopic.title,
			description: subtopic.description,
			message: "Subtema creado correctamente",
		});
	} catch (error) {
		console.error("Error al crear subtema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
