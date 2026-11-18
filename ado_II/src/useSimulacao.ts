import { useEffect, useState } from "react";

export function useSimulacao<Req, Res>(rota: string, params: Req) {
  const [resultado, setResultado] = useState<Res | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const corpo = JSON.stringify(params);

  useEffect(() => {
    const controle = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/${rota}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: corpo,
          signal: controle.signal,
        });
        const dados = await res.json();
        if (!res.ok) throw new Error(dados.error);
        setResultado(dados);
        setErro(null);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setErro((e as Error).message);
      }
    }, 30);

    return () => {
      clearTimeout(timer);
      controle.abort();
    };
  }, [rota, corpo]);

  return { resultado, erro };
}
