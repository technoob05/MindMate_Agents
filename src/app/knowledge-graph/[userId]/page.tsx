'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Định nghĩa các kiểu dữ liệu cho Knowledge Graph
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

interface ApiResponse {
  userId: string;
  knowledgeGraph: KnowledgeGraphData;
  userDescription: string;
  raw: Record<string, any>;
  source: 'cache' | 'generated';
}

// Bảng màu theo loại node
const NODE_COLORS: Record<string, string> = {
  symptom: '#e11d48', // rose-600
  trait: '#8b5cf6', // violet-500
  need: '#06b6d4', // cyan-500
  goal: '#10b981', // emerald-500
  value: '#f59e0b', // amber-500
  relationship: '#ec4899', // pink-500
  person: '#6366f1', // indigo-500
  emotion: '#ec4899', // pink-500
  mental_state: '#8b5cf6', // violet-500
  identity: '#f59e0b', // amber-500
  personality_trait: '#10b981', // emerald-500
  belief: '#06b6d4', // cyan-500
  habit: '#14b8a6', // teal-500
  coping_mechanism: '#3b82f6', // blue-500
  default: '#94a3b8', // slate-400
};

// Labels cho từng loại node để hiển thị trong legend
const NODE_TYPE_LABELS: Record<string, string> = {
  symptom: 'Triệu chứng',
  trait: 'Đặc điểm',
  need: 'Nhu cầu',
  goal: 'Mục tiêu',
  value: 'Giá trị',
  relationship: 'Mối quan hệ',
  person: 'Người',
  emotion: 'Cảm xúc',
  mental_state: 'Trạng thái tâm lý',
  identity: 'Bản sắc',
  personality_trait: 'Tính cách',
  belief: 'Niềm tin',
  habit: 'Thói quen',
  coping_mechanism: 'Cơ chế đối phó',
  default: 'Khác',
};

