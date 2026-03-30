import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import CandyTile, {
  type CandyTileData,
  type CandyType,
} from "../../candy/CandyTile";
import ParticleBurst from "../../../systems/ParticleBurst";
import { useSound } from "../../../systems/useSound";

const GRID_SIZE = 6;
const TILE_GAP = 1.08;
const SWAP_DRAG_THRESHOLD = 28;
const CASCADE_DELAY_MS = 220;
const REFILL_DELAY_MS = 240;

const CANDY_TYPES: CandyType[] = [
  "berry",
  "mint",
  "lemon",
  "grape",
  "soda",
  "peach",
];

type BoardCell = CandyTileData | null;

type Board = BoardCell[][];

interface GridPosition {
  row: number;
  col: number;
}

interface BurstEvent {
  id: number;
  position: [number, number, number];
  color: string;
}

interface DragState {
  row: number;
  col: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

let tileSequence = 0;
let burstSequence = 0;

const MATCH_COLORS: Record<CandyType, string> = {
  berry: "#ff8ac5",
  mint: "#b7fff3",
  lemon: "#fff0a2",
  grape: "#dac4ff",
  soda: "#b7e7ff",
  peach: "#ffd6a7",
};

const nextTileId = () => {
  tileSequence += 1;
  return tileSequence;
};

const createTile = (
  row: number,
  col: number,
  type?: CandyType,
): CandyTileData => ({
  id: nextTileId(),
  type: type ?? CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)],
  row,
  col,
  removing: false,
});

const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((tile) => (tile ? { ...tile } : null)));

const getTilePosition = (
  row: number,
  col: number,
): [number, number, number] => [
  (col - (GRID_SIZE - 1) / 2) * TILE_GAP,
  ((GRID_SIZE - 1) / 2 - row) * TILE_GAP,
  0,
];

const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  );

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      let type = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];

      while (
        (col >= 2 &&
          board[row][col - 1]?.type === type &&
          board[row][col - 2]?.type === type) ||
        (row >= 2 &&
          board[row - 1][col]?.type === type &&
          board[row - 2][col]?.type === type)
      ) {
        type = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
      }

      board[row][col] = createTile(row, col, type);
    }
  }

  return board;
};

const swapCells = (
  board: Board,
  first: GridPosition,
  second: GridPosition,
): Board => {
  const next = cloneBoard(board);
  const firstTile = next[first.row][first.col];
  const secondTile = next[second.row][second.col];

  if (!firstTile || !secondTile) {
    return board;
  }

  next[first.row][first.col] = {
    ...secondTile,
    row: first.row,
    col: first.col,
  };
  next[second.row][second.col] = {
    ...firstTile,
    row: second.row,
    col: second.col,
  };

  return next;
};

const findMatches = (board: Board) => {
  const matched = new Set<string>();
  const matchedTiles = new Set<number>();

  for (let row = 0; row < GRID_SIZE; row += 1) {
    let runStart = 0;
    while (runStart < GRID_SIZE) {
      const currentType = board[row][runStart]?.type;
      if (!currentType) {
        runStart += 1;
        continue;
      }

      let runEnd = runStart + 1;
      while (runEnd < GRID_SIZE && board[row][runEnd]?.type === currentType) {
        runEnd += 1;
      }

      if (runEnd - runStart >= 3) {
        for (let col = runStart; col < runEnd; col += 1) {
          const tile = board[row][col];
          if (tile) {
            matched.add(`${row}:${col}`);
            matchedTiles.add(tile.id);
          }
        }
      }

      runStart = runEnd;
    }
  }

  for (let col = 0; col < GRID_SIZE; col += 1) {
    let runStart = 0;
    while (runStart < GRID_SIZE) {
      const currentType = board[runStart][col]?.type;
      if (!currentType) {
        runStart += 1;
        continue;
      }

      let runEnd = runStart + 1;
      while (runEnd < GRID_SIZE && board[runEnd][col]?.type === currentType) {
        runEnd += 1;
      }

      if (runEnd - runStart >= 3) {
        for (let row = runStart; row < runEnd; row += 1) {
          const tile = board[row][col];
          if (tile) {
            matched.add(`${row}:${col}`);
            matchedTiles.add(tile.id);
          }
        }
      }

      runStart = runEnd;
    }
  }

  return {
    cells: Array.from(matched, (value) => {
      const [row, col] = value.split(":").map(Number);
      return { row, col };
    }),
    tileIds: matchedTiles,
  };
};

