import Phaser from 'phaser';
import {
  ART_CELL,
  DAMAGE_OVERLAY_URL,
  pieceArt,
  pieceArtUrl,
  topMountOffset,
} from '../data/pieceArt';
import { PIECES, getPiece } from '../data/pieces';
import { pieceAt } from '../logic/grid';
import { cellAt, cellCenter, cellOrigin, type WorldLayout } from '../logic/gridLayout';
import type { Cell, GridState, NormalPieceId, PieceId, Placement } from '../types';

/** Alles, was die Szene zum Zeichnen braucht. Die Regeln dahinter kommen aus logic/. */
export interface BuildView {
  grid: GridState;
  /** Teil in der Ablage, das aufs Setzen wartet. */
  pendingPiece: PieceId | null;
  /** Zellen, die aufleuchten, weil das wartende Teil dorthin passt. */
  highlightCells: Cell[];
  /** Platz für das wartende Teil an einer Zelle (bevorzugt mit dieser Ankerzelle). */
  resolve: (cell: Cell, preferredAnchor: Cell | null) => Placement | null;
  /** Zellen des zuletzt gesetzten Teils (werden kurz animiert). */
  lastPlacementCells: Cell[] | null;
}

export interface BuildSceneCallbacks {
  onPlace: (anchor: Cell) => void;
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
const TEXTURE_SCALE = 2;
const DAMAGE_KEY = 'damage';
const SLOT_ORDER = { growth: 0, front: 1, top: 2 } as const;

function textureKey(base: NormalPieceId): string {
  return `piece-${base}`;
}

function sameCell(a: Cell | null, b: Cell | null): boolean {
  return a?.col === b?.col && a?.row === b?.row;
}

export class BuildScene extends Phaser.Scene {
  private view: BuildView | null = null;
  private pieces!: Phaser.GameObjects.Container;
  private highlights!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Graphics;
  private trayPiece!: Phaser.GameObjects.Container;
  private traySlot!: Phaser.GameObjects.Graphics;
  private hoverCell: Cell | null = null;
  private hoverAnchor: Cell | null = null;
  private animatedPlacement: string | null = null;
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
    const bases = new Set(PIECES.map((piece) => pieceArt(piece.id).base));
    for (const base of bases) {
      const { width, height } = getPiece(base);
      this.load.svg(textureKey(base), pieceArtUrl(base), {
        width: width * ART_CELL * TEXTURE_SCALE,
        height: height * ART_CELL * TEXTURE_SCALE,
      });
    }
    const size = ART_CELL * TEXTURE_SCALE;
    this.load.svg(DAMAGE_KEY, DAMAGE_OVERLAY_URL, { width: size, height: size });
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
      if (this.trayPiece.input?.dragState !== 2) {
        this.setHover(this.cellUnder(pointer.worldX, pointer.worldY), null);
      }
    });
    this.input.on(Phaser.Input.Events.GAME_OUT, () => {
      this.setHover(null, null);
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

  private resolve(cell: Cell | null, preferredAnchor: Cell | null): Placement | null {
    if (cell === null || this.view?.pendingPiece == null) return null;
    return this.view.resolve(cell, preferredAnchor);
  }

  /**
   * Bilder eines Teils (bei Schaden: eingefärbt plus Overlay je Zelle).
   * Mittelpunkt bei 0/0, cellSize = Kantenlänge einer Zelle.
   */
  private pieceImages(id: PieceId, cellSize: number): Phaser.GameObjects.Image[] {
    const art = pieceArt(id);
    const { width, height } = getPiece(art.base);
    const base = this.add
      .image(0, 0, textureKey(art.base))
      .setDisplaySize(width * cellSize, height * cellSize);
    if (art.tint !== null) base.setTint(art.tint);
    if (!art.damaged) return [base];

    const overlays: Phaser.GameObjects.Image[] = [];
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const x = (dx - (width - 1) / 2) * cellSize;
        const y = ((height - 1) / 2 - dy) * cellSize;
        overlays.push(this.add.image(x, y, DAMAGE_KEY).setDisplaySize(cellSize, cellSize));
      }
    }
    return [base, ...overlays];
  }

  /** Mittelpunkt eines Teils mit dieser Ankerzelle (unten links). */
  private pieceCenter(id: PieceId, anchor: Cell): { x: number; y: number } {
    const { width, height } = getPiece(id);
    const { x, y } = cellCenter(this.layout, anchor);
    const size = this.layout.cellSize;
    return { x: x + ((width - 1) * size) / 2, y: y - ((height - 1) * size) / 2 };
  }

  /** Antippen einer Zelle. Ziehen aus der Ablage beginnt außerhalb des Rasters und zählt nicht. */
  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.view?.pendingPiece == null) return;
    const downCell = this.cellUnder(pointer.downX, pointer.downY);
    const upCell = this.cellUnder(pointer.worldX, pointer.worldY);
    if (downCell === null || upCell === null || !sameCell(downCell, upCell)) return;

    const placement = this.resolve(upCell, null);
    if (placement !== null) {
      this.callbacks.onPlace(placement.anchor);
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
      this.fillTray(true);
    });
    this.trayPiece.on(
      Phaser.Input.Events.GAMEOBJECT_DRAG,
      (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        this.trayPiece.setPosition(dragX, dragY);
        this.setHover(this.cellUnder(pointer.worldX, pointer.worldY), this.dragAnchor());
      },
    );
    this.trayPiece.on(Phaser.Input.Events.GAMEOBJECT_DRAG_END, (pointer: Phaser.Input.Pointer) => {
      const cell = this.cellUnder(pointer.worldX, pointer.worldY);
      const placement = this.resolve(cell, this.dragAnchor());
      this.setHover(null, null);
      if (placement !== null) {
        this.callbacks.onPlace(placement.anchor);
      } else {
        if (cell !== null) this.flashInvalid(cell);
        this.returnTrayPiece();
      }
    });
  }

  /** Beim Ziehen liegt das Teil mittig unter dem Finger: Zelle unter seiner Ecke unten links. */
  private dragAnchor(): Cell | null {
    const id = this.view?.pendingPiece;
    if (id == null) return null;
    const { width, height } = getPiece(id);
    const size = this.layout.cellSize;
    return this.cellUnder(
      this.trayPiece.x - ((width - 1) * size) / 2,
      this.trayPiece.y + ((height - 1) * size) / 2,
    );
  }

  /** Ablage: große Teile verkleinert auf eine Zelle, beim Ziehen in voller Größe. */
  private fillTray(fullSize: boolean): void {
    this.trayPiece.removeAll(true);
    const id = this.view?.pendingPiece;
    if (id == null) return;
    const { width, height } = getPiece(id);
    const size = this.layout.cellSize;
    const cellSize = fullSize ? size : size / Math.max(width, height);
    this.trayPiece.add(this.pieceImages(id, cellSize));
    this.trayPiece.setAlpha(fullSize ? 0.85 : 1);
  }

  private returnTrayPiece(): void {
    this.fillTray(false);
    this.tweens.add({
      targets: this.trayPiece,
      x: this.layout.tray.x,
      y: this.layout.tray.y,
      duration: 200,
      ease: 'Quad.easeOut',
    });
  }

  private setHover(cell: Cell | null, preferredAnchor: Cell | null): void {
    if (sameCell(cell, this.hoverCell) && sameCell(preferredAnchor, this.hoverAnchor)) return;
    this.hoverCell = cell;
    this.hoverAnchor = preferredAnchor;
    this.drawHover();
  }

  private drawHover(): void {
    this.hover.clear();
    const cell = this.hoverCell;
    if (cell === null || this.view?.pendingPiece == null) return;
    const size = this.layout.cellSize;
    const placement = this.resolve(cell, this.hoverAnchor);
    if (placement !== null) {
      this.hover.fillStyle(COLORS.valid, 0.8);
      for (const c of placement.cells) {
        const { x, y } = cellOrigin(this.layout, c);
        this.hover.fillRect(x, y, size, size);
      }
    } else {
      const { x, y } = cellOrigin(this.layout, cell);
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
    this.fillTray(false);
    this.trayPiece.setVisible(waiting);
    this.traySlot.setVisible(waiting);
    if (this.trayPiece.input) this.trayPiece.input.enabled = waiting;
    this.trayPiece.setPosition(this.layout.tray.x, this.layout.tray.y);

    this.animatePlacement(view.lastPlacementCells);
  }

  /** Reihenfolge: Teile, dann Efeu und Front-Deko, zuletzt was oben drauf steckt. */
  private drawPieces(view: BuildView): void {
    this.pieces.removeAll(true);
    const size = this.layout.cellSize;
    const add = (images: Phaser.GameObjects.Image[], x: number, y: number): void => {
      for (const image of images) {
        image.x += x;
        image.y += y;
        this.pieces.add(image);
      }
    };

    for (const placed of view.grid.pieces) {
      const { x, y } = this.pieceCenter(placed.piece, placed);
      add(this.pieceImages(placed.piece, size), x, y);
    }

    const slotOf = (id: PieceId): number => SLOT_ORDER[getPiece(id).slot ?? 'front'];
    const attachments = [...view.grid.attachments].sort((a, b) => slotOf(a.piece) - slotOf(b.piece));
    for (const attachment of attachments) {
      const { x, y } = cellCenter(this.layout, attachment);
      let offsetY = 0;
      if (getPiece(attachment.piece).slot === 'top') {
        // Steckt auf der Spitze des Teils darunter und ragt eine Zelle nach oben.
        const host = pieceAt(view.grid, attachment);
        const mount = host === null ? 0 : topMountOffset(host.piece);
        offsetY = -size + (mount * size) / ART_CELL;
      }
      add(this.pieceImages(attachment.piece, size), x, y + offsetY);
    }
  }

  private drawHighlights(view: BuildView): void {
    this.highlights.clear();
    if (view.pendingPiece === null) return;
    const size = this.layout.cellSize;
    for (const cell of view.highlightCells) {
      const { x, y } = cellOrigin(this.layout, cell);
      this.highlights.fillStyle(COLORS.valid, 0.45);
      this.highlights.fillRoundedRect(x + 6, y + 6, size - 12, size - 12, 12);
      this.highlights.lineStyle(OUTLINE, COLORS.valid, 1);
      this.highlights.strokeRoundedRect(x + 6, y + 6, size - 12, size - 12, 12);
    }
  }

  /** Kleiner „Plopp“ beim Setzen. */
  private animatePlacement(cells: Cell[] | null): void {
    const key = cells?.map((c) => `${String(c.col)}/${String(c.row)}`).join() ?? null;
    if (key === this.animatedPlacement) return;
    this.animatedPlacement = key;
    if (cells === null) return;

    const size = this.layout.cellSize;
    for (const cell of cells) {
      const { x, y } = cellCenter(this.layout, cell);
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
