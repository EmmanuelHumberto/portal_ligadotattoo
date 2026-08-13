export default function Loading(){return <main className="shell skeletonPage" aria-busy="true">
 <div className="skeleton heroSk"/><div className="grid products">{Array.from({length:6},(_,i)=><div className="card skeleton productSk" key={i}/>)}</div>
 </main>}
