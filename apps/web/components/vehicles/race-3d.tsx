"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Html, OrbitControls } from "@react-three/drei";
import { clampPct, formatPct } from "@timeup/core";
import { vehicleFor } from "./pixel-vehicle";
import type { RankingEntryDTO } from "@/lib/data/colaborador";

const TRACK_LEN = 24; // finish line at x = TRACK_LEN
const LANE_GAP = 1.6;
const CAR_SCALE = 0.7;

const FOREST = "/models/trackkit/decoration-forest.glb";
useGLTF.preload(FOREST);

function laneZ(i: number, n: number): number {
  return (i - (n - 1) / 2) * LANE_GAP;
}
function targetX(pct: number): number {
  return 1.5 + clampPct(pct) * (TRACK_LEN - 2.5);
}

function Model({ url, position, scale }: { url: string; position: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={obj} position={position} scale={scale ?? 1} />;
}

function Car({ url, z, pct, label, pctLabel, isMe, spin }: { url: string; z: number; pct: number; label: string; pctLabel: string; isMe: boolean; spin: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<THREE.Group>(null);
  const tx = targetX(pct);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.x += (tx - g.position.x) * Math.min(1, dt * 1.8);
  });
  return (
    <group ref={group} position={[1, 0, z]}>
      <group rotation={[0, spin, 0]} scale={CAR_SCALE}>
        <primitive object={cloned} />
      </group>
      <Html position={[0, 1.4, 0]} center distanceFactor={16} occlude={false}>
        <div
          className={`-translate-y-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold shadow-soft ${
            isMe ? "bg-brand text-brand-foreground" : "bg-card text-foreground"
          }`}
        >
          {label} · {pctLabel}
        </div>
      </Html>
    </group>
  );
}

function Track({ n }: { n: number }) {
  const roadWidth = Math.max(LANE_GAP * n + 3, 8);
  const checker = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    const s = 32;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#0b0e14" : "#ffffff";
      ctx.fillRect(x * s, y * s, s, s);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, Math.max(2, Math.round(roadWidth / 1.2)));
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, [roadWidth]);

  const dashes = Math.ceil(TRACK_LEN / 3);

  return (
    <group>
      {/* grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK_LEN / 2, -0.06, 0]}>
        <planeGeometry args={[TRACK_LEN + 70, 90]} />
        <meshStandardMaterial color="#6bbf6f" />
      </mesh>
      {/* clean asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK_LEN / 2, 0, 0]}>
        <planeGeometry args={[TRACK_LEN + 2, roadWidth]} />
        <meshStandardMaterial color="#34383f" />
      </mesh>
      {/* solid edge lines */}
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} rotation={[-Math.PI / 2, 0, 0]} position={[TRACK_LEN / 2, 0.01, (sgn * roadWidth) / 2 * 0.95]}>
          <planeGeometry args={[TRACK_LEN + 2, 0.18]} />
          <meshStandardMaterial color="#e9edf5" />
        </mesh>
      ))}
      {/* dashed center line */}
      {Array.from({ length: dashes }).map((_, k) => (
        <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[k * 3 + 1.2, 0.01, 0]}>
          <planeGeometry args={[1.5, 0.16]} />
          <meshStandardMaterial color="#e9edf5" />
        </mesh>
      ))}
      {/* checkered finish line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK_LEN, 0.02, 0]}>
        <planeGeometry args={[1.6, roadWidth]} />
        <meshStandardMaterial map={checker} />
      </mesh>
      {/* forest decorations on the grass */}
      <Model url={FOREST} position={[8, 0, -roadWidth / 2 - 6]} />
      <Model url={FOREST} position={[22, 0, -roadWidth / 2 - 6]} />
      <Model url={FOREST} position={[14, 0, roadWidth / 2 + 6]} />
      <Model url={FOREST} position={[26, 0, roadWidth / 2 + 6]} />
    </group>
  );
}

function Scene({ entries }: { entries: RankingEntryDTO[] }) {
  const n = entries.length;
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[10, 18, 6]} intensity={1.4} />
      <Track n={n} />
      {entries.map((e, i) => {
        const v = vehicleFor(e.vehicle);
        return (
          <Car
            key={`${e.name}-${i}`}
            url={v.model}
            spin={v.spin}
            z={laneZ(i, n)}
            pct={e.pct}
            label={e.name.split(" ")[0] ?? e.name}
            pctLabel={formatPct(e.pct)}
            isMe={e.isMe}
          />
        );
      })}
      <OrbitControls
        target={[TRACK_LEN * 0.5, 0.3, 0]}
        enablePan={false}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={60}
      />
    </>
  );
}

export default function Race3D({ entries }: { entries: RankingEntryDTO[] }) {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-xl border border-border bg-gradient-to-b from-sky-300/70 to-secondary sm:h-[420px]">
      <Canvas camera={{ position: [TRACK_LEN * 0.12, 12, 18], fov: 42 }} dpr={[1, 1.5]}>
        <Scene entries={entries} />
      </Canvas>
    </div>
  );
}
