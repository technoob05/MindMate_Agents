'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamically import ForceGraph2D with SSR disabled
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

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
  symptom: 'Symptom',
  trait: 'Trait',
  need: 'Need',
  goal: 'Goal',
  value: 'Value',
  relationship: 'Relationship',
  person: 'Person',
  emotion: 'Emotion',
  mental_state: 'Mental State',
  identity: 'Identity',
  personality_trait: 'Personality',
  belief: 'Belief',
  habit: 'Habit',
  coping_mechanism: 'Coping Mechanism',
  default: 'Other',
};

interface KnowledgeGraphViewProps {
  userId: string;
  onComplete: () => void;
  hideHeader?: boolean;
}

export default function KnowledgeGraphView({ userId, onComplete, hideHeader = false }: KnowledgeGraphViewProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const graphRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState("graph");
  
  // Client-side only code
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Animation effects
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  // Set isBrowser to true when component mounts (client-side only)
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Resize handler - only run on client
  useEffect(() => {
    if (!isBrowser) return;
    
    function handleResize() {
      setWidth(window.innerWidth * 0.9);
      setHeight(window.innerHeight * 0.6);
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isBrowser]);

  // Fetch knowledge graph data
  useEffect(() => {
    if (!userId || !isBrowser) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/knowledge-graph/${userId}`);
        
        if (!response.ok) {
          if (response.status === 500) {
            throw new Error(`API error: Please ensure you've configured MISTRAL_API_KEY in your .env file`);
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }
        
        const responseData: ApiResponse = await response.json();
        setData(responseData);
        
        // Format data for ForceGraph library
        const formattedData = {
          nodes: responseData.knowledgeGraph.nodes.map(node => ({
            ...node,
            id: node.id,
            name: node.label,
            val: node.value * 1.5, // Increase node size
            color: NODE_COLORS[node.type] || NODE_COLORS.default
          })),
          links: responseData.knowledgeGraph.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            name: edge.label,
            value: edge.weight,
            color: '#6366f1' // Consistent color for all edges
          }))
        };
        
        setGraphData(formattedData);
      } catch (err: any) {
        console.error('Error fetching knowledge graph:', err);
        setError(err.message || 'Unable to load knowledge graph');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userId, isBrowser]);

  // Handle node click
  const handleNodeClick = (node: any) => {
    if (!isBrowser || !graphRef.current) return;
    
    // Zoom to selected node
    graphRef.current.centerAt(node.x, node.y, 1000);
    graphRef.current.zoom(2.5, 1000);

    // Highlight node
    const updatedGraphData = {...graphData};
    updatedGraphData.nodes = graphData.nodes.map((n: any) => {
      return {
        ...n,
        highlighted: n.id === node.id
      };
    });
    setGraphData(updatedGraphData);
  };

  // Handle server-side rendering
  if (!isBrowser) {
    return (
      <div className="w-full z-10 relative mt-8">
        {!hideHeader && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-3">Complete! Here's your Personal Knowledge Graph</h2>
            <p className="text-muted-foreground mb-2">Based on your answers, we've created a personalized psychological map</p>
            <p className="text-muted-foreground text-sm mb-3">Loading your psychological insights...</p>
          </div>
        )}
        
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading knowledge graph...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Creating your knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-xl bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            
            {error.includes('MISTRAL_API_KEY') && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium mb-2">Mistral API Key Setup Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Register for an account at <a href="https://mistral.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mistral.ai</a></li>
                  <li>Create an API key from the Mistral dashboard</li>
                  <li>Add the API key to the <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> file in the project root:</li>
                  <li>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1">
                      MISTRAL_API_KEY=your_api_key_here
                    </pre>
                  </li>
                  <li>Restart the server by running <code className="bg-gray-100 px-1 py-0.5 rounded">npm run dev</code></li>
                </ol>
              </div>
            )}
            
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !graphData) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-xl bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>No Data Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not find knowledge graph for this user.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display knowledge graph and user description
  return (
    <div className="w-full z-10 relative mt-8">
      {!hideHeader && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-3">Complete! Here's your Personal Knowledge Graph</h2>
          <p className="text-muted-foreground mb-2">Based on your answers, we've created a personalized psychological map</p>
          <p className="text-muted-foreground text-sm mb-3">Explore the connections between your psychological traits, emotions, and values</p>
        </div>
      )}
      
      {/* Custom tab implementation */}
      <div className="w-full">
        {/* Tab buttons */}
        <div className="w-full max-w-md mx-auto mb-6 inline-flex h-9 items-center justify-center rounded-lg glass-morphism p-1 text-muted-foreground">
          <button
            onClick={() => setActiveTab("graph")}
            className={`w-1/2 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all ${
              activeTab === "graph" 
                ? "bg-background/80 backdrop-blur-sm text-foreground shadow-sm scale-105 border border-border/50" 
                : "hover:bg-background/50 hover:text-foreground"
            }`}
          >
            Knowledge Graph
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-1/2 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all ${
              activeTab === "profile" 
                ? "bg-background/80 backdrop-blur-sm text-foreground shadow-sm scale-105 border border-border/50" 
                : "hover:bg-background/50 hover:text-foreground"
            }`}
          >
            Psychological Profile
          </button>
        </div>
        
        {/* Tab content */}
        {activeTab === "graph" && (
          <Card className="bg-white/80 backdrop-blur-md border-white/40 shadow-xl rounded-2xl mb-6">
            <CardHeader>
              <CardTitle>Your Psychological Map</CardTitle>
              <CardDescription>
                <span className="block mb-1">Move your mouse to explore relationships between psychological traits</span>
                <span className="block text-xs"><strong>Tip:</strong> Click on nodes to zoom in and see details, drag to move the graph</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden border border-indigo-100/50 shadow-inner" style={{ height: `${height}px` }}>
                {isBrowser && graphData && (
                  <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel="description"
                    nodeRelSize={8}
                    nodeVal={node => (node as any).val || 1}
                    nodeColor={node => {
                      const n = node as any;
                      return n.highlighted ? '#ff9500' : n.color || '#94a3b8';
                    }}
                    linkLabel="name"
                    linkWidth={link => ((link as any).value || 1) * 0.8}
                    linkColor={link => {
                      const l = link as any;
                      const sourceNode = graphData.nodes.find((n: any) => n.id === l.source.id || n.id === l.source);
                      const targetNode = graphData.nodes.find((n: any) => n.id === l.target.id || n.id === l.target);
                      if (sourceNode?.highlighted || targetNode?.highlighted) {
                        return '#ff9500'; // Highlight connection when node is selected
                      }
                      return '#6366f1'; // Default color
                    }}
                    linkDirectionalParticles={link => {
                      const l = link as any;
                      const sourceNode = graphData.nodes.find((n: any) => n.id === l.source.id || n.id === l.source);
                      const targetNode = graphData.nodes.find((n: any) => n.id === l.target.id || n.id === l.target);
                      return (sourceNode?.highlighted || targetNode?.highlighted) ? 5 : 2;
                    }}
                    linkDirectionalParticleWidth={2.5}
                    linkDirectionalParticleSpeed={0.01}
                    onNodeClick={handleNodeClick}
                    cooldownTicks={100}
                    d3AlphaDecay={0.02} // Slower layout settling
                    d3VelocityDecay={0.3} // Less friction 
                    d3AlphaMin={0.05} // Keep simulation active longer
                    d3Force={(d3, nodes) => {
                      // Add stronger repulsive forces to avoid node overlap
                      d3.forceCollide()
                        .radius((node: any) => (node.val || 8) * 1.5)
                        .strength(0.8)
                        .iterations(5)(nodes);
                      
                      // Add stronger charge force
                      d3.forceManyBody()
                        .strength(-200)
                        .distanceMax(250)(nodes);
                    }}
                    nodeCanvasObjectMode={() => 'after'}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                      const label = node.name;
                      const fontSize = node.highlighted ? 14/globalScale : 12/globalScale;
                      ctx.font = `${node.highlighted ? 'bold ' : ''}${fontSize}px Sans-Serif`;
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      
                      // Add a background for text to prevent overlapping
                      const textWidth = ctx.measureText(label).width;
                      const bgPadding = 4;
                      const textHeight = fontSize;
                      
                      // Position text further below the node (increased y offset from +12 to +16)
                      const textY = node.y + 16;
                      
                      // Draw a semi-transparent white background for the text
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                      ctx.fillRect(
                        node.x - textWidth/2 - bgPadding,
                        textY - textHeight/2 - bgPadding/2,
                        textWidth + bgPadding*2,
                        textHeight + bgPadding
                      );
                      
                      // Now draw the text
                      ctx.fillStyle = node.highlighted ? '#000' : '#333';
                      
                      // Shadow for text
                      if (node.highlighted) {
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                        ctx.shadowBlur = 5;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                      }
                      
                      ctx.fillText(label, node.x, textY);
                      
                      // Reset shadow
                      ctx.shadowColor = 'transparent';
                      ctx.shadowBlur = 0;
                      ctx.shadowOffsetX = 0;
                      ctx.shadowOffsetY = 0;
                      
                      // Draw glow effect for highlighted nodes
                      if (node.highlighted) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.val * 1.5, 0, 2 * Math.PI);
                        ctx.fillStyle = 'rgba(255, 149, 0, 0.15)';
                        ctx.fill();
                      }
                    }}
                    width={width}
                    height={height}
                  />
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 p-2 bg-white/30 rounded-xl border border-indigo-50/50">
                {Object.entries(NODE_COLORS).map(([type, color]) => 
                  NODE_TYPE_LABELS[type] ? (
                    <div key={type} className="flex items-center bg-white/60 p-1.5 px-2 rounded-md shadow-sm">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                      <span className="text-xs font-medium">{NODE_TYPE_LABELS[type]}</span>
                    </div>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {activeTab === "profile" && (
          <Card className="bg-white/80 backdrop-blur-md border-white/40 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>Psychological Profile</CardTitle>
              <CardDescription>
                <span className="block mb-1">Comprehensive analysis based on your answers</span>
                <span className="block text-xs"><strong>Note:</strong> This is an initial AI analysis, not a professional diagnosis</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-line bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-indigo-100/50 shadow-inner">
                  {data.userDescription.split('\n').map((paragraph, i) => 
                    paragraph ? <p key={i} className="mb-4">{paragraph}</p> : null
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium">Message from MindMate:</h3>
                    <p className="text-sm mt-2 italic">
                      This profile is just a starting point in your mental health exploration journey.
                      We encourage you to view it as a self-discovery tool, not a conclusion.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <Button 
          onClick={onComplete}
          variant="default"
          size="lg"
          className="bg-black/85 hover:bg-black text-white shadow-md rounded-xl py-6 px-8 text-lg transition-all hover:scale-105"
        >
          Start the MindMate Experience
        </Button>
      </div>
      
      {/* Guide */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Your psychological map has been saved and can always be accessed from your profile page</p>
      </div>
    </div>
  );
} 