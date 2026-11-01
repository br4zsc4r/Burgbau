// Die wenigen Node-Funktionen, die die Skripte in scripts/ nutzen (ohne @types/node).

declare module 'node:fs' {
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
  export function writeFileSync(path: string, data: string): void;
  export function readFileSync(path: string, encoding: 'utf8'): string;
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function dirname(path: string): string;
}

interface ImportMeta {
  /** Ordner der aktuellen Datei (Node ≥ 20.11). */
  readonly dirname: string;
}
