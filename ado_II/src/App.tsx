import { useState } from "react";
import type { SystemId } from "../lib/types";
import { Arrasto } from "./sistemas/Arrasto";
import { ForcaCentripeta } from "./sistemas/ForcaCentripeta";
import { PlanoInclinado } from "./sistemas/PlanoInclinado";

const ABAS: { id: SystemId; nome: string }[] = [
  { id: "inclined-plane", nome: "1. Plano inclinado" },
  { id: "centripetal", nome: "2. Força centrípeta" },
  { id: "drag", nome: "3. Força de arrasto" },
];

export function App() {
  const [aba, setAba] = useState<SystemId>("inclined-plane");

  return (
    <>
      <header>
        <h1>Leis de Newton - Simulador</h1>
        <p>ADO II - Física · Eduardo Moura</p>
      </header>

      <nav className="abas">
        {ABAS.map((a) => (
          <button key={a.id} className={aba === a.id ? "ativa" : ""} onClick={() => setAba(a.id)}>
            {a.nome}
          </button>
        ))}
      </nav>

      <main>
        {aba === "inclined-plane" && (
          <>
            <p className="descricao">
              Bloco m₁ no plano inclinado, ligado por uma polia a uma massa m₂ pendurada. A aceleração é constante (MRUV).
            </p>
            <PlanoInclinado />
          </>
        )}
        {aba === "centripetal" && (
          <>
            <p className="descricao">
              Movimento circular uniforme: a resultante aponta para o centro, Fc = mv²/R. No carro, quem faz esse papel é o atrito estático.
            </p>
            <ForcaCentripeta />
          </>
        )}
        {aba === "drag" && (
          <>
            <p className="descricao">
              Queda a partir do repouso com resistência do ar: a velocidade tende à velocidade terminal.
            </p>
            <Arrasto />
          </>
        )}
      </main>
    </>
  );
}
