import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject, Topic, Questionnaire } from "@/app/manager/models";

// GET - Descargar un cuestionario
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
		const { searchParams } = new URL(req.url);
		const format = searchParams.get("format") || "pdf";

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

		// Incrementar contador de descargas
		questionnaire.downloadCount += 1;
		await questionnaire.save();

		// Generar archivo según formato
		let fileContent, fileName, mimeType;

		if (format === "pdf") {
			// Simulación de PDF
			fileName = `cuestionario_${questionnaireId}.pdf`;
			mimeType = "application/pdf";
			fileContent = "Contenido simulado de PDF";
		} else if (format === "moodle") {
			// Simulación de Moodle XML
			fileName = `cuestionario_${questionnaireId}.xml`;
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
			questionCount: questionnaire.questions.length,
			downloadCount: questionnaire.downloadCount,
			message: `Cuestionario descargado en formato ${format}`,
		});
	} catch (error) {
		console.error("Error al descargar cuestionario:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
