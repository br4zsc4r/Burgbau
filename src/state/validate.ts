import { PIECES } from '../data/pieces';
import { ANIMALS, SYMBOL_COLORS } from '../data/profileSymbols';
import type {
  AnswerResult,
  Castle,
  Cell,
  GameState,
  GameStep,
  GridState,
  PieceId,
  PlacedPiece,
  Profile,
  QuizState,
  WordBoxes,
  WordPickerState,
} from '../types';

// Prüfungen für Daten aus dem Speicher: Sie können von älteren Versionen stammen oder beschädigt sein.

type Rec = Record<string, unknown>;

export function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isNonEmptyString = (v: unknown): v is string => isString(v) && v.trim() !== '';

const PIECE_IDS = new Set<string>(PIECES.map((p) => p.id));
export const isPieceId = (v: unknown): v is PieceId => isString(v) && PIECE_IDS.has(v);

function isCell(v: unknown): v is Cell {
  return isRecord(v) && isInt(v['col']) && isInt(v['row']);
}

function isPlaced(v: unknown): v is PlacedPiece {
  return isRecord(v) && isCell(v) && isPieceId(v['piece']);
}

/**
 * Rasterdaten retten: unbekannte oder kaputte Einträge fallen weg, der Rest bleibt.
 * So geht eine Burg nie ganz verloren, nur weil ein einzelnes Teil nicht mehr passt.
 */
export function sanitizeGrid(value: unknown): GridState | null {
  if (!isRecord(value) || !isInt(value['cols']) || !isInt(value['rows'])) return null;
  const pieces = Array.isArray(value['pieces']) ? value['pieces'].filter(isPlaced) : [];
  const attachments = Array.isArray(value['attachments']) ? value['attachments'].filter(isPlaced) : [];
  const strip = ({ piece, col, row }: PlacedPiece): PlacedPiece => ({ piece, col, row });
  return {
    cols: value['cols'],
    rows: value['rows'],
    pieces: pieces.map(strip),
    attachments: attachments.map(strip),
  };
}

function isAnswerResult(v: unknown): v is AnswerResult {
  if (!isRecord(v)) return false;
  switch (v['status']) {
    case 'correct':
      return typeof v['capitalizationHint'] === 'boolean';
    case 'almost':
      return v['reason'] === 'typo' || v['reason'] === 'capitalization';
    case 'wrong':
      return isString(v['solution']);
    default:
      return false;
  }
}

function isQuiz(v: unknown): v is QuizState {
  return (
    isRecord(v) &&
    isString(v['wordId']) &&
    (v['attempt'] === 1 || v['attempt'] === 2) &&
    (v['phase'] === 'answering' || v['phase'] === 'feedback') &&
    (v['lastResult'] === null || isAnswerResult(v['lastResult']))
  );
}

function isPicker(v: unknown): v is WordPickerState {
  return (
    isRecord(v) &&
    Array.isArray(v['used']) &&
    v['used'].every(isString) &&
    Array.isArray(v['retries']) &&
    v['retries'].every((r) => isRecord(r) && isString(r['wordId']) && isInt(r['dueTask']))
  );
}

const STEPS: readonly GameStep[] = ['task', 'choosing', 'placing', 'placed', 'editing', 'finished'];

/** Lernfächer: nur ganze Zahlen 0–4 bleiben. */
export function sanitizeBoxes(value: unknown): WordBoxes {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, box]) => isInt(box) && box >= 0 && box <= 4),
  ) as WordBoxes;
}

/** Laufende Partie prüfen; null, wenn sie nicht mehr verwendbar ist. */
export function parseGameState(value: unknown): GameState | null {
  if (!isRecord(value)) return null;
  const grid = sanitizeGrid(value['grid']);
  const lastPlacement = value['lastPlacement'];
  const pending = value['pendingPiece'];
  const valid =
    grid !== null &&
    isInt(value['tasksTotal']) &&
    isInt(value['taskNumber']) &&
    isInt(value['streak']) &&
    isQuiz(value['quiz']) &&
    isPicker(value['picker']) &&
    Array.isArray(value['offers']) &&
    value['offers'].every(isPieceId) &&
    (pending === null || isPieceId(pending)) &&
    STEPS.includes(value['step'] as GameStep) &&
    Array.isArray(value['stash']) &&
    value['stash'].every(isPieceId) &&
    (lastPlacement === null ||
      (isRecord(lastPlacement) &&
        isPieceId(lastPlacement['piece']) &&
        (lastPlacement['anchor'] === null || isCell(lastPlacement['anchor']))));
  if (!valid) return null;
  return { ...(value as unknown as GameState), grid, boxes: sanitizeBoxes(value['boxes']) };
}

export function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value) || !isNonEmptyString(value['id']) || !isNonEmptyString(value['nickname'])) {
    return null;
  }
  const symbol = value['symbol'];
  if (
    !isRecord(symbol) ||
    !ANIMALS.includes(symbol['animal'] as Profile['symbol']['animal']) ||
    !SYMBOL_COLORS.includes(symbol['color'] as Profile['symbol']['color']) ||
    !isString(value['createdAt'])
  ) {
    return null;
  }
  const profile: Profile = {
    id: value['id'],
    nickname: value['nickname'],
    symbol: symbol as unknown as Profile['symbol'],
    createdAt: value['createdAt'],
  };
  const wordListId = value['wordListId'];
  if (isNonEmptyString(wordListId)) profile.wordListId = wordListId;
  const code = value['code'];
  if (Array.isArray(code) && code.length === 2 && code.every(isPieceId)) {
    profile.code = [code[0], code[1]] as Profile['code'] & [PieceId, PieceId];
  }
  return profile;
}

export function parseCastle(value: unknown): Castle | null {
  if (!isRecord(value) || !isNonEmptyString(value['id']) || !isString(value['profileId'])) return null;
  const grid = sanitizeGrid(value['grid']);
  if (grid === null) return null;
  return {
    id: value['id'],
    profileId: value['profileId'],
    name: isString(value['name']) ? value['name'] : '',
    createdAt: isString(value['createdAt']) ? value['createdAt'] : new Date(0).toISOString(),
    grid,
  };
}
