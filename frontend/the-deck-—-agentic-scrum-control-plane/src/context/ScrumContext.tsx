import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent, Artifact, Meet, Message, Sprint, TabType, DelegationEdge } from '../types';
import { 
  INITIAL_AGENTS, 
  INITIAL_MEETS, 
  INITIAL_MESSAGES, 
  INITIAL_ARTIFACTS, 
  INITIAL_SPRINTS, 
  INITIAL_EDGES 
} from '../data/mockData';

interface ScrumContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  autopilot: boolean;
  setAutopilot: (val: boolean) => void;
  agents: Agent[];
  activeAgent: Agent;
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;
  meets: Meet[];
  selectedMeet: Meet;
  setSelectedMeetId: (id: string) => void;
  messages: Message[];
  artifacts: Artifact[];
  selectedArtifact: Artifact;
  setSelectedArtifactId: (id: string) => void;
  sprints: Sprint[];
  selectedSprint: Sprint;
  setSelectedSprintId: (id: string) => void;
  edges: DelegationEdge[];
  isSimulating: boolean;
  toggleSimulation: () => void;
  stepSimulation: () => void;
  triggerDebate: () => void;
  triggerSmeIntervention: (directive: string) => void;
  isSmeModalOpen: boolean;
  setIsSmeModalOpen: (open: boolean) => void;
  elapsedSeconds: number;
  remainingSeconds: number;
  formatTime: (sec: number) => string;
  totalMessagesToday: number;
  activeAgentsCount: number;
  prdAcceptanceRatio: string;
  forceConsensus: () => void;
  reassignTask: (agentId: string, task: string) => void;
}

const ScrumContext = createContext<ScrumContextType | undefined>(undefined);

const SIMULATION_SCRIPTS = [
  {
    agentId: 'agent-04',
    name: 'Agent-04',
    role: 'Stream Infra',
    type: 'speech' as const,
    text: 'Benchmarking Kafka partition rebalance under simulated link-loss between Zurich and Geneva. Latency impact is bounded to 3.4ms with local RocksDB fallback.',
    codeSnippet: 'val rocksConfig = new Options().setCreateIfMissing(true).setCompressionType(CompressionType.LZ4_COMPRESSION);'
  },
  {
    agentId: 'agent-06',
    name: 'Agent-06',
    role: 'QA & Chaos',
    type: 'debate_challenge' as const,
    text: 'Caution: Jepsen test suite injected 30% packet loss during Raft leader re-election. Consensus held, but commit round-trip spiked to 19.8ms — dangerously close to our 20ms ceiling.',
    isContradiction: true
  },
  {
    agentId: 'agent-03',
    name: 'Agent-03',
    role: 'Backend Lead',
    type: 'speech' as const,
    text: 'We can mitigate the 19.8ms jitter by enabling TCP nodelay on gRPC multiplex channels and pinning the Raft heartbeat to 15ms. Let me deploy the test flag.'
  },
  {
    agentId: 'agent-05',
    name: 'Agent-05',
    role: 'Database',
    type: 'speech' as const,
    text: 'PostgreSQL partition pruning confirms zero scanned blocks on yesterday\'s partitions during current day order queries. Execution plan cost dropped 84%.'
  },
  {
    agentId: 'agent-sm',
    name: 'ScrumMaster',
    role: 'Scrum Master',
    type: 'consensus' as const,
    text: 'Heartbeat configuration verified by Agent-06. All 6 agents are in consensus. Moving PRD and Architecture status to Phase Complete.'
  },
  {
    agentId: 'agent-01',
    name: 'Agent-01',
    role: 'Frontend Principal',
    type: 'speech' as const,
    text: 'Terminal UI is rendering 120,000 order ticks/sec smoothly at 60 FPS using OffscreenCanvas and WebWorker shared array buffers.'
  }
];

