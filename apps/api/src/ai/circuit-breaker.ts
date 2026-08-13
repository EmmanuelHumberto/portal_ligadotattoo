type State={failures:number;openUntil:number};

export class CircuitBreaker {
  private readonly state=new Map<string,State>();

  assertAvailable(key:string) {
    const s=this.state.get(key);
    if (s && s.openUntil>Date.now()) throw new Error('CIRCUIT_OPEN');
  }

  success(key:string){ this.state.delete(key); }

  failure(key:string,threshold=5,cooldownMs=30_000) {
    const s=this.state.get(key) ?? {failures:0,openUntil:0};
    s.failures++;
    if (s.failures>=threshold) {
      s.openUntil=Date.now()+cooldownMs;
      s.failures=0;
    }
    this.state.set(key,s);
  }
}
