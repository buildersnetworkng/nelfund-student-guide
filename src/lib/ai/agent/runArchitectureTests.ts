/**
 * Offline architecture tests, no live model required.
 */

import { ARCH_DATASET } from '../eval/dataset'
import { createContext, runMockAgentTurn } from './orchestrator'
import type { AgentState } from './contracts'
