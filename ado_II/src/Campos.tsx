import type { InputHTMLAttributes } from "react";

type PropsNumero = { valor: number; onChange: (n: number) => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>;

export function CampoNumero({ valor, onChange, ...props }: PropsNumero) {
  return (
    <input
      {...props}
      key={valor}
      type="number"
      defaultValue={valor}
      onBlur={(e) => onChange(Number(e.target.value))}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

interface PropsSlider {
  label: string;
  min: number;
  max: number;
  step?: number;
  valor: number;
  onChange: (n: number) => void;
}

export function Slider({ label, min, max, step = 0.01, valor, onChange }: PropsSlider) {
  return (
    <div className="campo">
      <label>{label}</label>
      <div className="linha">
        <input type="range" min={min} max={max} step={step} value={valor} onChange={(e) => onChange(Number(e.target.value))} />
        <CampoNumero min={min} max={max} step={step} valor={valor} onChange={onChange} />
      </div>
    </div>
  );
}