const markMatchedTiles = (board: Board, tileIds: Set<number>): Board =>
  board.map((row) =>
    row.map((tile) =>
      tile && tileIds.has(tile.id) ? { ...tile, removing: true } : tile,
    ),
  );

const collapseBoard = (board: Board, matchedCells: GridPosition[]): Board => {
  const removed = new Set(
    matchedCells.map((cell) => `${cell.row}:${cell.col}`),
  );
  const next: Board = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  );

  for (let col = 0; col < GRID_SIZE; col += 1) {
    const survivors: CandyTileData[] = [];

    for (let row = GRID_SIZE - 1; row >= 0; row -= 1) {
      const tile = board[row][col];
      if (!tile || removed.has(`${row}:${col}`)) {
        continue;
      }
      survivors.push(tile);
    }

    let writeRow = GRID_SIZE - 1;
    for (const tile of survivors) {
      next[writeRow][col] = { ...tile, row: writeRow, col, removing: false };
      writeRow -= 1;
    }

    while (writeRow >= 0) {
      next[writeRow][col] = createTile(writeRow, col);
      writeRow -= 1;
    }
  }

  return next;
};

const areAdjacent = (first: GridPosition, second: GridPosition) =>
  Math.abs(first.row - second.row) + Math.abs(first.col - second.col) === 1;

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });

const Match3Board = ({
  board,
  selectedCell,
  busy,
  activeIndex,
  onTilePointerDown,
}: {
  board: Board;
  selectedCell: GridPosition | null;
  busy: boolean;
  activeIndex: number;
  onTilePointerDown: (
    tile: CandyTileData,
    event: ThreeEvent<PointerEvent>,
  ) => void;
}) => {
  const tiles = useMemo(
    () =>
      board.flatMap((row) =>
        row.filter((tile): tile is CandyTileData => tile !== null),
      ),
    [board],
  );

  const isVisible = Math.abs(activeIndex - 2) < 0.95;

  return (
    <group>
      <mesh position={[0, 0, -0.55]} receiveShadow>
        <boxGeometry args={[7.8, 7.8, 0.36]} />
        <meshStandardMaterial
          color="#2a1233"
          roughness={0.32}
          metalness={0.18}
        />
      </mesh>
      <mesh position={[0, 0, -0.3]} receiveShadow>
        <planeGeometry args={[7.3, 7.3]} />
        <meshBasicMaterial color="#16071e" transparent opacity={0.9} />
      </mesh>
      {tiles.map((tile) => {
        const isSelected =
          selectedCell?.row === tile.row && selectedCell?.col === tile.col;

        return (
          <CandyTile
            key={tile.id}
            tile={tile}
            position={getTilePosition(tile.row, tile.col)}
            selected={isSelected}
            disabled={busy}
            isActive={isVisible}
            onPointerDown={onTilePointerDown}
          />
        );
      })}
    </group>
  );
};

