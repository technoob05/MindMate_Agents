/**
 * Migration script to transition existing text files to the RAG vector database
 * 
 * Usage:
 * npx tsx src/scripts/migrate-to-rag.ts
 */
import fs from 'fs/promises';
import path from 'path';
import { initVectorStore, addDocumentToVectorStore, persistVectorStore } from '../ai/rag/vector-store';

// Define the directory where text files are stored
const DOCS_DIR = path.join(process.cwd(), 'docs');

async function main() {
  console.log('Starting migration to RAG vector database...');
  
  try {
    // Initialize the vector store
    await initVectorStore();
    console.log('✅ Vector store initialized');
    
    // Check if the docs directory exists
    try {
      await fs.access(DOCS_DIR);
    } catch (err) {
      console.log(`No docs directory found at ${DOCS_DIR}. Creating it...`);
      await fs.mkdir(DOCS_DIR, { recursive: true });
      console.log('Created docs directory. Please add your text files there and run this script again.');
      return;
    }
    
    // Get all files in the docs directory
    const files = await fs.readdir(DOCS_DIR);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    
    console.log(`Found ${textFiles.length} text files to process`);
    
    if (textFiles.length === 0) {
      console.log('No text files found in the docs directory.');
      return;
    }
    
    let totalChunks = 0;
    
    // Process each text file
    for (const file of textFiles) {
      console.log(`⏳ Processing ${file}...`);
      const filePath = path.join(DOCS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Add to vector store with robust metadata
      const chunkCount = await addDocumentToVectorStore(content, {
        source: file,
        fileType: 'txt',
        migratedOn: new Date().toISOString(),
        fullPath: filePath
      });
      
      totalChunks += chunkCount;
      console.log(`✅ Successfully processed ${file} into ${chunkCount} chunks with embeddings`);
    }
    
    // Ensure all vectors are properly saved
    await persistVectorStore();
    
    console.log(`\n🎉 Migration completed successfully! Total chunks: ${totalChunks}`);
    console.log('The system is now ready to answer questions based on your documents.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

main(); 