import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Subtopic, File } from "@/app/manager/models";
import { unlink } from "fs/promises";
import path from "path";

// Configuración para almacenamiento de archivos
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// DELETE - Eliminar un archivo
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
		const { id, topicId, subtopicId, fileId } = params;

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

		// Buscar el archivo
		const file = await File.findOne({
			_id: fileId,
			subtopic: subtopicId,
		});

		if (!file) {
			return NextResponse.json(
				{ success: false, message: "Archivo no encontrado" },
				{ status: 404 }
			);
		}

		// Si no es externo, eliminar el archivo físico
		if (!file.isExternal) {
			try {
				const filePath = path.join(UPLOAD_DIR, file.path);
				await unlink(filePath);
			} catch (err) {
				console.error("Error al eliminar archivo físico:", err);
				// Continuamos aunque el archivo físico no se pueda eliminar
			}
		}

		// Eliminar el registro de la base de datos
		await File.deleteOne({ _id: fileId });

		return NextResponse.json({
			success: true,
			message: "Archivo eliminado correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar archivo:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
