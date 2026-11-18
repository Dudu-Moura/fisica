import { createServer } from "node:http";
import { POST as trajectory } from "./api/trajectory.js";

const rotas: Record<string, (req: Request) => Promise<Response>> = {
  "/api/trajectory": trajectory,
};

createServer(async (req, res) => {
  const rota = rotas[req.url ?? ""];
  if (!rota || req.method !== "POST") {
    res.writeHead(404).end();
    return;
  }

  let corpo = "";
  for await (const parte of req) corpo += parte;

  const resposta = await rota(new Request(`http://localhost${req.url}`, { method: "POST", body: corpo }));
  res.writeHead(resposta.status, { "Content-Type": "application/json" });
  res.end(await resposta.text());
}).listen(3001, () => console.log("API em http://localhost:3001"));
