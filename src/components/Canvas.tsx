import { useCallback, useRef } from 'react';
import { EDGE_TYPES, NODE_TYPES } from '../types'
import * as Toolbar from '@radix-ui/react-toolbar';
import ReactFlow, {
  Node,
  MiniMap,
  addEdge,
  Controls,
  Connection,
  MarkerType,
  useEdgesState,
  useNodesState,
  ConnectionMode,
} from 'reactflow';

import 'reactflow/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';

interface InitialNode extends Node {
  type: keyof typeof NODE_TYPES
}

const initialNodes: InitialNode[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'init_conversation' },
    position: { x: 0, y: 0 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'end_conversation' },
    position: { x: 0, y: 250 },
  },
];


export function Canvas() {
  const connectingNodeId = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, type: 'buttonedge', markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );


  const onConnectStart = useCallback((_: any, { nodeId }: any) => {
    connectingNodeId.current = nodeId;
  }, []);


  const getClosestEdge = useCallback((node: { id: any; positionAbsolute: { x: number; y: number; }; }) => {
    const storeNodes = Array.from(nodes.values());

    const closestNode = storeNodes.reduce(
      (res, n) => {
        if (n.id !== node.id) {
          const dx = n.position.x - node.positionAbsolute.x;
          const dy = n.position.y - node.positionAbsolute.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < res.distance && d < 150) {
            res.distance = d;
            res.node = n;
          }
        }
        return res;
      },
      {
        distance: Number.MAX_VALUE,
        node: null,
      }
    );

    if (!closestNode.node) {
      return null;
    }

    const closeNodeIsSource = closestNode.node.position.x < node.positionAbsolute.x;

    return {
      id: `${node.id}-${closestNode.node.id}`,
      source: closeNodeIsSource ? closestNode.node.id : node.id,
      target: closeNodeIsSource ? node.id : closestNode.node.id,
      type: 'buttonedge'
    };
  }, []);

  const onNodeDrag = useCallback(
    (_: any, node: any) => {
      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');

        if (
          closeEdge &&
          !nextEdges.find((ne) => ne.source === closeEdge.source && ne.target === closeEdge.target)
        ) {
          closeEdge.className = 'temp';
          nextEdges.push(closeEdge);
        }

        return nextEdges;
      });
    },
    [getClosestEdge, setEdges]
  );

  function handleAddSquareNode() {
    setNodes((nodes) => {
      return [...nodes, {
        id: crypto.randomUUID(),
        position: {
          x: 0,
          y: 350,
        },
        data: { label: 'new_intent' },
        type: 'default',
      }]
    })
  }

  return (
    <>
      <ReactFlow
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        nodes={nodes}
        fitView
        snapToGrid
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
      >
        <Controls />
        <MiniMap nodeStrokeWidth={2} zoomable pannable />
      </ReactFlow>

      <Toolbar.Root className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg border border-zinc-300 px-8 h-20 w-96 overflow-hidden">
        <Toolbar.Button onClick={handleAddSquareNode} className="text-zinc-400">
          <div className="w-32 h-32 bg-violet-500 mt-6 rounded hover:-translate-y-2 transition-transform"></div>
        </Toolbar.Button>
      </Toolbar.Root>
    </>
  );
}