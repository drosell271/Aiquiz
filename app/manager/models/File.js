// models/File.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FileSchema = new Schema(
	{
		fileName: {
			type: String,
			required: [true, "El nombre del archivo es obligatorio"],
			trim: true,
		},
		originalName: {
			type: String,
			required: [true, "El nombre original es obligatorio"],
			trim: true,
		},
		mimeType: {
			type: String,
			required: [true, "El tipo MIME es obligatorio"],
		},
		size: {
			type: Number,
			required: [true, "El tamaño es obligatorio"],
		},
		path: {
			type: String,
			required: [true, "La ruta es obligatoria"],
		},
		fileType: {
			type: String,
			enum: ["document", "image", "video", "other"],
			default: "document",
		},
		subtopic: {
			type: Schema.Types.ObjectId,
			ref: "Subtopic",
			required: [true, "El subtema es obligatorio"],
		},
		uploadedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		isExternal: {
			type: Boolean,
			default: false,
		},
		externalUrl: {
			type: String,
			trim: true,
		},
		platform: {
			type: String,
			enum: ["local", "youtube", "vimeo", "other"],
			default: "local",
		},
	},
	{
		timestamps: true,
	}
);

// Método para obtener la URL completa del archivo
FileSchema.methods.getUrl = function (baseUrl) {
	if (this.isExternal) {
		return this.externalUrl;
	}
	return `${baseUrl}/uploads/${this.path}`;
};

// Índices para optimizar búsquedas
FileSchema.index({ subtopic: 1 });
FileSchema.index({ fileType: 1 });
FileSchema.index({ fileName: "text", originalName: "text" });

const File = mongoose.model("File", FileSchema);

module.exports = File;
