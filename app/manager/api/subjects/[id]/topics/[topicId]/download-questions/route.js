import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Question } from "@/app/manager/models";

// POST - Descargar preguntas seleccionadas
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
		const { questionIds, format = "pdf" } = await req.json();

		// Validar datos
		if (
			!questionIds ||
			!Array.isArray(questionIds) ||
			questionIds.length === 0
		) {
			return NextResponse.json(
				{
					success: false,
					message: "IDs de preguntas no proporcionados",
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

		// Obtener las preguntas
		const questions = await Question.find({
			_id: { $in: questionIds },
		});

		if (questions.length === 0) {
			return NextResponse.json(
				{
					success: false,
					message:
						"No se encontraron preguntas con los IDs proporcionados",
				},
				{ status: 404 }
			);
		}

		// En una implementación real, aquí generarías el archivo
		// Para esta implementación, simularemos la descarga

		// Generar archivo según formato
		let fileContent, fileName, mimeType;

		if (format === "pdf") {
			// Simulación de PDF
			fileName = `preguntas_${topicId}.pdf`;
			mimeType = "application/pdf";
			fileContent = "Contenido simulado de PDF";
		} else if (format === "moodle") {
			// Simulación de Moodle XML
			fileName = `preguntas_${topicId}.xml`;
			mimeType = "application/xml";
			fileContent = "<quiz><!-- Contenido XML simulado --></quiz>";
		} else {
			return NextResponse.json(
				{ success: false, message: "Formato no soportado" },
				{ status: 400 }
			);
		}

		// En una implementación real, aquí enviarías el archivo al cliente
		// Para esta simulación, devolvemos información sobre la descarga

		return NextResponse.json({
			success: true,
			format,
			fileName,
			mimeType,
			questionCount: questions.length,
			message: `Preguntas descargadas en formato ${format}`,
		});
	} catch (error) {
		console.error("Error al descargar preguntas:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
