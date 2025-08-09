import Question from '../models/Question.js';
import Student from '../models/Student.js';

import dbConnect from '../utils/dbconnect.js';

import { ABC_Testing_List } from '../constants/abctesting.js';
import modelsJSON from '../../models.json';
import aiquizConfig from '../../aiquiz.config.js';

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

const logger = require('./logger').create('MODEL_MANAGER');


logger.debug('Initializing model manager...');
await dbConnect();
logger.info('Model manager initialized successfully');


// Asignar modelo LLM al Alumno
export async function assignAIModel(abcTestingConfig, has_abctesting, existingStudent, studentSubjectData, subjectIndex) {
    try {
        // Leemos los modelos disponibles desde el archivo models.json
        const allModels = await getAvailableModels();
        const modelNames = allModels.map(m => m.name);

        // Buscamos el modelo asignado en caso de existir 
        let assignedModel = studentSubjectData.subjectModel;

        // Buscamos los prompts definidos en el ABCTesting en caso de haberlos
        let arrayPrompts = abcTestingConfig
            ? Object.keys(abcTestingConfig)
                .filter(key => key.startsWith("prompt"))
                .map(key => abcTestingConfig[key].content)
            : [];

        // VALIDAR LOS MODELOS DEFINIDOS EN ABC_Testing_List, por si hay alguno invalido porque haya sido eliminado de models.json o  mal configurado
        if (has_abctesting) {
            // Comprobamos si hay algun modelo en el ABC_Testing_List que no esté en models.json
            const invalidModels = abcTestingConfig.models.filter(model => !modelNames.includes(model));
            if (invalidModels.length > 0) {
                logger.error('Invalid models in ABCTesting configuration', {
                    subject: studentSubjectData.subjectName,
                    invalidModels: invalidModels,
                    message: 'Ensure these models are configured with the same name in models.json'
                });
                has_abctesting = false;
            } else if (abcTestingConfig.models.length > 1 && arrayPrompts.length > 1) {
                // ABCTesting activo y mas de un prompt definido: asignar primer modelo del array en caso de haber varios
                logger.error('Multiple models defined in ABCTesting with multiple study prompts', {
                    subject: studentSubjectData.subjectName,
                    modelCount: abcTestingConfig.models.length,
                    promptCount: arrayPrompts.length,
                    message: 'Remove additional prompts or assign a single model to ABCTesting - cannot study with two different variables'
                });
            }
        }


        // Reasignar modelo si:
        // 1. El modelo asignado no está en models.json
        // 2. La asignatura tiene ABCTesting y el modelo asignado no está en los modelos de ABCTesting
        // 3. ABCTesting de la asignatura está desactivado y el estudiante tiene ABCTesting activado en la configuración anterior
        // 4. ABCTesting de la asignatura está activado, hay varios prompts de estudio, hay varios modelos definidos y el modelo asignado no es el primero del array
        // 5. ABCTesting de la asignatura está desactivado y keepmodel es false
        const shouldReassignModel = !modelNames.includes(assignedModel) ||
            (has_abctesting && !abcTestingConfig.models.includes(assignedModel)) ||
            (!has_abctesting && existingStudent.subjects[subjectIndex].ABC_Testing) ||
            (arrayPrompts.length > 1 && abcTestingConfig.models.length > 1 && abcTestingConfig.models[0] !== assignedModel) ||
            (!has_abctesting && aiquizConfig.keepmodel === false);

        if (!shouldReassignModel) {
            // Si el modelo ya asignado al alumno es válido, siendo ABCTesting activo o no, y keepmodel es true
            // Se mantiene el modelo asignado
            logger.info('Assigned model meets all requirements', {
                assignedModel: assignedModel,
                subject: studentSubjectData.subjectName,
                keepModel: aiquizConfig.keepmodel,
                message: aiquizConfig.keepmodel ? 'keepmodel is true - other assignment priorities ignored' : 'Model assignment validated'
            });

            return assignedModel;

        } else {
            // Si el modelo asignado no es válido, reasignar modelo
            let reason = 'Unknown reason';
            if (assignedModel === "Nuevo estudiante") {
                reason = 'New student with no assigned model';
            } else if (!modelNames.includes(assignedModel)) {
                reason = 'Assigned model not found in models.json';
            } else if (has_abctesting && !abcTestingConfig.models.includes(assignedModel)) {
                reason = 'Subject has ABCTesting but assigned model not in ABCTesting models';
            } else if (!has_abctesting && existingStudent.subjects[subjectIndex].ABC_Testing) {
                reason = 'ABCTesting disabled but student has ABCTesting enabled from previous configuration';
            } else if (arrayPrompts.length > 1 && abcTestingConfig.models.length > 1 && abcTestingConfig.models[0] !== assignedModel) {
                reason = 'ABCTesting active with multiple prompts and models, but assigned model is not first in array';
            } else if (!has_abctesting && aiquizConfig.keepmodel === false) {
                reason = 'ABCTesting disabled and keepmodel is false';
            }
            
            logger.warn('Reassigning model', {
                currentModel: assignedModel,
                subject: studentSubjectData.subjectName,
                reason: reason,
                hasAbcTesting: has_abctesting,
                keepModel: aiquizConfig.keepmodel
            });

            assignedModel = await getProperModel(modelNames, studentSubjectData.subjectName, has_abctesting);

            // Actualizar el modelo y el estado de ABCTesting del estudiante
            existingStudent.subjects[subjectIndex].subjectModel = assignedModel;
            existingStudent.subjects[subjectIndex].ABC_Testing = has_abctesting;

            // Guardar los cambios en el estudiante
            await existingStudent.save();
        }

        return assignedModel;

    } catch (error) {
        logger.error('Error assigning the model', { error: error.message, stack: error.stack });
        throw new Error('Could not assign the model');
    }

};




