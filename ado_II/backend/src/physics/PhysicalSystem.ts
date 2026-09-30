export abstract class PhysicalSystem<Request, Response> {
  abstract simulate(input: Request): Response;
}
