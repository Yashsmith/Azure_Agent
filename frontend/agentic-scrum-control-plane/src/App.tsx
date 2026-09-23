import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PhaseId, Agent, Skill, TranscriptMessage, PRHourlyData } from './types';
import {
  INITIAL_AGENTS,
  INITIAL_SKILLS,
  INITIAL_TRANSCRIPT,
  PR_HOURLY_HISTORY,
} from './data/mockData';
import { TopBar } from './components/TopBar';
import { Spine } from './components/Spine';
import { KickoffPhase } from './components/phases/KickoffPhase';
import { BrainstormPhase } from './components/phases/BrainstormPhase';
import { PRDPhase } from './components/phases/PRDPhase';
import { BuildPhase } from './components/phases/BuildPhase';
import { ReviewPhase } from './components/phases/ReviewPhase';
import { ShipPhase } from './components/phases/ShipPhase';
import { RevealDrawer } from './components/drawer/RevealDrawer';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastCaption } from './components/common/ToastCaption';
import ControlPlaneApp from '../../the-deck-—-agentic-scrum-control-plane/src/App';
import { MockWorkspaceRepository } from './repositories/MockWorkspaceRepository';
import { WorkspaceProvider } from './state/WorkspaceProvider';
import { useWorkspace } from './state/WorkspaceProvider';
import type { WorkspaceSnapshot } from './domain/types';
import { readConfig } from './app/config';
import { HttpWorkspaceRepository } from './repositories/HttpWorkspaceRepository';
import type { WorkspaceRepository } from './repositories/WorkspaceRepository';

type WorkspaceMode = 'genui' | 'control-plane';
const appConfig = readConfig();

function WorkspaceSwitcher({ mode, onChange }: { mode: WorkspaceMode; onChange: (mode: WorkspaceMode) => void }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-[100] flex h-11 items-center justify-center border-b border-[#E7E6DF] bg-[#FFFFFF]/95 px-4 shadow-[0_1px_8px_rgba(22,22,22,0.06)] backdrop-blur-md">
      <div className="flex items-center gap-1 rounded-lg border border-[#E2E0D9] bg-[#F4F3EE] p-1" role="tablist" aria-label="Workspace view">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'genui'}
          onClick={() => onChange('genui')}
          className={`rounded-md px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
            mode === 'genui' ? 'bg-[#161616] text-white shadow-sm' : 'text-[#5B5B5B] hover:text-[#161616]'
          }`}
        >
          GenUI
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'control-plane'}
          onClick={() => onChange('control-plane')}
          className={`rounded-md px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
            mode === 'control-plane' ? 'bg-[#161616] text-white shadow-sm' : 'text-[#5B5B5B] hover:text-[#161616]'
          }`}
        >
          Control Plane
        </button>
      </div>
    </nav>
  );
}

