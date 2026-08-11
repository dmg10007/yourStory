export type SimulationHorizon = "1y" | "5y" | "10y" | "50y" | "present";
export type Confidence = "high" | "medium" | "low" | "speculative";
export type EvidenceClassification = "documented-fact" | "direct-inference" | "plausible-projection" | "highly-speculative";
export type EventPackStatus = "in-development" | "planned" | "available";
export interface EventPack { id: string; title: string; era: string; description: string; scope: string; status: EventPackStatus; }
export interface AdvancedIntervention { politics?: number; military?: number; leadership?: number; publicOpinion?: number; technology?: number; economy?: number; diplomacy?: number; }
export interface Intervention { basicChoiceId?: string; advancedValues: AdvancedIntervention; }
export interface SourceRecord { id: string; title: string; author: string; publicationYear?: number; excerpt: string; version: string; }
export interface CausalFactor { id: string; label: string; description: string; confidence: Confidence; evidenceIds: string[]; }
export interface SimulatedEvent { id: string; date: string; title: string; summary: string; classification: EvidenceClassification; evidenceIds: string[]; causalFactorIds: string[]; }
export interface SimulationBranch { id: string; label: string; probabilityBand: { min: number; max: number }; confidence: Confidence; assumptions: string[]; events: SimulatedEvent[]; }
export interface ScenarioRun { id: string; scenarioId: string; engineVersion: string; sourceLibraryVersion: string; randomSeed: string; horizon: SimulationHorizon; pauseAtDecisionForks: boolean; intervention: Intervention; branches: SimulationBranch[]; }
