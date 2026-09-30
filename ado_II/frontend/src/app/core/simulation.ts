import { HttpErrorResponse } from '@angular/common/http';
import { Signal, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, debounceTime, map, of, switchMap } from 'rxjs';

export interface Simulation<Res> {
  result: Signal<Res | null>;
  error: Signal<string | null>;
}

type Outcome<Res> = { ok: true; value: Res } | { ok: false; message: string };

// Liga um signal de parâmetros à API: sempre que um slider muda, uma nova
// requisição é feita (com debounce curto e cancelando a anterior).
// Precisa ser chamado em contexto de injeção (inicializador de campo do componente).
export function createSimulation<Req, Res>(
  params: Signal<Req>,
  fetch: (req: Req) => Observable<Res>,
): Simulation<Res> {
  const result = signal<Res | null>(null);
  const error = signal<string | null>(null);

  toObservable(params)
    .pipe(
      debounceTime(30),
      switchMap((req) =>
        fetch(req).pipe(
          map((value): Outcome<Res> => ({ ok: true, value })),
          catchError((err) => of<Outcome<Res>>({ ok: false, message: describeError(err) })),
        ),
      ),
      takeUntilDestroyed(),
    )
    .subscribe((outcome) => {
      if (outcome.ok) {
        result.set(outcome.value);
        error.set(null);
      } else {
        error.set(outcome.message);
      }
    });

  return { result, error };
}

function describeError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return String(err);
  if (err.status === 0) return 'Não foi possível conectar ao backend (porta 3001). Ele está rodando?';
  const body = err.error as { error?: string } | null;
  if (err.status === 501) return `${body?.error ?? 'Fórmula não implementada'} (backend/src/physics)`;
  return body?.error ?? `Erro ${err.status}`;
}