const getProperModel = async (modelNames, subjectName, has_abctesting) => {
    let assignedModel;
    const abcTestingConfig = ABC_Testing_List[subjectName];
    if (has_abctesting) {
        // Buscamos los prompts definidos en el ABCTesting en caso de haberlos
        let arrayPrompts = abcTestingConfig
            ? Object.keys(abcTestingConfig)
                .filter(key => key.startsWith("prompt"))
                .map(key => abcTestingConfig[key].content)
            : [];

        // ABCTesting activo y mas de un prompt definido: asignar primer modelo del array en caso de haber varios
        if (abcTestingConfig.models.length > 1 && arrayPrompts.length > 1) {
            assignedModel = abcTestingConfig.models[0];
            logger.error('Multiple models with multiple prompts in ABCTesting - assigning first model', {
                subject: subjectName,
                assignedModel: assignedModel,
                modelCount: abcTestingConfig.models.length,
                promptCount: arrayPrompts.length,
                message: 'Remove additional prompts or assign single model - cannot study with two different variables'
            });

        } else {
            // ABCTesting activo y un único prompt definido o ninguno: asignar modelo equitativo entre los definidos 
            // en el array si hay varios o asignar el unico modelo definido si solo hay uno
            assignedModel = await getEquitableModel(abcTestingConfig.models, subjectName);
            logger.info('Assigning equitable model with active ABCTesting', {
                subject: subjectName,
                assignedModel: assignedModel,
                availableModels: abcTestingConfig.models
            });
        }

    } else {
        // ABCTesting no activo: asignar modelo teniendo en cuenta la prioridad de asignación de aiquiz.config.js
        if (aiquizConfig.costPriority === true) {
            assignedModel = await getLowerCostModel(subjectName);
            logger.info('Assigning lowest cost model', {
                subject: subjectName,
                assignedModel: assignedModel
            });
        } else if (aiquizConfig.fewerReportedPriority === true) {
            assignedModel = await getFewerReportedModel(subjectName);
            logger.info('Assigning model with fewer reported issues', {
                subject: subjectName,
                assignedModel: assignedModel
            });
        } else {
            assignedModel = await getEquitableModel(modelNames, subjectName);
            logger.info('Assigning equitable model', {
                subject: subjectName,
                assignedModel: assignedModel,
                availableModels: modelNames
            });
        }
    }
    return assignedModel;
};

// Obtenemos el modelo más equitativo de una lista de modelos que se pasan como parametro
const getEquitableModel = async (modelNames, subjectName) => {
    const studentCount = await getStudentCountByModel(subjectName);
    let selectedModel = modelNames[0];

    for (const model of modelNames) {
        const modelStudentCount = studentCount[model] || 0;
        if (modelStudentCount < (studentCount[selectedModel] || 0)) {
            selectedModel = model;
        }
    }

    return selectedModel;
};

// Obtenemos el modelo con menor coste y en caso de varios modelos
// del mismo coste repartimos los alumnos entre los modelos de manera equitativa
const getLowerCostModel = async (subjectName) => {
    // Obtener todos los modelos disponibles desde models.json
    const models = modelsJSON.models;

    let lowestTokenPrice = Infinity;
    let lowestCostModels = [];

    // Encontrar los modelos con el menor precio de token
    models.forEach((model) => {
        if (model.tokenPrice < lowestTokenPrice) {
            lowestTokenPrice = model.tokenPrice;
            lowestCostModels = [model.name];
        } else if (model.tokenPrice === lowestTokenPrice) {
            lowestCostModels.push(model.name);
        }
    });

    // Si solo hay un modelo con el menor precio, devolverlo directamente
    if (lowestCostModels.length === 1) {
        return lowestCostModels[0];
    }

    // Si hay varios modelos con el mismo costo, elegir el más equitativo
    return await getEquitableModel(lowestCostModels, subjectName);
};

// Obtenemos el modelo con menos fallos reportados
const getFewerReportedModel = async (subjectName) => {
    const models = await getAvailableModels();
    let fewerReportsModel = null;
    let minReports = Infinity;

    for (const model of models) {
        const reports = await Question.countDocuments({
            subject: subjectName,
            llmModel: model.name,
            studentReport: true
        });
        if (reports < minReports) {
            minReports = reports;
            fewerReportsModel = model.name;
        }
    }
    logger.debug('Found model with fewer reports', {
        subject: subjectName,
        model: fewerReportsModel,
        reportCount: minReports
    });

    return fewerReportsModel;
};

// Contar estudiantes por cada modelo distinto asignado a una misma asignatura
const getStudentCountByModel = async (subjectName) => {
    const counts = {};
    const students = await Student.find({ "subjects.subjectName": subjectName });

    students.forEach(student => {
        student.subjects.forEach(s => {
            if (s.subjectName === subjectName) {
                counts[s.subjectModel] = (counts[s.subjectModel] || 0) + 1;
            }
        });
    });
    return counts;
};

// Obtener los modelos disponibles desde models.json
const getAvailableModels = async () => {
    try {
        const modelsPath = path.resolve('models.json');
        const modelsData = fs.readFileSync(modelsPath, 'utf-8');
        const parsedModels = JSON.parse(modelsData);

        return parsedModels.models;
    } catch (error) {
        logger.error('Error reading or parsing models.json', {
            error: error.message,
            modelsPath: path.resolve('models.json')
        });
        return [];
    }
};