export const ScrumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [autopilot, setAutopilot] = useState<boolean>(true);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(INITIAL_AGENTS[1]); // Agent-03 default
  const [meets, setMeets] = useState<Meet[]>(INITIAL_MEETS);
  const [selectedMeetId, setSelectedMeetId] = useState<string>('meet-04');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('art-01');
  const [sprints, setSprints] = useState<Sprint[]>(INITIAL_SPRINTS);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('sprint-03');
  const [edges, setEdges] = useState<DelegationEdge[]>(INITIAL_EDGES);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isSmeModalOpen, setIsSmeModalOpen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(872);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(252);
  const [scriptIndex, setScriptIndex] = useState<number>(0);

  const selectedMeet = meets.find(m => m.id === selectedMeetId) || meets[0];
  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId) || artifacts[0];
  const selectedSprint = sprints.find(s => s.id === selectedSprintId) || sprints[0];
  const activeAgent = agents.find(a => a.isLive) || agents[1];

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(Math.abs(totalSec) / 60);
    const secs = Math.abs(totalSec) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clock tick
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Step simulation function
  const stepSimulation = useCallback(() => {
    const item = SIMULATION_SCRIPTS[scriptIndex % SIMULATION_SCRIPTS.length];
    setScriptIndex(prev => prev + 1);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      meetId: 'meet-04',
      senderId: item.agentId,
      senderName: item.name,
      senderRole: item.role,
      timestamp: timeStr,
      timeOffsetSec: elapsedSeconds,
      text: item.text,
      type: item.type,
      codeSnippet: item.codeSnippet,
      isContradiction: item.isContradiction
    };

    setMessages(prev => [...prev, newMsg]);

    // Promote new agent as speaking/active
    setAgents(prev =>
      prev.map(a => {
        const isNowLive = a.id === item.agentId;
        const newSpark = [...a.sparkline.slice(1), Math.floor(Math.random() * 50) + 50];
        return {
          ...a,
          isLive: isNowLive,
          status: isNowLive ? 'speaking' : a.status === 'orchestrating' ? 'orchestrating' : 'idle',
          sparkline: isNowLive ? newSpark : a.sparkline,
          tokensVelocity: isNowLive ? Math.floor(Math.random() * 1200) + 1800 : a.tokensVelocity
        };
      })
    );

    // Pulse delegation edges
    setEdges(prev =>
      prev.map(e => {
        const touches = e.source === item.agentId || e.target === item.agentId;
        return {
          ...e,
          isActive: touches,
          latencyMs: touches ? Math.floor(Math.random() * 10) + 4 : e.latencyMs
        };
      })
    );

    // Update meet heat segment
    setMeets(prev =>
      prev.map(m => {
        if (m.id === 'meet-04') {
          return {
            ...m,
            debateIntensity: Math.min(100, m.debateIntensity + (item.isContradiction ? 8 : -3)),
            consensusRate: item.type === 'consensus' ? 100 : m.consensusRate
          };
        }
        return m;
      })
    );
  }, [scriptIndex, elapsedSeconds]);

  // Automated agent conversation loop when autopilot is on and simulating
  useEffect(() => {
    if (!isSimulating || !autopilot) return;
    const timeout = setTimeout(() => {
      stepSimulation();
    }, 7000);
    return () => clearTimeout(timeout);
  }, [isSimulating, autopilot, stepSimulation, scriptIndex]);

  // Trigger debate manually
  const triggerDebate = () => {
    const debateMsg: Message = {
      id: `msg-${Date.now()}`,
      meetId: 'meet-04',
      senderId: 'agent-06',
      senderName: 'Agent-06',
      senderRole: 'QA & Chaos',
      timestamp: '14:36:12',
      timeOffsetSec: elapsedSeconds,
      text: 'CHALLENGE: Under asymmetric network partition, Raft node Geneva cannot distinguish between crash stop and link cut. How do we prevent stale reads without a synchronous heartbeat round-trip that violates the 20ms SLA?',
      type: 'debate_challenge',
      isContradiction: true
    };
    setMessages(prev => [...prev, debateMsg]);
    setAgents(prev =>
      prev.map(a => ({
        ...a,
        isLive: a.id === 'agent-06',
        status: a.id === 'agent-06' ? 'debating' : a.status
      }))
    );
    setMeets(prev =>
      prev.map(m =>
        m.id === 'meet-04'
          ? {
              ...m,
              debateIntensity: 95,
              heatSegments: [...m.heatSegments, { minute: 15, intensity: 95, isDebate: true }]
            }
          : m
      )
    );
  };

  // SME Intervention
  const triggerSmeIntervention = (directive: string) => {
    const smeMsg: Message = {
      id: `msg-${Date.now()}`,
      meetId: 'meet-04',
      senderId: 'sme-01',
      senderName: 'SME-01',
      senderRole: 'Business SME',
      timestamp: '14:36:45',
      timeOffsetSec: elapsedSeconds,
      text: `SME DIRECTIVE: "${directive}". The architecture must enforce this constraint before passing the sprint gate.`,
      type: 'sme_input'
    };
    setMessages(prev => [...prev, smeMsg]);

    // Scrum master acknowledges and delegates
    setTimeout(() => {
      const ackMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        meetId: 'meet-04',
        senderId: 'agent-sm',
        senderName: 'ScrumMaster',
        senderRole: 'Scrum Master',
        timestamp: '14:36:58',
        timeOffsetSec: elapsedSeconds + 12,
        text: `Directive received from Business SME. Updating Sprint 03 Gate Criteria: "${directive}". Agent-03 and Agent-05, update the architecture specification accordingly.`,
        type: 'consensus'
      };
      setMessages(prev => [...prev, ackMsg]);
      setAgents(prev =>
        prev.map(a => ({
          ...a,
          isLive: a.id === 'agent-sm',
          status: a.id === 'agent-sm' ? 'speaking' : a.status
        }))
      );
    }, 1800);
  };

  const forceConsensus = () => {
    const consensusMsg: Message = {
      id: `msg-${Date.now()}`,
      meetId: 'meet-04',
      senderId: 'agent-sm',
      senderName: 'ScrumMaster',
      senderRole: 'Scrum Master',
      timestamp: '14:37:30',
      timeOffsetSec: elapsedSeconds,
      text: 'EXECUTIVE OVERRIDE: Quorum reached. All 6 developer agents have signed off on PRD v2.3 and Architecture v1.4. Gate 03 is unlocked.',
      type: 'consensus'
    };
    setMessages(prev => [...prev, consensusMsg]);
    setArtifacts(prev =>
      prev.map(art => ({
        ...art,
        status: 'approved',
        acceptedCount: 6,
        acceptedBy: ['Agent-01', 'Agent-02', 'Agent-03', 'Agent-04', 'Agent-05', 'Agent-06']
      }))
    );
    setMeets(prev =>
      prev.map(m => (m.id === 'meet-04' ? { ...m, consensusRate: 100, debateIntensity: 20 } : m))
    );
  };

  const reassignTask = (agentId: string, task: string) => {
    setAgents(prev =>
      prev.map(a => (a.id === agentId ? { ...a, activeTask: task } : a))
    );
  };

  const totalMessagesToday = 142 + messages.length - INITIAL_MESSAGES.length;
  const activeAgentsCount = agents.filter(a => a.status !== 'idle').length;
  const prdAcceptanceRatio = `${artifacts[0].acceptedCount}/${artifacts[0].totalRequired}`;

  return (
    <ScrumContext.Provider
      value={{
        activeTab,
        setActiveTab,
        autopilot,
        setAutopilot,
        agents,
        activeAgent,
        selectedAgent,
        setSelectedAgent,
        meets,
        selectedMeet,
        setSelectedMeetId,
        messages,
        artifacts,
        selectedArtifact,
        setSelectedArtifactId,
        sprints,
        selectedSprint,
        setSelectedSprintId,
        edges,
        isSimulating,
        toggleSimulation: () => setIsSimulating(!isSimulating),
        stepSimulation,
        triggerDebate,
        triggerSmeIntervention,
        isSmeModalOpen,
        setIsSmeModalOpen,
        elapsedSeconds,
        remainingSeconds,
        formatTime,
        totalMessagesToday,
        activeAgentsCount,
        prdAcceptanceRatio,
        forceConsensus,
        reassignTask
      }}
    >
      {children}
    </ScrumContext.Provider>
  );
};

export const useScrum = () => {
  const context = useContext(ScrumContext);
  if (!context) {
    throw new Error('useScrum must be used within a ScrumProvider');
  }
  return context;
};
