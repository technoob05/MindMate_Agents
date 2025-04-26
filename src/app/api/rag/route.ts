import { NextResponse } from 'next/server';
import { processFileForRag, retrieveRelevantDocuments, initVectorStore } from '@/ai/rag/vector-store';

// Initialize vector store on server startup
(async () => {
  try {
    await initVectorStore();
    console.log('Vector store initialized');
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
  }
})();

// Upload and process files for RAG
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // Basic validation
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }
    
    console.log(`Processing file for RAG: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Process file
    const chunkCount = await processFileForRag(file, file.name);
    
    return NextResponse.json({ 
      success: true, 
      message: `File processed successfully into ${chunkCount} chunks`,
      fileName: file.name
    });
  } catch (error: any) {
    console.error('Error in RAG file processing:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error processing file for RAG'
    }, { status: 500 });
  }
}

// Get relevant document chunks for a query (for debug/admin purposes)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ message: 'Query parameter is required' }, { status: 400 });
    }
    
    const results = await retrieveRelevantDocuments(query, 5);
    
    return NextResponse.json({
      success: true,
      count: results.length,
      results: results.map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata
      }))
    });
  } catch (error: any) {
    console.error('Error retrieving RAG documents:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error retrieving documents'
    }, { status: 500 });
  }
} 