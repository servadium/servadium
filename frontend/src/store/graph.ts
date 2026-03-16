/**
 * Graph Store — Zustand state for the 3D knowledge graph visualization.
 */

import { create } from "zustand";

import type {
  GraphData,
  GraphEdgeData,
  GraphNodeData,
  KnowledgeEntry,
  KnowledgeNode,
} from "@/lib/types";

interface GraphState {
  // All knowledge entries for the dashboard
  entries: KnowledgeEntry[];
  selectedEntry: KnowledgeEntry | null;

  // Graph data for the selected entry
  graphData: GraphData;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;

  // UI state
  sidePanelOpen: boolean;
  newEntryModalOpen: boolean;
  isLoading: boolean;

  // Actions
  setEntries: (entries: KnowledgeEntry[]) => void;
  addEntry: (entry: KnowledgeEntry) => void;
  setSelectedEntry: (entry: KnowledgeEntry | null) => void;
  setGraphData: (data: GraphData) => void;
  addNode: (node: GraphNodeData) => void;
  addEdge: (edge: GraphEdgeData) => void;
  addNodeFromKnowledge: (node: KnowledgeNode) => void;
  setSelectedNodeId: (id: string | null) => void;
  setHoveredNodeId: (id: string | null) => void;
  setSidePanelOpen: (open: boolean) => void;
  setNewEntryModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  resetGraph: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  entries: [],
  selectedEntry: null,
  graphData: { nodes: [], edges: [] },
  selectedNodeId: null,
  hoveredNodeId: null,
  sidePanelOpen: false,
  newEntryModalOpen: false,
  isLoading: false,

  setEntries: (entries) => set({ entries }),
  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),
  setSelectedEntry: (entry) => set({ selectedEntry: entry }),
  setGraphData: (data) => set({ graphData: data }),
  addNode: (node) =>
    set((state) => ({
      graphData: {
        ...state.graphData,
        nodes: [...state.graphData.nodes, node],
      },
    })),
  addEdge: (edge) =>
    set((state) => ({
      graphData: {
        ...state.graphData,
        edges: [...state.graphData.edges, edge],
      },
    })),
  addNodeFromKnowledge: (node) =>
    set((state) => {
      const graphNode: GraphNodeData = {
        id: node.id,
        type: node.type,
        title: node.title,
        content: node.content,
        confidence: node.confidence,
        position: [
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
        ],
        velocity: [0, 0, 0],
      };
      return {
        graphData: {
          ...state.graphData,
          nodes: [...state.graphData.nodes, graphNode],
        },
      };
    }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, sidePanelOpen: !!id }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setSidePanelOpen: (open) =>
    set({ sidePanelOpen: open, selectedNodeId: open ? undefined : null }),
  setNewEntryModalOpen: (open) => set({ newEntryModalOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
  resetGraph: () =>
    set({
      graphData: { nodes: [], edges: [] },
      selectedNodeId: null,
      hoveredNodeId: null,
      sidePanelOpen: false,
    }),
}));
