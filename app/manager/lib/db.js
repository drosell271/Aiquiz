import mongoose from "mongoose";

// Configuración para la conexión a MongoDB en Docker
const MONGODB_URI =
	process.env.MONGODB_URI ||
	"mongodb://admin:password@localhost:27017/aiquiz?authSource=admin";

if (!MONGODB_URI) {
	throw new Error("Por favor, define la variable de entorno MONGODB_URI");
}

let cached = global.mongoose;

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
			useNewUrlParser: true,
			useUnifiedTopology: true,
		};

		cached.promise = mongoose
			.connect(MONGODB_URI, opts)
			.then((mongoose) => {
				console.log("Conexión a MongoDB establecida");
				return mongoose;
			});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		throw e;
	}

	return cached.conn;
}

export default dbConnect;
