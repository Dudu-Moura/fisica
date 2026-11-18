import type { Params } from "./App";

const GRAVIDADES = [
  { nome: "Terra", g: 9.81 },
  { nome: "Lua", g: 1.62 },
  { nome: "Marte", g: 3.71 },
  { nome: "Júpiter", g: 24.79 },
];

const CAMPOS = [
  { campo: "initialSpeed", label: "Velocidade inicial (m/s)", min: 1, max: 80, step: 0.5 },
  { campo: "angleDeg", label: "Ângulo (°)", min: 0, max: 90, step: 0.5 },
  { campo: "initialHeight", label: "Altura inicial (m)", min: 0, max: 50, step: 0.5 },
] as const;

interface Props {
  params: Params;
  onChange: (campo: keyof Params, valor: number) => void;
}

export function Controles({ params, onChange }: Props) {
  return (
    <fieldset>
      <legend>Parâmetros</legend>

      {CAMPOS.map((c) => (
        <div key={c.campo} className="campo">
          <label htmlFor={c.campo}>{c.label}</label>
          <div className="linha">
            <input
              id={c.campo}
              type="range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={params[c.campo]}
              onChange={(e) => onChange(c.campo, Number(e.target.value))}
            />
            <input
              type="number"
              min={c.min}
              max={c.max}
              step={c.step}
              value={params[c.campo]}
              onChange={(e) => onChange(c.campo, Number(e.target.value))}
            />
          </div>
        </div>
      ))}

      <div className="campo">
        <label htmlFor="gravidade">Gravidade</label>
        <select
          id="gravidade"
          value={params.gravity}
          onChange={(e) => onChange("gravity", Number(e.target.value))}
        >
          {GRAVIDADES.map((p) => (
            <option key={p.nome} value={p.g}>
              {p.nome} ({p.g} m/s²)
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