const Match3World = ({ activeIndex }: { activeIndex: number }) => {
  const { viewport } = useThree();
  console.log(viewport.width);
  const isMobile = viewport.width <= 12;
  const smallPC = viewport.width <= 16;
  const sceneX = isMobile ? 1.5 : smallPC ? -1.8 : -0.5;
  const sceneY = smallPC ? -4 : 0;
  const sceneScale = isMobile ? 0.4 : 0.5;

  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [selectedCell, setSelectedCell] = useState<GridPosition | null>(null);
  const [bursts, setBursts] = useState<BurstEvent[]>([]);
  const [busy, setBusy] = useState(false);

  const boardRef = useRef(board);
  const busyRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const { playPop, playBurst, resume } = useSound({ volume: 0.12 });

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const pushBursts = useCallback((cells: GridPosition[], nextBoard: Board) => {
    const nextBursts = cells.flatMap((cell) => {
      const tile = nextBoard[cell.row][cell.col];
      if (!tile) {
        return [];
      }

      burstSequence += 1;
      return {
        id: burstSequence,
        position: getTilePosition(cell.row, cell.col),
        color: MATCH_COLORS[tile.type],
      };
    });

    if (nextBursts.length === 0) {
      return;
    }

    setBursts((current) => [...current, ...nextBursts]);
    window.setTimeout(() => {
      const idsToRemove = new Set(nextBursts.map((burst) => burst.id));
      setBursts((current) =>
        current.filter((burst) => !idsToRemove.has(burst.id)),
      );
    }, 1000);
  }, []);

  const resolveBoard = useCallback(
    async (nextBoard: Board) => {
      let workingBoard = nextBoard;
      let chain = 1;

      while (true) {
        const matches = findMatches(workingBoard);
        if (matches.cells.length === 0) {
          setBoard(workingBoard);
          boardRef.current = workingBoard;
          setBusy(false);
          busyRef.current = false;
          break;
        }

        pushBursts(matches.cells, workingBoard);
        playPop();
        if (chain > 1) {
          playBurst();
        }

        const markedBoard = markMatchedTiles(workingBoard, matches.tileIds);
        setBoard(markedBoard);
        boardRef.current = markedBoard;

        await wait(CASCADE_DELAY_MS);

        workingBoard = collapseBoard(markedBoard, matches.cells);
        setBoard(workingBoard);
        boardRef.current = workingBoard;

        await wait(REFILL_DELAY_MS);
        chain += 1;
      }
    },
    [playBurst, playPop, pushBursts],
  );

  const commitSwap = useCallback(
    async (first: GridPosition, second: GridPosition) => {
      if (busyRef.current || !areAdjacent(first, second)) {
        setSelectedCell(null);
        return;
      }

      setBusy(true);
      busyRef.current = true;
      setSelectedCell(null);

      const swappedBoard = swapCells(boardRef.current, first, second);
      setBoard(swappedBoard);
      boardRef.current = swappedBoard;

      await wait(180);

      const matches = findMatches(swappedBoard);
      if (matches.cells.length === 0) {
        const revertedBoard = swapCells(swappedBoard, first, second);
        setBoard(revertedBoard);
        boardRef.current = revertedBoard;
        await wait(180);
        setBusy(false);
        busyRef.current = false;
        return;
      }

      await resolveBoard(swappedBoard);
    },
    [resolveBoard],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current) {
        return;
      }

      dragRef.current.currentX = event.clientX;
      dragRef.current.currentY = event.clientY;
    };

    const handlePointerUp = () => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }

      dragRef.current = null;
      const deltaX = drag.currentX - drag.startX;
      const deltaY = drag.currentY - drag.startY;
      const magnitude = Math.max(Math.abs(deltaX), Math.abs(deltaY));

      if (magnitude < SWAP_DRAG_THRESHOLD) {
        setSelectedCell(null);
        return;
      }

      const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const target: GridPosition = horizontal
        ? {
            row: drag.row,
            col: drag.col + (deltaX > 0 ? 1 : -1),
          }
        : {
            row: drag.row + (deltaY > 0 ? 1 : -1),
            col: drag.col,
          };

      if (
        target.row < 0 ||
        target.row >= GRID_SIZE ||
        target.col < 0 ||
        target.col >= GRID_SIZE
      ) {
        setSelectedCell(null);
        return;
      }

      void commitSwap({ row: drag.row, col: drag.col }, target);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [commitSwap]);

  const handleTilePointerDown = useCallback(
    (tile: CandyTileData, event: ThreeEvent<PointerEvent>) => {
      // Resume audio context on user gesture
      resume();

      if (busyRef.current) {
        return;
      }

      const nextEvent = event as unknown as ReactPointerEvent;
      dragRef.current = {
        row: tile.row,
        col: tile.col,
        startX: nextEvent.clientX,
        startY: nextEvent.clientY,
        currentX: nextEvent.clientX,
        currentY: nextEvent.clientY,
      };
      setSelectedCell({ row: tile.row, col: tile.col });
    },
    [resume],
  );

  return (
    <group
      position={[sceneX, sceneY, 0]}
      scale={[sceneScale, sceneScale, sceneScale]}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 7, 5]} intensity={1.25} color="#fff4f8" />
      <pointLight
        position={[-4, 2, 4]}
        intensity={11}
        distance={14}
        color="#76e0ff"
      />
      <pointLight
        position={[4, -2, 4]}
        intensity={9}
        distance={14}
        color="#ff74c6"
      />

      <Match3Board
        board={board}
        selectedCell={selectedCell}
        busy={busy}
        activeIndex={activeIndex}
        onTilePointerDown={handleTilePointerDown}
      />

      {bursts.map((burst) => (
        <ParticleBurst
          key={burst.id}
          position={burst.position}
          color={burst.color}
          count={26}
        />
      ))}
    </group>
  );
};

export default Match3World;
