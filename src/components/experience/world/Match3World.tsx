import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSound } from "../../../systems/useSound";
import CandyTile, {
  type CandyTileData,
  type CandyType,
} from "../../candy/CandyTile";

const GRID_SIZE = 6;
const TILE_GAP = 1.08;
const SWAP_DRAG_THRESHOLD = 28;
const SWAP_DRAG_THRESHOLD_TOUCH = 12;
const SWAP_ANIMATION_MS = 180;
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

interface DragState {
  row: number;
  col: number;
  pointerType: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

type PointerCaptureTarget = Element;

interface ScrollLockSnapshot {
  htmlOverflow: string;
  bodyOverflow: string;
  htmlTouchAction: string;
  bodyTouchAction: string;
}

let tileSequence = 0;

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

interface Match3HintAnchorDetail {
  x: number;
  y: number;
  visible: boolean;
}

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
      <mesh position={[0, 0, -0.78]} receiveShadow>
        <boxGeometry args={[7.8, 7.8, 0.36]} />
        <meshStandardMaterial
          color="#2a1233"
          roughness={0.32}
          metalness={0.18}
        />
      </mesh>
      <mesh position={[0, 0, -1.02]} receiveShadow>
        <boxGeometry args={[8.5, 8.5, 0.2]} />
        <meshStandardMaterial
          color="#12051a"
          roughness={0.7}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[0, 0, -0.44]} receiveShadow>
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

const DepthFX = ({ active }: { active: boolean }) => {
  const rootRef = useRef<THREE.Group>(null);
  const nearOrbRef = useRef<THREE.Mesh>(null);
  const farOrbRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (!active) {
      return;
    }

    const t = clock.getElapsedTime();
    const root = rootRef.current;
    const nearOrb = nearOrbRef.current;
    const farOrb = farOrbRef.current;
    if (!root || !nearOrb || !farOrb) {
      return;
    }

    root.rotation.y = THREE.MathUtils.damp(
      root.rotation.y,
      Math.sin(t * 0.35) * 0.1,
      3.2,
      delta,
    );
    nearOrb.position.x = 3.85 + Math.sin(t * 1.1) * 0.35;
    nearOrb.position.y = -3.4 + Math.cos(t * 1.6) * 0.24;
    farOrb.position.x = -4.2 + Math.cos(t * 0.85) * 0.3;
    farOrb.position.y = 3.2 + Math.sin(t * 1.3) * 0.22;
  });

  return (
    <group ref={rootRef}>
      <mesh ref={nearOrbRef} position={[3.85, -3.4, 1.65]}>
        <sphereGeometry args={[0.3, 22, 22]} />
        <meshBasicMaterial color="#8ff5ff" transparent opacity={0.3} />
      </mesh>
      <mesh ref={farOrbRef} position={[-4.2, 3.2, -1.7]}>
        <sphereGeometry args={[0.42, 22, 22]} />
        <meshBasicMaterial color="#ff9ae6" transparent opacity={0.24} />
      </mesh>
    </group>
  );
};

