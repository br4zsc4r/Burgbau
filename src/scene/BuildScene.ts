import Phaser from 'phaser';
import { DAMAGE_OVERLAY_URL, pieceArt, pieceArtUrl } from '../data/pieceArt';
import { PIECES } from '../data/pieces';
import { cellAt, cellCenter, cellOrigin, type WorldLayout } from '../logic/gridLayout';
import type { Cell, GridState, NormalPieceId, PieceId } from '../types';

/** Alles, was die Szene zum Zeichnen braucht. Die Regeln dahinter kommen aus logic/. */
export interface BuildView {
  grid: GridState;
  /** Zellen, auf die das wartende Teil darf; leer = gerade wird nichts gesetzt. */
  validCells: Cell[];
  /** Teil in der Ablage, das aufs Setzen wartet. */
  pendingPiece: PieceId | null;
  /** Zuletzt gesetztes Teil (wird kurz animiert). */
  lastPlacement: Cell | null;
}

export interface BuildSceneCallbacks {
  onCellChosen: (cell: Cell) => void;
}

// Platzhalter-Farben bis zu den echten Grafiken.
const COLORS = {
  skyTop: 0x8ec9f2,
  skyBottom: 0xcfe8fb,
  cloud: 0xffffff,
  hill: 0x86c46f,
  ground: 0x6fae55,
  groundEdge: 0x4f8a3c,
  gridLine: 0xffffff,
  outline: 0x4a3f33,
  valid: 0xffe066,
  invalid: 0xd9534f,
  tray: 0xfffdf7,
} as const;

const OUTLINE = 4;
/** SVGs werden doppelt so groß gerastert, damit sie auch vergrößert scharf bleiben. */
const TEXTURE_SIZE = 192;
const DAMAGE_KEY = 'damage';

function textureKey(base: NormalPieceId): string {
  return `piece-${base}`;
}

export class BuildScene extends Phaser.Scene {
  private view: BuildView | null = null;
  private pieces!: Phaser.GameObjects.Container;
  private highlights!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Graphics;
  private trayPiece!: Phaser.GameObjects.Container;
  private traySlot!: Phaser.GameObjects.Graphics;
  private hoverCell: Cell | null = null;
  private animatedPlacement: Cell | null = null;
  private ready = false;

  constructor(
    private readonly layout: WorldLayout,
    private readonly callbacks: BuildSceneCallbacks,
  ) {
    super('build');
  }

  setView(view: BuildView): void {
    this.view = view;
    // Vor create() wird nur gemerkt; create() zeichnet dann.
    if (this.ready) this.redraw();
  }

  preload(): void {
    const size = { width: TEXTURE_SIZE, height: TEXTURE_SIZE };
    const bases = new Set(PIECES.map((piece) => pieceArt(piece.id).base));
    for (const base of bases) this.load.svg(textureKey(base), pieceArtUrl(base), size);
    this.load.svg(DAMAGE_KEY, DAMAGE_OVERLAY_URL, size);
  }

  create(): void {
    this.drawBackground();
    this.pieces = this.add.container();
    this.highlights = this.add.graphics();
    this.hover = this.add.graphics();
    this.createTray();

    this.tweens.add({
      targets: this.highlights,
      alpha: { from: 0.55, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (this.trayPiece.input?.dragState !== 2) this.setHover(this.cellUnder(pointer.worldX, pointer.worldY));
    });
    this.input.on(Phaser.Input.Events.GAME_OUT, () => {
      this.setHover(null);
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      this.handleTap(pointer);
    });

    this.ready = true;
    this.redraw();
  }

  private cellUnder(x: number, y: number): Cell | null {
    if (this.view === null) return null;
    return cellAt(this.layout, this.view.grid, x, y);
  }

  /** Bild eines Teils (bei Schaden: eingefärbt plus Overlay), Mittelpunkt bei 0/0. */
  private pieceImages(id: PieceId): Phaser.GameObjects.Image[] {
    const art = pieceArt(id);
    const size = this.layout.cellSize;
    const base = this.add.image(0, 0, textureKey(art.base)).setDisplaySize(size, size);
    if (art.tint !== null) base.setTint(art.tint);
    if (!art.damaged) return [base];
    return [base, this.add.image(0, 0, DAMAGE_KEY).setDisplaySize(size, size)];
  }

  private isValid(cell: Cell): boolean {
    return this.view?.validCells.some((c) => c.col === cell.col && c.row === cell.row) ?? false;
  }

  /** Antippen einer Zelle. Ziehen aus der Ablage beginnt außerhalb des Rasters und zählt nicht. */
  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.view?.pendingPiece == null) return;
    const downCell = this.cellUnder(pointer.downX, pointer.downY);
    const upCell = this.cellUnder(pointer.worldX, pointer.worldY);
    if (downCell === null || upCell === null) return;
    if (downCell.col !== upCell.col || downCell.row !== upCell.row) return;