function GenUIApp() {
  const { publishEvent } = useWorkspace();
  // Phase Progression State
  const [currentActivePhase, setCurrentActivePhase] = useState<PhaseId>('kickoff');
  const [viewingPhase, setViewingPhase] = useState<PhaseId>('kickoff');
  const [completedPhases, setCompletedPhases] = useState<PhaseId[]>([]);

  // Simulation / Autonomous progression
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Entities State
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>(INITIAL_TRANSCRIPT);
  const [prData, setPrData] = useState<PRHourlyData[]>(PR_HOURLY_HISTORY);
  const [totalPRs, setTotalPRs] = useState<number>(38);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Generative UI: Advance Phase Choreography (§10.1)
  const advanceToPhase = useCallback((nextPhase: PhaseId, reasonToast: string) => {
    setCompletedPhases((prev) => (prev.includes(currentActivePhase) ? prev : [...prev, currentActivePhase]));
    setCurrentActivePhase(nextPhase);
    setViewingPhase(nextPhase);
    setToastMessage(reasonToast);
    publishEvent({
      eventId: `phase-${Date.now()}-${nextPhase}`,
      workspaceId: appConfig.workspaceId,
      occurredAt: new Date().toISOString(),
      version: Date.now(),
      type: 'phase.changed',
      payload: { phaseId: nextPhase },
    });
  }, [currentActivePhase, publishEvent]);

  // Handler for Kickoff submission
  const handleKickoffSubmit = (briefTitle: string, briefContent: string) => {
    advanceToPhase('brainstorm', `Meet 01 started — Problem: ${briefTitle.slice(0, 32)}...`);
    // Add brief kickoff message to transcript
    const newMsg: TranscriptMessage = {
      id: `msg-${Date.now()}`,
      speakerId: 'scrum-master',
      speakerName: 'Scrum Master',
      speakerRole: 'Orchestrator Agent',
      avatarColor: '#E60000',
      timestamp: new Date().toTimeString().slice(0, 8),
      content: `SME mission ingested: "${briefContent}". Opening architecture brainstorm for 15m window.`,
    };
    setTranscript((prev) => [newMsg, ...prev]);
  };

  // Handler for Business SME Decision in Brainstorm
  const handleSmeSubmitDecision = (messageId: string, decision: string) => {
    setTranscript((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, smeAnswered: true, smeResponse: decision }
          : msg
      )
    );

    // Follow-up resolution message from Scrum Master
    const resolutionMsg: TranscriptMessage = {
      id: `msg-res-${Date.now()}`,
      speakerId: 'scrum-master',
      speakerName: 'Scrum Master',
      speakerRole: 'Orchestrator Agent',
      avatarColor: '#E60000',
      timestamp: new Date().toTimeString().slice(0, 8),
      content: `Directive logged. Synthesizing into PRD Section 2: "${decision}". Moving to peer review.`,
    };

    setTimeout(() => {
      setTranscript((prev) => [...prev, resolutionMsg]);
      // Advance to PRD
      setTimeout(() => {
        advanceToPhase('prd', 'Meet 01 concluded — Architecture compiled into PRD');
      }, 900);
    }, 450);
  };

  // Handler for PRD acceptance
  const handlePRDAccepted = () => {
    advanceToPhase('build', 'PRD accepted by all 6 agents — Build phase has started');
  };

  // Handler for Build completion
  const handleBuildFinished = () => {
    advanceToPhase('review', 'All PRs passed hermetic tests — Advancing to Review');
  };

  // Handler for SME Approval in Review
  const handleApproveAndShip = () => {
    // Increment PR total on shipping
    setTotalPRs((prev) => prev + 1);
    setPrData((prev) => {
      const copy = [...prev];
      const lastIndex = copy.length - 1;
      if (lastIndex < 0) return copy;
      return copy.map((entry, index) =>
        index === lastIndex ? { ...entry, prs: entry.prs + 1 } : entry,
      );
    });
    advanceToPhase('ship', 'Release v3.0.0 ratified — Sprint 03 shipped to production');
  };

  // Handler to restart sprint
  const handleRestartSprint = () => {
    setCurrentActivePhase('kickoff');
    setViewingPhase('kickoff');
    setCompletedPhases([]);
    setToastMessage('New Sprint initialized — Awaiting mission brief');
  };

  // User manual rewind navigation (§10.2: fast crossfade, desaturation)
  const handleSelectPhase = (phase: PhaseId) => {
    setViewingPhase(phase);
  };

  const handleReturnToLive = () => {
    setViewingPhase(currentActivePhase);
  };

  // Settings Actions (§6)
  const handleAddAgent = () => {
    const nextNum = agents.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const newAgent: Agent = {
      id: `agent-${padded}`,
      name: `Agent-${padded}`,
      role: 'Developer Agent',
      claimedSkill: undefined,
      status: 'idle',
      currentTask: 'Bench standby — awaiting meet entry to claim skill',
      activeBranch: 'main',
      contextUsagePercent: 0,
      avatarColor: '#5B5B5B',
    };
    setAgents((prev) => [...prev, newAgent]);
  };

  const handleRemoveAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const handleAddSkill = (name: string, instructions: string) => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name,
      instructions,
      claimedCount: 0,
      isNew: true,
    };
    setSkills((prev) => [...prev, newSkill]);
  };

  const isHistoricalView = viewingPhase !== currentActivePhase;

  return (
    <div className="min-h-screen bg-[#FCFCFB] text-[#161616] flex flex-col font-sans selection:bg-[#E60000]/15 selection:text-[#161616]">
      {/* 56px Top Bar */}
      <TopBar
        currentPhase={viewingPhase}
        isLive={true}
        autoPlay={autoPlay}
        onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
        playbackSpeed={playbackSpeed}
        onChangePlaybackSpeed={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Cinematic Toast Notification */}
      <ToastCaption
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Main Workspace Frame: Spine + Focus Stage */}
      <div className="flex-1 flex w-full relative">
        {/* 88px Fixed Vertical Spine */}
        <Spine
          currentActivePhase={currentActivePhase}
          viewingPhase={viewingPhase}
          completedPhases={completedPhases}
          onSelectPhase={handleSelectPhase}
          onReturnToLive={handleReturnToLive}
        />

        {/* Focus Stage Container (Breathing Room, §3) */}
        <main
          className={`flex-1 min-h-[calc(100vh-96px)] pb-14 transition-all duration-300 relative ${
            isHistoricalView ? 'opacity-85 filter contrast-95' : 'opacity-100'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* 3.1 KICKOFF PHASE */}
            {viewingPhase === 'kickoff' && (
              <motion.div
                key="kickoff"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="w-full flex justify-center"
              >
                <KickoffPhase
                  agents={agents}
                  onStartMeet={handleKickoffSubmit}
                />
              </motion.div>
            )}

            {/* 3.2 BRAINSTORM PHASE */}
            {viewingPhase === 'brainstorm' && (
              <motion.div
                key="brainstorm"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="w-full flex justify-center"
              >
                <BrainstormPhase
                  transcript={transcript}
                  onSmeSubmitDecision={handleSmeSubmitDecision}
                  onConcludeMeet={() =>
                    advanceToPhase('prd', 'Meet 01 concluded — Architecture compiled into PRD')
                  }
                />
              </motion.div>
            )}

            {/* 3.3 PRD PHASE */}
            {viewingPhase === 'prd' && (
              <motion.div
                key="prd"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="w-full flex justify-center"
              >
                <PRDPhase
                  agents={agents}
                  onAcceptAllAndAdvance={handlePRDAccepted}
                />
              </motion.div>
            )}

            {/* 3.4 BUILD PHASE */}
            {viewingPhase === 'build' && (
              <motion.div
                key="build"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="w-full"
              >
                <BuildPhase
                  agents={agents}
                  onFinishBuild={handleBuildFinished}
                />
              </motion.div>
            )}

            {/* 3.5 REVIEW PHASE */}
            {viewingPhase === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="w-full flex justify-center"
              >
                <ReviewPhase
                  agents={agents}
                  onApproveAndShip={handleApproveAndShip}
                />
              </motion.div>
            )}

            {/* 3.6 SHIP PHASE */}
            {viewingPhase === 'ship' && (
              <motion.div
                key="ship"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="w-full flex justify-center"
              >
                <ShipPhase onRestartSprint={handleRestartSprint} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Reveal Drawer (Permanent 40px handle, overlays from bottom without reflow) */}
      <RevealDrawer
        currentPhase={viewingPhase}
        agents={agents}
        skills={skills}
        transcript={transcript}
        prData={prData}
        totalPRs={totalPRs}
      />

      {/* Settings Modal (Glass Overlay, §6) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        agents={agents}
        skills={skills}
        onAddAgent={handleAddAgent}
        onRemoveAgent={handleRemoveAgent}
        onAddSkill={handleAddSkill}
      />
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<WorkspaceMode>('genui');
  const [repository] = useState<WorkspaceRepository>(() =>
    appConfig.transport === 'http-sse'
      ? new HttpWorkspaceRepository(appConfig.apiBaseUrl)
      : new MockWorkspaceRepository(INITIAL_WORKSPACE),
  );

  return (
    <WorkspaceProvider workspaceId={appConfig.workspaceId} repository={repository}>
      <WorkspaceSwitcher mode={mode} onChange={setMode} />
      {mode === 'genui' ? (
        <div className="pt-11">
          <GenUIApp />
        </div>
      ) : (
        <div className="deck-shell pt-11">
          <ControlPlaneApp />
        </div>
      )}
    </WorkspaceProvider>
  );
}

const INITIAL_WORKSPACE: WorkspaceSnapshot = {
  workspaceId: appConfig.workspaceId,
  version: 1,
  phaseId: 'kickoff',
  agents: [],
  messages: [],
  processedEventIds: [],
};
