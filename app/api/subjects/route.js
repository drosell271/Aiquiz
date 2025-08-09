import { NextResponse } from "next/server";
import dbConnect from "../../utils/dbconnect";
import Subject from "../../manager/models/Subject";
import Topic from "../../manager/models/Topic";
import Subtopic from "../../manager/models/Subtopic";

const logger = require('../../utils/logger').create('API:SUBJECTS');

export async function GET() {
    try {
        await dbConnect();
        
        const subjects = await Subject.find({})
            .populate({
                path: 'topics',
                populate: {
                    path: 'subtopics'
                }
            })
            .lean();

        logger.info('Retrieved subjects successfully', { 
            subjectCount: subjects.length 
        });
        if (subjects.length > 0) {
            logger.debug('Subject structure sample', { 
                firstSubject: subjects[0] 
            });
        }

        // Transformar los datos para que coincidan con el formato esperado por la aplicación principal
        const transformedSubjects = subjects.map(subject => ({
            _id: subject._id,
            name: subject.title || '',
            acronym: subject.acronym || '',
            description: subject.description || '',
            topics: (subject.topics || []).map(topic => ({
                _id: topic._id,
                value: (topic.title || '').toLowerCase().replace(/\s+/g, '_'),
                label: topic.title || '',
                subtopics: (topic.subtopics || []).map(subtopic => ({
                    _id: subtopic._id,
                    title: subtopic.title || '',
                    comment: subtopic.description || '',
                    files: [] // Por ahora vacío, se puede llenar con archivos relacionados
                }))
            }))
        }));

        return NextResponse.json({
            success: true,
            subjects: transformedSubjects
        });

    } catch (error) {
        logger.error("Error fetching subjects", { 
            error: error.message, 
            stack: error.stack 
        });
        return NextResponse.json({
            success: false,
            error: "Error fetching subjects"
        }, { status: 500 });
    }
}