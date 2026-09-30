import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CentripetalRequest,
  CentripetalResponse,
  DragRequest,
  DragResponse,
  InclinedPlaneRequest,
  InclinedPlaneResponse,
} from '@ado-ii/shared';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  inclinedPlane(req: InclinedPlaneRequest) {
    return this.http.post<InclinedPlaneResponse>('/api/inclined-plane', req);
  }

  centripetal(req: CentripetalRequest) {
    return this.http.post<CentripetalResponse>('/api/centripetal', req);
  }

  drag(req: DragRequest) {
    return this.http.post<DragResponse>('/api/drag', req);
  }
}
