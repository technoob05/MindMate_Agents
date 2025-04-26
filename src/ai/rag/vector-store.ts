import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import fs from "fs/promises";

// Path for storing persisted embeddings
const EMBEDDINGS_DIR = path.join(process.cwd(), 'data', 'embeddings');

// Initialize embeddings model
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
  modelName: "embedding-001",
});

// In-memory store when database is initialized
let vectorStore: MemoryVectorStore | null = null;

// Types for storing vector data
interface VectorData {
  documents: Document[];
  vectors: number[][];
}

// Array to store documents and their embeddings when no vector store exists yet
let storedDocuments: Document[] = [];
let storedVectors: number[][] = [];

/**
 * Initialize the vector store
 */
export async function initVectorStore() {
  try {
    // Ensure the embeddings directory exists
    await fs.mkdir(EMBEDDINGS_DIR, { recursive: true });
    
    // Initialize empty vector store if not already created
    if (!vectorStore) {
      vectorStore = new MemoryVectorStore(embeddings);
      
      // Try to load any persisted embeddings
      try {
        const persistedData = await fs.readFile(
          path.join(EMBEDDINGS_DIR, 'embeddings.json'), 
          'utf-8'
        );
        
        const { documents, vectors } = JSON.parse(persistedData) as VectorData;
        
        if (documents && vectors && documents.length > 0 && vectors.length > 0) {
          // Create documents from the stored data
          const docs = documents.map(doc => 
            new Document({
              pageContent: doc.pageContent,
              metadata: doc.metadata
            })
          );
          
          // Add documents to the vector store
          await vectorStore.addVectors(vectors, docs);
          storedDocuments = docs;
          storedVectors = vectors;
          
          console.log(`Loaded ${documents.length} documents with ${vectors.length} vectors from persisted storage`);
        } else {
          console.log("Found persisted data but vectors are empty. Starting fresh.");
        }
      } catch (error) {
        // No persisted data exists yet, that's fine
        console.log("No persisted vector data found, starting with empty store");
      }
    }
    
    return vectorStore;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    throw new Error("Failed to initialize vector store");
  }
}

/**
 * Save the current vector store to disk
 */
export async function persistVectorStore() {
  if (!vectorStore) return;
  
  try {
    // Ensure we have both documents and vectors
    if (storedDocuments.length === 0) {
      console.log("No documents to persist");
      return;
    }
    
    // Generate embeddings for any documents that don't have vectors yet
    if (storedVectors.length < storedDocuments.length) {
      console.log("Generating missing embeddings for persistence...");
      const newDocs = storedDocuments.slice(storedVectors.length);
      const texts = newDocs.map(doc => doc.pageContent);
      const newEmbeddings = await embeddings.embedDocuments(texts);
      storedVectors = [...storedVectors, ...newEmbeddings];
    }
    
    // Write to file
    await fs.writeFile(
      path.join(EMBEDDINGS_DIR, 'embeddings.json'),
      JSON.stringify({ 
        documents: storedDocuments, 
        vectors: storedVectors 
      }, null, 2)
    );
    
    console.log(`Persisted ${storedDocuments.length} documents with vectors to disk`);
  } catch (error) {
    console.error("Error persisting vector store:", error);
  }
}

/**
 * Process a document for RAG
 * @param content The text content to process
 * @param metadata Optional metadata about the document
 */
export async function addDocumentToVectorStore(
  content: string, 
  metadata: Record<string, any> = {}
) {
  if (!vectorStore) {
    await initVectorStore();
  }
  
  // Split the document into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,  // Smaller chunks for more granular matching
    chunkOverlap: 100,
  });
  
  const docs = await textSplitter.createDocuments(
    [content],
    [{ ...metadata, createdAt: new Date().toISOString() }]
  );
  
  console.log(`Adding ${docs.length} chunks to vector store`);
  
  // Generate embeddings for the documents
  const texts = docs.map(doc => doc.pageContent);
  const docEmbeddings = await embeddings.embedDocuments(texts);
  
  // Add to vector store
  await vectorStore!.addVectors(docEmbeddings, docs);
  
  // Store documents and vectors for persistence
  storedDocuments = [...storedDocuments, ...docs];
  storedVectors = [...storedVectors, ...docEmbeddings];
  
  // Persist the updated vector store
  await persistVectorStore();
  
  return docs.length;
}

/**
 * Retrieve relevant document chunks for a query
 * @param query The user's query
 * @param maxResults Maximum number of results to return
 */
export async function retrieveRelevantDocuments(query: string, maxResults: number = 5) {
  if (!vectorStore) {
    await initVectorStore();
  }
  
  // If the store is empty, return empty array
  if (storedDocuments.length === 0) {
    return [];
  }
  
  try {
    // Use a higher maxResults to get more comprehensive coverage
    const results = await vectorStore!.similaritySearch(query, Math.max(5, maxResults));
    
    // Filter for relevance if needed (could add a similarity threshold here)
    return results;
  } catch (error) {
    console.error("Error retrieving documents:", error);
    return [];
  }
}

/**
 * Process a file for RAG - handles different file types
 * @param file The file to process
 * @param fileName The name of the file
 */
export async function processFileForRag(file: File | Buffer, fileName: string) {
  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else {
      // For browser File objects
      const arrayBuffer = await (file as File).arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    
    // Get file extension
    const fileExt = path.extname(fileName).toLowerCase();
    
    // Basic metadata
    const metadata = {
      source: fileName,
      fileType: fileExt.replace('.', ''),
    };
    
    // For now, just handle text files - expand later for other formats
    // In a production system, you'd add support for PDF, DOCX, etc.
    if (fileExt === '.txt' || fileExt === '') {
      const content = buffer.toString('utf-8');
      return await addDocumentToVectorStore(content, metadata);
    } else {
      // For unsupported file types
      throw new Error(`Unsupported file type: ${fileExt}`);
    }
  } catch (error) {
    console.error(`Error processing file for RAG: ${fileName}`, error);
    throw error;
  }
}

/**
 * Get context-enhanced prompt based on the query
 * @param query The user's query
 */
export async function getEnhancedPrompt(query: string) {
  // Use more chunks for better context coverage
  const relevantDocs = await retrieveRelevantDocuments(query, 5);
  
  let enhancedPrompt = '';
  let hasRelevantContext = false;
  
  if (relevantDocs.length > 0) {
    // Format the context
    const context = relevantDocs
      .map((doc, i) => `[Document ${i + 1}]\n${doc.pageContent}\n`)
      .join('\n');
    
    // Create RAG-enhanced prompt when we have relevant documents
    enhancedPrompt = `
Answer the following question using the provided context if relevant. If the question cannot be fully answered with the context, use your general knowledge to provide a complete answer without mentioning or referencing the documents or context at all.

IMPORTANT: Never state "the documents/context don't contain information about X" or any variation of this. Just answer the question directly from your knowledge.

Context:
${context}

User Question: ${query}

Answer:`;

    hasRelevantContext = true;
  } else {
    // If no relevant documents, answer directly without mentioning the absence of context
    enhancedPrompt = `
Answer the following question based on your knowledge. Provide a direct, helpful response.

User Question: ${query}

Answer:`;
    
    hasRelevantContext = false;
  }
  
  return {
    hasContext: hasRelevantContext,
    prompt: enhancedPrompt,
    sourceDocs: relevantDocs
  };
} 