    if (this.isValid(upCell)) {
      this.callbacks.onCellChosen(upCell);
    } else {
      this.flashInvalid(upCell);
    }
  }

  private createTray(): void {
    const { tray, cellSize } = this.layout;
    this.traySlot = this.add.graphics();
    this.traySlot.fillStyle(COLORS.tray, 0.6);
    this.traySlot.lineStyle(OUTLINE, COLORS.outline, 0.6);
    const slot = cellSize + 16;
    this.traySlot.fillRoundedRect(tray.x - slot / 2, tray.y - slot / 2, slot, slot, 16);
    this.traySlot.strokeRoundedRect(tray.x - slot / 2, tray.y - slot / 2, slot, slot, 16);

    this.trayPiece = this.add.container(tray.x, tray.y);
    this.trayPiece.setSize(cellSize, cellSize);
    this.trayPiece.setDepth(10);
    this.trayPiece.setInteractive({ draggable: true, useHandCursor: true });

    this.trayPiece.on(Phaser.Input.Events.GAMEOBJECT_DRAG_START, () => {
      this.trayPiece.setScale(1.08);
    });
    this.trayPiece.on(
      Phaser.Input.Events.GAMEOBJECT_DRAG,
      (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        this.trayPiece.setPosition(dragX, dragY);
        this.setHover(this.cellUnder(pointer.worldX, pointer.worldY));
      },
    );
    this.trayPiece.on(Phaser.Input.Events.GAMEOBJECT_DRAG_END, (pointer: Phaser.Input.Pointer) => {
      this.trayPiece.setScale(1);
      const cell = this.cellUnder(pointer.worldX, pointer.worldY);
      this.setHover(null);
      if (cell !== null && this.isValid(cell)) {
        this.callbacks.onCellChosen(cell);
      } else {
        if (cell !== null) this.flashInvalid(cell);
        this.returnTrayPiece();
      }
    });
  }

  private returnTrayPiece(): void {
    this.tweens.add({
      targets: this.trayPiece,
      x: this.layout.tray.x,
      y: this.layout.tray.y,
      duration: 200,
      ease: 'Quad.easeOut',
    });
  }

  private setHover(cell: Cell | null): void {
    const same =
      cell?.col === this.hoverCell?.col && cell?.row === this.hoverCell?.row;
    if (same) return;
    this.hoverCell = cell;
    this.drawHover();
  }

  private drawHover(): void {
    this.hover.clear();
    const cell = this.hoverCell;
    if (cell === null || this.view?.pendingPiece == null) return;
    const { x, y } = cellOrigin(this.layout, cell);
    const size = this.layout.cellSize;
    if (this.isValid(cell)) {
      this.hover.fillStyle(COLORS.valid, 0.8);
      this.hover.fillRect(x, y, size, size);
    } else {
      this.hover.lineStyle(OUTLINE, COLORS.invalid, 1);
      this.hover.strokeRect(x + OUTLINE / 2, y + OUTLINE / 2, size - OUTLINE, size - OUTLINE);
    }
  }

  private flashInvalid(cell: Cell): void {
    const { x, y } = cellOrigin(this.layout, cell);
    const size = this.layout.cellSize;
    const flash = this.add.graphics();
    flash.lineStyle(OUTLINE, COLORS.invalid, 1);
    flash.strokeRect(x + OUTLINE / 2, y + OUTLINE / 2, size - OUTLINE, size - OUTLINE);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  private redraw(): void {
    const view = this.view;
    if (view === null) return;
    this.drawPieces(view);
    this.drawHighlights(view);
    this.drawHover();

    const waiting = view.pendingPiece !== null;
    this.trayPiece.removeAll(true);
    if (view.pendingPiece !== null) this.trayPiece.add(this.pieceImages(view.pendingPiece));
    this.trayPiece.setVisible(waiting);
    this.traySlot.setVisible(waiting);
    if (this.trayPiece.input) this.trayPiece.input.enabled = waiting;
    this.trayPiece.setPosition(this.layout.tray.x, this.layout.tray.y);

    this.animatePlacement(view.lastPlacement);
  }

  private drawPieces(view: BuildView): void {
    this.pieces.removeAll(true);
    for (let row = 0; row < view.grid.rows; row++) {
      for (let col = 0; col < view.grid.cols; col++) {
        const id = view.grid.cells[row * view.grid.cols + col];
        if (id == null) continue;
        const { x, y } = cellCenter(this.layout, { col, row });
        for (const image of this.pieceImages(id)) {
          image.setPosition(x, y);
          this.pieces.add(image);
        }
      }
    }
  }

  private drawHighlights(view: BuildView): void {
    this.highlights.clear();
    if (view.pendingPiece === null) return;
    const size = this.layout.cellSize;
    for (const cell of view.validCells) {
      const { x, y } = cellOrigin(this.layout, cell);
      this.highlights.fillStyle(COLORS.valid, 0.45);
      this.highlights.fillRoundedRect(x + 6, y + 6, size - 12, size - 12, 12);
      this.highlights.lineStyle(OUTLINE, COLORS.valid, 1);
      this.highlights.strokeRoundedRect(x + 6, y + 6, size - 12, size - 12, 12);
    }
  }

  /** Kleiner „Plopp“ beim Setzen. */
  private animatePlacement(cell: Cell | null): void {
    if (cell === null) {
      this.animatedPlacement = null;
      return;
    }
    if (cell.col === this.animatedPlacement?.col && cell.row === this.animatedPlacement.row) return;
    this.animatedPlacement = cell;

    const { x, y } = cellCenter(this.layout, cell);
    const size = this.layout.cellSize;
    const pop = this.add.rectangle(x, y, size, size, COLORS.valid, 0.7);
    this.tweens.add({
      targets: pop,
      scale: 1.3,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => {
        pop.destroy();
      },
    });
  }

  private drawBackground(): void {
    const { width, groundTop, height, gridLeft, gridTop, cellSize } = this.layout;
    const g = this.add.graphics();

    g.fillGradientStyle(COLORS.skyTop, COLORS.skyTop, COLORS.skyBottom, COLORS.skyBottom, 1);
    g.fillRect(0, 0, width, groundTop);

    g.fillStyle(COLORS.cloud, 0.9);
    for (const [cx, cy, s] of [
      [width * 0.45, 70, 1],
      [width * 0.78, 110, 0.8],
      [width * 0.2, 300, 0.7],
    ] as const) {
      g.fillEllipse(cx, cy, 160 * s, 60 * s);
      g.fillEllipse(cx - 50 * s, cy + 10 * s, 110 * s, 50 * s);
      g.fillEllipse(cx + 55 * s, cy + 8 * s, 120 * s, 50 * s);
    }

    // Hügel im Hintergrund – rein dekorativ, die Schwerkraft gilt nur fürs Raster.
    g.fillStyle(COLORS.hill, 1);
    g.fillEllipse(width * 0.3, groundTop + 40, width * 0.9, 420);
    g.fillEllipse(width * 0.85, groundTop + 60, width * 0.6, 300);

    g.fillStyle(COLORS.ground, 1);
    g.fillRect(0, groundTop, width, height - groundTop);
    g.fillStyle(COLORS.groundEdge, 1);
    g.fillRect(0, groundTop, width, 6);

    // Dezente Rasterlinien als Orientierung.
    const grid = this.add.graphics();
    grid.lineStyle(2, COLORS.gridLine, 0.35);
    const cols = Math.round((width - 2 * gridLeft) / cellSize);
    const rows = Math.round((groundTop - gridTop) / cellSize);
    for (let c = 0; c <= cols; c++) {
      grid.lineBetween(gridLeft + c * cellSize, gridTop, gridLeft + c * cellSize, groundTop);
    }
    for (let r = 0; r <= rows; r++) {
      grid.lineBetween(gridLeft, gridTop + r * cellSize, gridLeft + cols * cellSize, gridTop + r * cellSize);
    }
  }
}
