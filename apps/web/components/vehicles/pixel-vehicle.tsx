// Race vehicles — Kenney "Car Kit" cars/karts (/models/cars) + "Starter-Kit-Racing"
// moto & trucks (/models/trackkit). All CC0 (kenney.nl). 3D models render in the race;
// the isometric preview PNGs (/public/vehicles) feed the lightweight profile picker.

export interface VehicleOption {
  id: string;
  model: string;
  preview: string;
  label: string;
  /** Y-rotation (radians) to face the race direction (+X). */
  spin: number;
}

const CAR = Math.PI / 2; // Car Kit cars face the race direction after this rotation
const MOTO = Math.PI / 2; // Starter-Kit vehicles share the same orientation convention

export const VEHICLES: VehicleOption[] = [
  { id: "kart-oobi", model: "/models/cars/kart-oobi.glb", preview: "/vehicles/kart-oobi.png", label: "Kart 1", spin: CAR },
  { id: "kart-oodi", model: "/models/cars/kart-oodi.glb", preview: "/vehicles/kart-oodi.png", label: "Kart 2", spin: CAR },
  { id: "kart-ooli", model: "/models/cars/kart-ooli.glb", preview: "/vehicles/kart-ooli.png", label: "Kart 3", spin: CAR },
  { id: "kart-oopi", model: "/models/cars/kart-oopi.glb", preview: "/vehicles/kart-oopi.png", label: "Kart 4", spin: CAR },
  { id: "kart-oozi", model: "/models/cars/kart-oozi.glb", preview: "/vehicles/kart-oozi.png", label: "Kart 5", spin: CAR },
  { id: "race", model: "/models/cars/race.glb", preview: "/vehicles/race.png", label: "Fórmula", spin: CAR },
  { id: "race-future", model: "/models/cars/race-future.glb", preview: "/vehicles/race-future.png", label: "Fórmula F", spin: CAR },
  { id: "sedan-sports", model: "/models/cars/sedan-sports.glb", preview: "/vehicles/sedan-sports.png", label: "Esportivo", spin: CAR },
  { id: "police", model: "/models/cars/police.glb", preview: "/vehicles/police.png", label: "Polícia", spin: CAR },
  { id: "taxi", model: "/models/cars/taxi.glb", preview: "/vehicles/taxi.png", label: "Táxi", spin: CAR },
  { id: "moto", model: "/models/trackkit/vehicle-motorcycle.glb", preview: "/vehicles/vehicle-motorcycle.png", label: "Moto", spin: MOTO },
  { id: "truck-red", model: "/models/trackkit/vehicle-truck-red.glb", preview: "/vehicles/vehicle-truck-red.png", label: "Caminhão Vermelho", spin: MOTO },
  { id: "truck-green", model: "/models/trackkit/vehicle-truck-green.glb", preview: "/vehicles/vehicle-truck-green.png", label: "Caminhão Verde", spin: MOTO },
  { id: "truck-purple", model: "/models/trackkit/vehicle-truck-purple.glb", preview: "/vehicles/vehicle-truck-purple.png", label: "Caminhão Roxo", spin: MOTO },
  { id: "truck-yellow", model: "/models/trackkit/vehicle-truck-yellow.glb", preview: "/vehicles/vehicle-truck-yellow.png", label: "Caminhão Amarelo", spin: MOTO },
];

export const DEFAULT_VEHICLE = "kart-oobi";

export function vehicleFor(id?: string | null): VehicleOption {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0]!;
}

/** Small static preview of a vehicle (isometric render) — used in the picker. */
export function PixelVehicle({ id, size = 56, className }: { id?: string | null; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={vehicleFor(id).preview}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", imageRendering: "auto" }}
    />
  );
}
