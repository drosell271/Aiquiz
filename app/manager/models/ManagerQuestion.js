// models/ManagerQuestion.js - Modelo específico para preguntas del manager
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Subdocumento para opciones de respuesta
const ChoiceSchema = new Schema({
	text: {
		type: String,
		required: [true, "El texto de la opción es obligatorio"],
		trim: true,
	},
	isCorrect: {
		type: Boolean,
		default: false,
	},
});

const ManagerQuestionSchema = new Schema(
	{
		text: {
			type: String,
			required: [true, "El texto de la pregunta es obligatorio"],
			trim: true,
		},
		type: {
			type: String,
			required: [true, "El tipo de pregunta es obligatorio"],
			enum: ["Opción múltiple", "Verdadero/Falso", "Respuesta corta", "Ensayo"],
			default: "Opción múltiple",
		},
		difficulty: {
			type: String,
			required: [true, "La dificultad es obligatoria"],
			enum: ["Fácil", "Medio", "Avanzado"],
			default: "Fácil",
		},
		choices: [ChoiceSchema],
		explanation: {
			type: String,
			trim: true,
		},
		topic: {
			type: Schema.Types.ObjectId,
			ref: "Topic",
			required: [true, "El tema es obligatorio"],
		},
		subtopic: {
			type: Schema.Types.ObjectId,
			ref: "Subtopic",
			required: false,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		verified: {
			type: Boolean,
			default: false,
		},
		rejected: {
			type: Boolean,
			default: false,
		},
		tags: [{
			type: String,
			trim: true,
		}],
		// Metadatos para generación automática
		generated: {
			type: Boolean,
			default: false,
		},
		llmModel: {
			type: String,
			trim: true,
		},
		generationPrompt: {
			type: String,
			trim: true,
		},
		// Estadísticas de uso
		usageCount: {
			type: Number,
			default: 0,
		},
		correctAnswersCount: {
			type: Number,
			default: 0,
		},
		totalAnswersCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtual para calcular la tasa de acierto
ManagerQuestionSchema.virtual("successRate").get(function() {
	if (this.totalAnswersCount === 0) return 0;
	return (this.correctAnswersCount / this.totalAnswersCount) * 100;
});

// Método para verificar la pregunta
ManagerQuestionSchema.methods.verify = async function(isValid) {
	this.verified = isValid;
	this.rejected = !isValid;
	await this.save();
	return this;
};

// Método para incrementar estadísticas de uso
ManagerQuestionSchema.methods.recordAnswer = async function(isCorrect) {
	this.usageCount += 1;
	this.totalAnswersCount += 1;
	if (isCorrect) {
		this.correctAnswersCount += 1;
	}
	await this.save();
	return this;
};

// Método estático para generar preguntas
ManagerQuestionSchema.statics.generateQuestions = async function(topicId, subtopicId, params) {
	const { count = 5, difficulty = "Fácil", type = "Opción múltiple" } = params;
	
	// Aquí se integraría con el servicio de generación de preguntas
	// Por ahora, creamos preguntas de ejemplo
	const questions = [];
	
	for (let i = 0; i < count; i++) {
		const question = new this({
			text: `Pregunta generada automáticamente ${i + 1} - ${difficulty}`,
			type,
			difficulty,
			topic: topicId,
			subtopic: subtopicId,
			choices: [
				{ text: "Opción correcta", isCorrect: true },
				{ text: "Opción incorrecta 1", isCorrect: false },
				{ text: "Opción incorrecta 2", isCorrect: false },
				{ text: "Opción incorrecta 3", isCorrect: false },
			],
			explanation: `Explicación de la pregunta ${i + 1}`,
			generated: true,
			llmModel: "gpt-3.5-turbo",
			generationPrompt: `Generate a ${difficulty} question about the topic`,
		});
		
		questions.push(question);
	}
	
	return this.insertMany(questions);
};

// Índices para optimizar búsquedas
ManagerQuestionSchema.index({ topic: 1 });
ManagerQuestionSchema.index({ subtopic: 1 });
ManagerQuestionSchema.index({ difficulty: 1 });
ManagerQuestionSchema.index({ type: 1 });
ManagerQuestionSchema.index({ verified: 1 });
ManagerQuestionSchema.index({ rejected: 1 });
ManagerQuestionSchema.index({ createdBy: 1 });
ManagerQuestionSchema.index({ text: "text", explanation: "text" });

// Export the model, avoiding OverwriteModelError during development
const ManagerQuestion = mongoose.models.ManagerQuestion || mongoose.model("ManagerQuestion", ManagerQuestionSchema);

module.exports = ManagerQuestion;