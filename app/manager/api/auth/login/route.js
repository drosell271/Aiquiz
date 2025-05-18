import { NextResponse } from "next/server";
import dbConnect from "@/app/manager/lib/db";
import { generateToken } from "@/app/manager/lib/auth";
import { User } from "@/app/manager/models";

export async function POST(req) {
	try {
		await dbConnect();

		const { email, password } = await req.json();

		// Validar datos de entrada
		if (!email || !password) {
			return NextResponse.json(
				{
					success: false,
					message: "Email y contraseña son obligatorios",
				},
				{ status: 400 }
			);
		}

		// Buscar usuario por email
		const user = await User.findOne({ email });
		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Credenciales inválidas" },
				{ status: 401 }
			);
		}

		// Verificar contraseña
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			return NextResponse.json(
				{ success: false, message: "Credenciales inválidas" },
				{ status: 401 }
			);
		}

		// Actualizar último login
		user.lastLogin = new Date();
		await user.save();

		// Generar token JWT
		const token = generateToken(user);

		// Preparar respuesta con cookie
		const response = NextResponse.json({
			success: true,
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				faculty: user.faculty,
			},
		});

		// Guardar token en cookie segura (en producción usar secure: true)
		response.cookies.set({
			name: "jwt_token",
			value: token,
			httpOnly: true,
			sameSite: "strict",
			maxAge: 86400, // 1 día en segundos
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Error en login:", error);
		return NextResponse.json(
			{ success: false, message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}
