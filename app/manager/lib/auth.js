import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const JWT_SECRET =
	process.env.JWT_SECRET || "tu_clave_secreta_aqui_cambiala_en_produccion";

// Genera un token JWT
export function generateToken(user) {
	if (!JWT_SECRET) {
		throw new Error("JWT_SECRET no está definido");
	}

	return jwt.sign(
		{
			id: user._id,
			email: user.email,
			role: user.role,
		},
		JWT_SECRET,
		{ expiresIn: "1d" }
	);
}

// Verifica un token JWT
export function verifyToken(token) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		return null;
	}
}

// Obtiene el usuario autenticado de los headers
export async function getAuthUser(req) {
	try {
		// Intentamos obtener el token de diferentes fuentes
		let token;

		// De los headers de autorización
		const authHeader = req.headers.get("Authorization");
		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7);
		}

		// Si no hay token en headers, buscamos en las cookies
		if (!token) {
			const cookieStore = cookies();
			token = cookieStore.get("jwt_token")?.value;
		}

		if (!token) {
			return null;
		}

		const decoded = verifyToken(token);
		if (!decoded) {
			return null;
		}

		return decoded;
	} catch (error) {
		console.error("Error al obtener usuario autenticado:", error);
		return null;
	}
}

// Middleware para proteger rutas
export async function authMiddleware(req) {
	const user = await getAuthUser(req);

	if (!user) {
		return NextResponse.json(
			{ success: false, message: "No autorizado" },
			{ status: 401 }
		);
	}

	return user;
}

// Función para hashear una contraseña
export async function hashPassword(password) {
	const bcrypt = require("bcrypt");
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}

// Función para comparar una contraseña con su hash
export async function comparePassword(password, hashedPassword) {
	const bcrypt = require("bcrypt");
	return bcrypt.compare(password, hashedPassword);
}
