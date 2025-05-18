import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

// Rutas que no requieren autenticación
const publicPaths = [
	"/manager/login",
	"/manager/recovery-password",
	"/manager/reset-password",
];

export default function middleware(req) {
	const path = req.nextUrl.pathname;

	// Permitir rutas públicas
	if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
		return NextResponse.next();
	}

	// Verificar token de autenticación
	const token =
		req.cookies.get("jwt_token")?.value ||
		req.headers.get("Authorization")?.split(" ")[1];

	if (!token) {
		// Redirigir al login si no hay token
		return NextResponse.redirect(new URL("/manager/login", req.url));
	}

	const decoded = verifyToken(token);
	if (!decoded) {
		// Redirigir al login si el token no es válido
		return NextResponse.redirect(new URL("/manager/login", req.url));
	}

	// Continuar con la solicitud
	return NextResponse.next();
}

export const config = {
	// Aplicar middleware a todas las rutas que empiezan con /manager excepto las públicas
	matcher: ["/manager/:path*"],
};
