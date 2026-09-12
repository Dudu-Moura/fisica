import type { LaunchParams } from "../types";
import { PLANETS, findPlanet } from "../planets";

interface Props {
  params: LaunchParams;
  onChange: <K extends keyof LaunchParams>(
    key: K,
    value: LaunchParams[K],
  ) => void;
}

interface ControlDef {
  key: keyof LaunchParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const CONTROLS: ControlDef[] = [
  {
    key: "initialSpeed",
    label: "Velocidade inicial",
    unit: "m/s",
    min: 1,
    max: 80,
    step: 0.5,
  },
  {
    key: "angleDeg",
    label: "Ângulo de lançamento",
    unit: "°",
    min: 0,
    max: 90,
    step: 0.5,
  },
  {
    key: "initialHeight",
    label: "Altura inicial",
    unit: "m",
    min: 0,
    max: 50,
    step: 0.5,
  },
];

export function ParameterControls({ params, onChange }: Props) {
  return (
    <section className="panel controls">
      <h2>Parâmetros</h2>
      {CONTROLS.map((ctrl) => (
        <label key={ctrl.key} className="control">
          <div className="control-header">
            <span>{ctrl.label}</span>
            <span className="control-value">
              {params[ctrl.key].toFixed(ctrl.step < 1 ? 2 : 1)} {ctrl.unit}
            </span>
          </div>
          <input
            type="range"
            min={ctrl.min}
            max={ctrl.max}
            step={ctrl.step}
            value={params[ctrl.key]}
            onChange={(e) => onChange(ctrl.key, Number(e.target.value))}
          />
          <input
            type="number"
            className="control-number"
            min={ctrl.min}
            max={ctrl.max}
            step={ctrl.step}
            value={params[ctrl.key]}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) {
                onChange(
                  ctrl.key,
                  Math.min(ctrl.max, Math.max(ctrl.min, n)),
                );
              }
            }}
          />
        </label>
      ))}
      <label className="control">
        <div className="control-header">
          <span>Gravidade</span>
          <span className="control-value">
            {params.gravity.toFixed(2)} m/s²
          </span>
        </div>
        <select
          className="control-select"
          value={findPlanet(params.gravity).id}
          onChange={(e) => {
            const planet =
              PLANETS.find((p) => p.id === e.target.value) ?? PLANETS[0];
            onChange("gravity", planet.gravity);
          }}
        >
          {PLANETS.map((planet) => (
            <option key={planet.id} value={planet.id}>
              {planet.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
