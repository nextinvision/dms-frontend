import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), '.next/static/chunks/7200.6d0db3ca9f7d654d.js');
    const fileContent = readFileSync(filePath, 'utf-8');
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving chunk 7200:', error);
    return new NextResponse('Not Found', { status: 404 });
  }
}