const Match3World = ({
  activeIndex,
  centered = false,
}: {
  activeIndex: number;
  centered?: boolean;
}) => {
  const { viewport, camera, size } = useThree();
  const sceneLayout = useMemo(() => {
    const isMobile = viewport.width <= 12;
    const smallPC = viewport.width <= 16;
    return {
      x: centered ? 0 : isMobile ? 1.5 : smallPC ? -1.8 : -0.5,
      y: centered ? -0.8 : smallPC ? -4 : 0,
      scale: isMobile ? 0.4 : 0.5,
    };
  }, [centered, viewport.width]);

  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [selectedCell, setSelectedCell] = useState<GridPosition | null>(null);
  const [busy, setBusy] = useState(false);
  const worldRootRef = useRef<THREE.Group>(null);

  const boardRef = useRef(board);
  const busyRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const hintAnchorLocalRef = useRef(new THREE.Vector3(0, 4.35, 0));
  const hintAnchorWorldRef = useRef(new THREE.Vector3());
  const hintProjectedRef = useRef(new THREE.Vector3());
  const hintLastDetailRef = useRef<Match3HintAnchorDetail>({
    x: 0,
    y: 0,
    visible: false,
  });
  const dragPointerIdRef = useRef<number | null>(null);
  const dragPointerTargetRef = useRef<PointerCaptureTarget | null>(null);
  const scrollLockRef = useRef<ScrollLockSnapshot | null>(null);
  const { playPop, playBurst, resume } = useSound({ volume: 0.12 });
  const isSectionActive = Math.abs(activeIndex - 2) < 0.95;

  const unlockPageScroll = useCallback(() => {
    const snapshot = scrollLockRef.current;
    if (!snapshot) {
      return;
    }

    document.documentElement.style.overflow = snapshot.htmlOverflow;
    document.body.style.overflow = snapshot.bodyOverflow;
    document.documentElement.style.touchAction = snapshot.htmlTouchAction;
    document.body.style.touchAction = snapshot.bodyTouchAction;
    document.documentElement.classList.remove("lenis-stopped");
    document.body.classList.remove("lenis-stopped");
    scrollLockRef.current = null;
  }, []);

  const lockPageScroll = useCallback(() => {
    if (scrollLockRef.current) {
      return;
    }

    scrollLockRef.current = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      htmlTouchAction: document.documentElement.style.touchAction,
      bodyTouchAction: document.body.style.touchAction,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.touchAction = "none";
    document.body.style.touchAction = "none";
    document.documentElement.classList.add("lenis-stopped");
    document.body.classList.add("lenis-stopped");
  }, []);

  useFrame(({ pointer }, delta) => {
    const world = worldRootRef.current;
    if (!world) {
      return;
    }

    if (isSectionActive) {
      const targetRotX = -0.18 + pointer.y * 0.045;
      const targetRotY = pointer.x * 0.08;
      world.rotation.x = THREE.MathUtils.damp(
        world.rotation.x,
        targetRotX,
        4.5,
        delta,
      );
      world.rotation.y = THREE.MathUtils.damp(
        world.rotation.y,
        targetRotY,
        4.2,
        delta,
      );
    }

    let nextX = hintLastDetailRef.current.x;
    let nextY = hintLastDetailRef.current.y;
    let nextVisible = false;

    if (isSectionActive) {
      hintAnchorWorldRef.current.copy(hintAnchorLocalRef.current);
      world.localToWorld(hintAnchorWorldRef.current);
      hintProjectedRef.current.copy(hintAnchorWorldRef.current).project(camera);

      nextX = (hintProjectedRef.current.x * 0.5 + 0.5) * size.width;
      nextY = (-hintProjectedRef.current.y * 0.5 + 0.5) * size.height;
      nextVisible =
        hintProjectedRef.current.z > -1.1 && hintProjectedRef.current.z < 1.1;
    }

    const previous = hintLastDetailRef.current;
    if (
      Math.abs(previous.x - nextX) > 0.8 ||
      Math.abs(previous.y - nextY) > 0.8 ||
      previous.visible !== nextVisible
    ) {
      const detail: Match3HintAnchorDetail = {
        x: nextX,
        y: nextY,
        visible: nextVisible,
      };
      hintLastDetailRef.current = detail;
      window.dispatchEvent(new CustomEvent("match3-hint-anchor", { detail }));
    }
  });

  useEffect(() => {
    return () => {
      const detail: Match3HintAnchorDetail = {
        x: hintLastDetailRef.current.x,
        y: hintLastDetailRef.current.y,
        visible: false,
      };
      window.dispatchEvent(new CustomEvent("match3-hint-anchor", { detail }));
    };
  }, []);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

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
    [playBurst, playPop],
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

      await wait(SWAP_ANIMATION_MS);

      const matches = findMatches(swappedBoard);
      if (matches.cells.length === 0) {
        const revertedBoard = swapCells(swappedBoard, first, second);
        setBoard(revertedBoard);
        boardRef.current = revertedBoard;
        await wait(SWAP_ANIMATION_MS);
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
      const activePointerId = dragPointerIdRef.current;
      if (!dragRef.current || activePointerId === null) {
        return;
      }

      if (event.pointerId !== activePointerId) {
        return;
      }

      if (event.pointerType === "touch") {
        event.preventDefault();
      }
      dragRef.current.currentX = event.clientX;
      dragRef.current.currentY = event.clientY;
    };

    const releaseCaptureAndUnlock = () => {
      const pointerTarget = dragPointerTargetRef.current;
      const pointerId = dragPointerIdRef.current;
      if (pointerTarget && pointerId !== null) {
        pointerTarget.releasePointerCapture?.(pointerId);
      }

      dragPointerTargetRef.current = null;
      dragPointerIdRef.current = null;
      unlockPageScroll();
    };

    const handlePointerUp = (event: PointerEvent) => {
      const activePointerId = dragPointerIdRef.current;
      if (activePointerId === null || event.pointerId !== activePointerId) {
        return;
      }

      const drag = dragRef.current;
      if (!drag) {
        releaseCaptureAndUnlock();
        return;
      }

      dragRef.current = null;
      releaseCaptureAndUnlock();
      const endX = event.clientX;
      const endY = event.clientY;
      const deltaX = endX - drag.startX;
      const deltaY = endY - drag.startY;
      const magnitude = Math.max(Math.abs(deltaX), Math.abs(deltaY));
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const threshold =
        drag.pointerType === "touch" || isCoarsePointer
          ? SWAP_DRAG_THRESHOLD_TOUCH
          : SWAP_DRAG_THRESHOLD;

      if (magnitude < threshold) {
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

    const handlePointerCancel = (event: PointerEvent) => {
      const activePointerId = dragPointerIdRef.current;
      if (activePointerId !== null && event.pointerId !== activePointerId) {
        return;
      }

      dragRef.current = null;
      releaseCaptureAndUnlock();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!dragRef.current) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerCancel, {
      passive: true,
    });
    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("touchmove", handleTouchMove);
      releaseCaptureAndUnlock();
    };
  }, [commitSwap, unlockPageScroll]);

  const handleTilePointerDown = useCallback(
    (tile: CandyTileData, event: ThreeEvent<PointerEvent>) => {
      // Resume audio context on user gesture
      resume();
      window.dispatchEvent(new Event("match3-user-interacted"));

      if (busyRef.current) {
        return;
      }

      // Touch-friendly path: allow tap-to-swap in addition to drag-to-swap.
      // This avoids gesture conflicts with page scroll on small screens.
      if (selectedCell) {
        if (selectedCell.row === tile.row && selectedCell.col === tile.col) {
          setSelectedCell(null);
        } else if (
          areAdjacent(selectedCell, { row: tile.row, col: tile.col })
        ) {
          void commitSwap(selectedCell, { row: tile.row, col: tile.col });
        } else {
          setSelectedCell({ row: tile.row, col: tile.col });
        }
      } else {
        setSelectedCell({ row: tile.row, col: tile.col });
      }

      const nextEvent = event as unknown as ReactPointerEvent;
      const pointerTarget = event.nativeEvent.target as PointerCaptureTarget;
      pointerTarget.setPointerCapture?.(event.pointerId);
      dragPointerTargetRef.current = pointerTarget;
      dragPointerIdRef.current = event.pointerId;
      if (event.pointerType === "touch") {
        lockPageScroll();
      }

      dragRef.current = {
        row: tile.row,
        col: tile.col,
        pointerType: event.pointerType,
        startX: nextEvent.clientX,
        startY: nextEvent.clientY,
        currentX: nextEvent.clientX,
        currentY: nextEvent.clientY,
      };
    },
    [commitSwap, lockPageScroll, resume, selectedCell],
  );

  return (
    <group
      ref={worldRootRef}
      position={[sceneLayout.x, sceneLayout.y, 0]}
      scale={[sceneLayout.scale, sceneLayout.scale, sceneLayout.scale]}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 7, 5]} intensity={1.25} color="#fff4f8" />
      <pointLight
        position={[3.2, 2.5, 3.1]}
        intensity={22}
        distance={18}
        color="#79efff"
      />
      <pointLight
        position={[-3.3, -2.3, 2.7]}
        intensity={18}
        distance={16}
        color="#ffa0ea"
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5.2, -1.6]}
        receiveShadow
      >
        <circleGeometry args={[5.9, 64]} />
        <meshBasicMaterial color="#0b0412" transparent opacity={0.66} />
      </mesh>

      <Match3Board
        board={board}
        selectedCell={selectedCell}
        busy={busy}
        activeIndex={activeIndex}
        onTilePointerDown={handleTilePointerDown}
      />
      <DepthFX active={isSectionActive} />
    </group>
  );
};

export default Match3World;
