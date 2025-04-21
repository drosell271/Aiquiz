// app/manager/contexts/SubjectContext.tsx
import { createContext, Dispatch, SetStateAction } from "react";

// Definimos las interfaces necesarias
export interface SubTopic {
	id: string;
	title: string;
}

export interface Topic {
	id: string;
	title: string;
	description: string;
	subtopics: SubTopic[];
}

export interface Professor {
	id: string;
	name: string;
	email: string;
}

export interface Subject {
	id: string;
	title: string;
	acronym: string;
	description: string;
	topics: Topic[];
	professors: Professor[];
}

// Definimos la interfaz para el contexto
export interface SubjectContextType {
	subject: Subject | null;
	loading: boolean;
	setSubject: Dispatch<SetStateAction<Subject | null>>;
}

// Creamos el contexto con valores por defecto seguros
export const SubjectContext = createContext<SubjectContextType>({
	subject: null,
	loading: true,
	setSubject: () => {},
});
