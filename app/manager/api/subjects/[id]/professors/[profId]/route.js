import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { authMiddleware } from "@/app/manager/lib/auth";
import { Subject } from "@/app/manager/models";

// DELETE - Eliminar profesor de una asignatura
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
		const { id, profId } = params;

		// Verificar si el usuario es administrador de esta asignatura
		const subject = await Subject.findOne({
			_id: id,
			administrators: user.id,
		});

		if (!subject) {
			return NextResponse.json(
				{
					success: false,
					message: "No tienes permisos para eliminar profesores",
				},
				{ status: 403 }
			);
		}

		// Verificar que no se intente eliminar al último administrador
		if (
			subject.administrators.includes(profId) &&
			subject.administrators.length <= 1
		) {
			return NextResponse.json(
				{
					success: false,
					message: "No puedes eliminar al único administrador",
				},
				{ status: 400 }
			);
		}

		// Eliminar profesor de la lista
		subject.professors = subject.professors.filter(
			(prof) => prof.toString() !== profId
		);

		// Si el profesor también es administrador, eliminarlo de esa lista
		subject.administrators = subject.administrators.filter(
			(admin) => admin.toString() !== profId
		);

		await subject.save();

		return NextResponse.json({
			success: true,
			message: "Profesor eliminado correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar profesor:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
