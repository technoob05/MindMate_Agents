import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Interface cho cấu trúc dữ liệu
interface UserAnswer {
  userId: string;
  answers: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

interface Question {
  id: string;
  groupId: string;
  title: string;
  description: string;
  quote?: string;
  type: string;
  options: string[];
}

interface QuestionGroup {
  id: string;
  name: string;
}

interface GraphData {
  questionGroups: QuestionGroup[];
  questions: Question[];
  userAnswers: UserAnswer[];
}

// Thêm interfaces mới cho cấu trúc dữ liệu knowledge graph
interface KnowledgeGraphRelationship {
  head: string;
  head_type: string;
  relation: string;
  tail: string;
  tail_type: string;
}

interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  value: number;
  description: string;
}

interface KnowledgeGraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

// URL endpoint của Mistral API (có thể sử dụng Hugging Face Inference API hoặc API tự host)
const MISTRAL_API_URL = process.env.MISTRAL_API_URL || "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";

// Hàm GET để lấy knowledge graph của người dùng
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Lấy userId từ URL params
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Đường dẫn đến file graphdtb.json
    const filePath = path.join(process.cwd(), 'graphdtb.json');

    // Đọc nội dung của file
    let graphData: GraphData;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      graphData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading graphdtb.json:', error);
      return NextResponse.json(
        { message: "Error reading user data" },
        { status: 500 }
      );
    }

    // Tìm dữ liệu của người dùng
    const userAnswerData = graphData.userAnswers.find(
      (answer) => answer.userId === userId
    );

    if (!userAnswerData) {
      return NextResponse.json(
        { message: "User data not found" },
        { status: 404 }
      );
    }

    // Chuẩn bị dữ liệu chi tiết hơn bằng cách kết hợp câu hỏi và câu trả lời
    const detailedUserData = prepareDetailedUserData(userAnswerData, graphData.questions);

    // Kiểm tra xem đã tạo knowledge graph cho user này chưa
    const kgFilePath = path.join(process.cwd(), 'data', 'knowledge_graphs', `${userId}.json`);
    try {
      // Nếu file tồn tại và không quá cũ, sử dụng lại
      if (fs.existsSync(kgFilePath)) {
        const stats = fs.statSync(kgFilePath);
        const fileAge = Date.now() - stats.mtimeMs;
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 ngày
        
        if (fileAge < MAX_AGE) {
          const kgData = JSON.parse(fs.readFileSync(kgFilePath, 'utf-8'));
          return NextResponse.json({
            userId,
            knowledgeGraph: kgData.knowledgeGraph,
            userDescription: kgData.userDescription,
            raw: detailedUserData,
            source: 'cache'
          });
        }
      }
    } catch (error) {
      console.warn('Error reading cached knowledge graph:', error);
      // Tiếp tục tạo mới nếu có lỗi với file cache
    }

    // Tạo knowledge graph bằng Mistral-7B
    const knowledgeGraph = await generateKnowledgeGraph(detailedUserData);
    
    // Tạo mô tả người dùng bằng Mistral-7B
    const userDescription = await generateUserDescription(detailedUserData);

    // Lưu kết quả để sử dụng lại sau này
    try {
      // Đảm bảo thư mục tồn tại
      const dirPath = path.join(process.cwd(), 'data', 'knowledge_graphs');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(kgFilePath, JSON.stringify({
        userId,
        knowledgeGraph,
        userDescription,
        createdAt: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      console.warn('Error caching knowledge graph:', error);
    }

    return NextResponse.json({
      userId,
      knowledgeGraph,
      userDescription,
      raw: detailedUserData,
      source: 'generated'
    });
  } catch (error) {
    console.error('Error generating knowledge graph:', error);
    return NextResponse.json(
      { message: "Failed to generate knowledge graph" },
      { status: 500 }
    );
  }
}

// Hàm chuẩn bị dữ liệu chi tiết của người dùng
function prepareDetailedUserData(
  userAnswer: UserAnswer,
  questions: Question[]
) {
  const detailedData: Record<string, any> = {};
  
  // Duyệt qua tất cả câu trả lời của người dùng
  Object.entries(userAnswer.answers).forEach(([questionId, answer]) => {
    // Tìm thông tin câu hỏi tương ứng
    const question = questions.find(q => q.id === questionId);
    
    if (question) {
      detailedData[questionId] = {
        question: question.title,
        description: question.description,
        type: question.type,
        answer: answer
      };
    }
  });
  
  return detailedData;
}

// Hàm tạo knowledge graph bằng Mistral-7B
async function generateKnowledgeGraph(detailedUserData: Record<string, any>): Promise<KnowledgeGraphData> {
  try {
    const prompt = `
You are a knowledge graph expert specialized in psychological profiling based on natural language user inputs.

Your task is to extract entities and psychological or relational connections from a given user input, in order to build a personalized knowledge graph.

You must generate the output in a JSON array, where each element is a JSON object with only the following first-level keys:
- "head"
- "head_type"
- "relation"
- "tail"
- "tail_type"

Guidelines:
1. Entities must reflect psychological traits, identity attributes, relationships, emotional states, beliefs, behaviors, mental health conditions, or lifestyle factors.
2. Relation types should be psychologically meaningful, such as: *identifies_as*, *experiences*, *has_relationship_status*, *believes_in*, *suffers_from*, *engages_in*, *feels*, *values*, *prefers*, etc.
3. Use abstract but precise types for entities such as: *personality_trait*, *identity*, *emotion*, *mental_state*, *belief*, *relationship*, *habit*, *symptom*, *coping_mechanism*, etc.
4. Do not infer or hallucinate. Only extract what is grounded in the input.

The following is data from a mental health questionnaire completed by a user:
${JSON.stringify(detailedUserData, null, 2)}

Example Output:
[
  {
    "head": "User",
    "head_type": "identity",
    "relation": "identifies_as",
    "tail": "introvert",
    "tail_type": "personality_trait"
  },
  {
    "head": "User",
    "head_type": "identity",
    "relation": "feels",
    "tail": "anxious in social situations",
    "tail_type": "emotion"
  }
]

The final JSON must strictly use the keys: "head", "head_type", "relation", "tail", and "tail_type".
Do not include any metadata, explanations, or additional wrapping text.
`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          { role: "system", content: "You are a knowledge graph expert specialized in psychological profiling." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const result = await response.json() as any;
    const content = result.choices[0].message.content || '[]';

    // Xử lý output để lấy JSON
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim();
    }

    // Cố gắng parse JSON
    try {
      const relationships = JSON.parse(jsonStr) as KnowledgeGraphRelationship[];
      
      // Chuyển đổi từ định dạng mới sang định dạng cũ (nodes và edges)
      const nodesMap = new Map<string, KnowledgeGraphNode>();
      const edges: KnowledgeGraphEdge[] = [];
      
      // Thêm node User mặc định
      nodesMap.set("User", {
        id: "User",
        label: "User",
        type: "person",
        value: 3,
        description: "The user"
      });
      
      // Xử lý các mối quan hệ
      relationships.forEach((rel: KnowledgeGraphRelationship) => {
        // Xử lý head
        if (!nodesMap.has(rel.head)) {
          nodesMap.set(rel.head, {
            id: rel.head,
            label: rel.head,
            type: rel.head_type,
            value: 3,
            description: `${rel.head} (${rel.head_type})`
          });
        }
        
        // Xử lý tail
        if (!nodesMap.has(rel.tail)) {
          nodesMap.set(rel.tail, {
            id: rel.tail,
            label: rel.tail,
            type: rel.tail_type,
            value: 3,
            description: `${rel.tail} (${rel.tail_type})`
          });
        }
        
        // Tạo edge
        edges.push({
          source: rel.head,
          target: rel.tail,
          label: rel.relation,
          weight: 3
        });
      });
      
      // Chuyển đổi thành mảng nodes
      const nodes = Array.from(nodesMap.values());
      
      return { nodes, edges };
    } catch (error) {
      console.error("Error parsing knowledge graph JSON:", error);
      console.log("Raw response:", content);
      // Trả về một đồ thị đơn giản mặc định
      return {
        nodes: [
          { id: "user", label: "User", type: "person", value: 3, description: "The user" }
        ],
        edges: []
      };
    }
  } catch (error) {
    console.error("Error generating knowledge graph with Mistral:", error);
    return {
      nodes: [
        { id: "user", label: "User", type: "person", value: 3, description: "The user" }
      ],
      edges: []
    };
  }
}

// Hàm tạo mô tả người dùng
async function generateUserDescription(detailedUserData: Record<string, any>): Promise<string> {
  try {
    const prompt = `
    # Task: User Psychological Profile Description
    
    ## User Data
    The following is data from a mental health questionnaire completed by a user:
    ${JSON.stringify(detailedUserData, null, 2)}
    
    ## Instructions
    Create a concise but detailed psychological profile of this user based on their questionnaire responses.
    Include insights about:
    - Their mental health status and challenges
    - Therapeutic needs and goals
    - Recommended approaches for therapy
    - Key personality traits
    
    The profile should be 2-3 paragraphs in professional but accessible language.
    `;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const result = await response.json() as any;
    return result.choices[0].message.content || "Unable to generate user description.";
  } catch (error) {
    console.error("Error generating user description with Mistral:", error);
    return "Unable to generate user description at this time.";
  }
} 