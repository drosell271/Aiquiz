import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const logger = require('../../utils/logger').create('API:OPENAPI');

export async function GET() {
  // Only allow access in development environment
  if (process.env.NODE_ENV !== 'development') {
    logger.warn('OpenAPI access denied - not in development mode');
    return NextResponse.json(
      { error: 'API documentation is only available in development environment' },
      { status: 403 }
    );
  }

  try {
    logger.debug('Reading OpenAPI specification file');
    // Read the OpenAPI YAML file
    const filePath = join(process.cwd(), 'openapi.yaml');
    const yamlContent = readFileSync(filePath, 'utf8');
    
    logger.info('OpenAPI specification served successfully');
    return new NextResponse(yamlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-yaml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Error reading OpenAPI specification', { error: error.message, stack: error.stack });
    return NextResponse.json(
      { error: 'Failed to load OpenAPI specification' },
      { status: 500 }
    );
  }
}