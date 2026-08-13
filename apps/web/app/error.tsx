'use client';
export default function Error({reset}:{reset:()=>void}){return <main className="state">
 <p className="accent">Não foi possível carregar esta área.</p><h1>Algo saiu do fluxo esperado.</h1>
 <p>Tente novamente. Se o problema persistir, o evento poderá ser correlacionado pela operação.</p>
 <button className="btn" onClick={reset}>Tentar novamente</button>
 </main>}
