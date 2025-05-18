import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic } from "@/app/manager/models";

// GET - Obtener todos los temas de una asignatura
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
		const { id } = params;

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

		// Obtener los temas
		const topics = await Topic.find({ subject: id })
			.sort({ order: 1 })
			.populate({
				path: "subtopics",
				options: { sort: { order: 1 } },
				select: "id title",
			});

		// Preparar respuesta con formato
		const formattedTopics = topics.map((topic) => ({
			id: topic._id,
			title: topic.title,
			description: topic.description || "",
			subtopics: topic.subtopics,
		}));

		return NextResponse.json({
			success: true,
			topics: formattedTopics,
		});
	} catch (error) {
		console.error("Error al obtener temas:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear un nuevo tema
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
		const { id } = params;
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

		// Obtener el último orden
		const lastTopic = await Topic.findOne({ subject: id })
			.sort({ order: -1 })
			.limit(1);

		const order = lastTopic ? lastTopic.order + 1 : 0;

		// Crear el tema
		const topic = new Topic({
			title,
			description: description || "",
			subject: id,
			order,
		});

		await topic.save();

		return NextResponse.json({
			success: true,
			id: topic._id,
			title: topic.title,
			description: topic.description,
			subtopics: [],
			message: "Tema creado correctamente",
		});
	} catch (error) {
		console.error("Error al crear tema:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