export default function KnowledgeGraphPage() {
  const params = useParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId as string;
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const graphRef = useRef<any>(null);
  
  // Hiệu ứng cho animation
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  // Resize handler
  useEffect(() => {
    function handleResize() {
      if (typeof window !== 'undefined') {
        setWidth(window.innerWidth * 0.9);
        setHeight(window.innerHeight * 0.7);
      }
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lấy dữ liệu knowledge graph
  useEffect(() => {
    if (!userId) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/knowledge-graph/${userId}`);
        
        if (!response.ok) {
          if (response.status === 500) {
            throw new Error(`API error: Vui lòng đảm bảo bạn đã cấu hình MISTRAL_API_KEY trong file .env`);
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }
        
        const responseData: ApiResponse = await response.json();
        setData(responseData);
        
        // Chuyển đổi dữ liệu cho thư viện ForceGraph
        const formattedData = {
          nodes: responseData.knowledgeGraph.nodes.map(node => ({
            ...node,
            id: node.id,
            name: node.label,
            val: node.value,
            color: NODE_COLORS[node.type] || NODE_COLORS.default
          })),
          links: responseData.knowledgeGraph.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            name: edge.label,
            value: edge.weight
          }))
        };
        
        setGraphData(formattedData);
      } catch (err: any) {
        console.error('Error fetching knowledge graph:', err);
        setError(err.message || 'Không thể tải knowledge graph');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userId]);

  // Xử lý khi click vào node
  const handleNodeClick = (node: any) => {
    if (graphRef.current) {
      // Zoom vào node đã chọn
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2.5, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tạo knowledge graph của bạn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
        <Card className="w-full max-w-xl bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-destructive">Lỗi</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            
            {error.includes('MISTRAL_API_KEY') && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium mb-2">Hướng dẫn cài đặt Mistral API Key:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Đăng ký tài khoản tại <a href="https://mistral.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mistral.ai</a></li>
                  <li>Tạo API key từ trang dashboard của Mistral</li>
                  <li>Thêm API key vào file <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> trong thư mục gốc dự án:</li>
                  <li>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1">
                      MISTRAL_API_KEY=your_api_key_here
                    </pre>
                  </li>
                  <li>Khởi động lại server bằng cách chạy <code className="bg-gray-100 px-1 py-0.5 rounded">npm run dev</code></li>
                </ol>
              </div>
            )}
            
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !graphData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
        <Card className="w-full max-w-xl bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Không tìm thấy dữ liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Không thể tìm thấy knowledge graph cho người dùng này.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hiển thị knowledge graph và mô tả người dùng
  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* CSS Animations - Gradient Orbs */}
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>
      <div className="gradient-orb orb-4"></div>
      
      {/* CSS Animations - Light Beams */}
      <div className="light-beam beam-1"></div>
      <div className="light-beam beam-2"></div>
      <div className="light-beam beam-3"></div>
      <div className="light-beam beam-4"></div>
      
      {/* CSS Animations - Floating Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`floating-particle particle-${i % 5}`} style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${Math.random() * 10 + 10}s`,
        }}></div>
      ))}
      
      {/* Modernized Header with bicolor MindMate logo */}
      <div className="fixed top-6 left-0 right-0 flex flex-col items-center z-50">
        <div className="text-3xl font-bold mb-2 flex items-center">
          <span className="text-primary">Mind</span>
          <span className="text-emerald-500">Mate</span>
          <span className="ml-1 text-sm bg-emerald-500 text-white px-1 rounded-sm">AI</span>
        </div>
        <div className="text-base text-center text-muted-foreground max-w-md px-4 mb-2 whitespace-nowrap">
          Personalizing your mental wellness journey
        </div>
      </div>
      
      <div className="container mx-auto pt-28 z-10 relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Hoàn tất! Đây là Knowledge Graph cá nhân của bạn</h2>
          <p className="text-muted-foreground mb-1">Dựa trên câu trả lời của bạn, chúng tôi đã tạo biểu đồ tâm lý được cá nhân hóa</p>
          <p className="text-muted-foreground text-sm">Khám phá mối liên hệ giữa các đặc điểm tâm lý, cảm xúc và giá trị của bạn</p>
        </div>
        
        <Tabs defaultValue="graph" className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="graph" className="w-1/2">Knowledge Graph</TabsTrigger>
            <TabsTrigger value="profile" className="w-1/2">Hồ Sơ Tâm Lý</TabsTrigger>
          </TabsList>
          
          <TabsContent value="graph">
            <Card className="bg-white/80 backdrop-blur-md border-white/40 shadow-xl rounded-2xl mb-6">
              <CardHeader>
                <CardTitle>Biểu đồ tâm lý của bạn</CardTitle>
                <CardDescription>
                  <p>Di chuyển chuột để khám phá mối quan hệ giữa các đặc điểm tâm lý</p>
                  <p className="text-xs mt-1"><strong>Mẹo:</strong> Nhấp vào các nút để phóng to chi tiết, kéo để di chuyển biểu đồ</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden" style={{ height: `${height}px` }}>
                  {graphData && (
                    <ForceGraph2D
                      ref={graphRef}
                      graphData={graphData}
                      nodeLabel="description"
                      nodeRelSize={6}
                      nodeVal={node => (node as any).val || 1}
                      nodeColor={node => (node as any).color || '#94a3b8'}
                      linkLabel="name"
                      linkWidth={link => ((link as any).value || 1) / 2}
                      linkDirectionalParticles={link => (link as any).value || 0}
                      linkDirectionalParticleWidth={2}
                      onNodeClick={handleNodeClick}
                      cooldownTicks={100}
                      nodeCanvasObjectMode={() => 'after'}
                      nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.name;
                        const fontSize = 12/globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#000';
                        ctx.fillText(label, node.x, node.y + 10);
                      }}
                      width={width}
                      height={height}
                    />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {Object.entries(NODE_COLORS).map(([type, color]) => 
                    NODE_TYPE_LABELS[type] ? (
                      <div key={type} className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                        <span className="text-xs">{NODE_TYPE_LABELS[type]}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card className="bg-white/80 backdrop-blur-md border-white/40 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle>Hồ Sơ Tâm Lý</CardTitle>
                <CardDescription>
                  <p>Phân tích tổng hợp dựa trên câu trả lời của bạn</p>
                  <p className="text-xs mt-1"><strong>Lưu ý:</strong> Đây là phân tích AI ban đầu, không phải chẩn đoán chuyên môn</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line bg-white/50 backdrop-blur-sm p-6 rounded-xl">
                    {data.userDescription.split('\n').map((paragraph, i) => 
                      paragraph ? <p key={i} className="mb-4">{paragraph}</p> : null
                    )}
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-medium">Thông điệp từ MindMate:</h3>
                      <p className="text-sm mt-2 italic">
                        Hồ sơ này chỉ là điểm khởi đầu trong hành trình khám phá sức khỏe tâm thần của bạn. 
                        Chúng tôi khuyến khích bạn xem đây là công cụ tự khám phá, không phải kết luận.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="default"
            size="lg"
            className="bg-black/85 hover:bg-black text-white shadow-md rounded-xl py-6 px-8 text-lg transition-all"
          >
            Bắt đầu trải nghiệm MindMate
          </Button>
        </div>
        
        {/* Chỉ dẫn */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Biểu đồ tâm lý của bạn đã được lưu và luôn có thể truy cập lại từ trang cá nhân</p>
        </div>
      </div>
      
      {/* Footer với gradient text */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center text-xs z-50">
        <p>Giúp bạn khám phá <span className="bg-gradient-to-r from-primary to-emerald-500 text-transparent bg-clip-text font-medium">hành trình tâm lý cá nhân hóa</span></p>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        /* Base Animation Classes */
        .gradient-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          z-index: 1;
        }
        
        .light-beam {
          position: fixed;
          height: 80px;
          width: 100%;
          opacity: 0.15;
          z-index: 2;
          transform: rotate(-1deg);
        }
        
        .floating-particle {
          position: fixed;
          border-radius: 50%;
          width: 6px;
          height: 6px;
          z-index: 1;
          animation: float 15s ease-in-out infinite;
        }
        
        /* Orb Styles */
        .orb-1 {
          top: 10%;
          left: 10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle at center, rgba(139, 92, 246, 0.3), rgba(76, 29, 149, 0.1));
          animation: pulse 15s ease-in-out infinite alternate;
        }
        
        .orb-2 {
          top: 60%;
          right: 5%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle at center, rgba(250, 204, 21, 0.2), rgba(234, 179, 8, 0.05));
          animation: pulse 12s ease-in-out infinite alternate-reverse;
        }
        
        .orb-3 {
          bottom: 5%;
          left: 20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(236, 72, 153, 0.2), rgba(190, 24, 93, 0.05));
          animation: pulse 18s ease-in-out infinite alternate;
        }
        
        .orb-4 {
          top: 30%;
          right: 30%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.2), rgba(3, 105, 161, 0.05));
          animation: pulse 14s ease-in-out infinite alternate-reverse;
        }
        
        /* Light Beam Styles */
        .beam-1 {
          top: 15%;
          background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.2), transparent);
          animation: beam-move 20s ease-in-out infinite;
        }
        
        .beam-2 {
          top: 35%;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.25), transparent);
          animation: beam-move 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        
        .beam-3 {
          top: 60%;
          background: linear-gradient(90deg, transparent, rgba(217, 70, 239, 0.2), transparent);
          animation: beam-move 18s ease-in-out infinite;
          animation-delay: -10s;
        }
        
        .beam-4 {
          top: 80%;
          background: linear-gradient(90deg, transparent, rgba(76, 29, 149, 0.15), transparent);
          animation: beam-move 22s ease-in-out infinite;
          animation-delay: -15s;
        }
        
        /* Particle Colors */
        .particle-0 {
          background-color: rgba(139, 92, 246, 0.6); /* Violet */
        }
        
        .particle-1 {
          background-color: rgba(236, 72, 153, 0.6); /* Pink */
        }
        
        .particle-2 {
          background-color: rgba(14, 165, 233, 0.6); /* Sky */
        }
        
        .particle-3 {
          background-color: rgba(20, 184, 166, 0.6); /* Teal */
        }
        
        .particle-4 {
          background-color: rgba(217, 70, 239, 0.6); /* Fuchsia */
        }
        
        /* Animations */
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.2;
          }
        }
        
        @keyframes beam-move {
          0% {
            transform: translateY(-50px) rotate(-1deg);
          }
          50% {
            transform: translateY(50px) rotate(0.5deg);
          }
          100% {
            transform: translateY(-50px) rotate(-1deg);
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-10px) translateX(20px);
            opacity: 0.7;
          }
          75% {
            transform: translateY(10px) translateX(-10px);
            opacity: 0.5;
          }
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
} 