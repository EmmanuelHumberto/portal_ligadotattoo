import {api} from '../../lib/api';
import {SiteHeader} from '../../components/site-header';

const RADAR_COLORS=['#c9a66b','#5aa9e6','#e66b5a','#7fd69a'];

export default async function Compare({searchParams}:{searchParams:Promise<any>}){
 const {ids=''}=await searchParams;
 const clean=String(ids).split(',').filter(Boolean).slice(0,4);
 const data=clean.length?await api(`/public/products/compare?ids=${clean.join(',')}`):{items:[]};
 const items=data.items??[];
 const rows=collect(items);
 return <><SiteHeader/><main className="shell comparePage">
  <p className="accent">COMPARADOR</p><h1>Compare máquinas lado a lado</h1>
  {!items.length?<div className="card emptyState">Adicione até quatro máquinas para comparar.</div>:
  <>
   <RadarChart items={items}/>
   <div className="compareTable" role="region" aria-label="Comparação de máquinas" tabIndex={0}>
    <table>
     <thead><tr><th>Característica</th>{items.map((p:any)=><th key={p.id}>{p.name}<small>{p.brand?.name}</small></th>)}</tr></thead>
     <tbody>
      <tr><th>Preço (a partir de)</th>{items.map((p:any)=><td key={p.id}>{p.offersSummary?`${p.offersSummary.currency} ${p.offersSummary.fromAmount}`:'—'}</td>)}</tr>
      {rows.map((r:any)=><tr key={r.key}><th>{r.label}</th>{items.map((p:any)=><td key={p.id}>{value(p,r.key)}</td>)}</tr>)}
     </tbody>
    </table>
   </div>
  </>}
 </main></>
}

function collect(items:any[]){const m=new Map();for(const p of items)for(const s of p.specifications??[])m.set(s.key,{key:s.key,label:s.label});return [...m.values()]}
function value(p:any,key:string){return p.specifications?.find((x:any)=>x.key===key)?.value??'—'}

function toNumber(v:any):number|null{
 if(v==null)return null;
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 if(typeof v==='string'){
  const n=parseFloat(v.replace(',','.'));
  return Number.isNaN(n)?null:n;
 }
 return null;
}

function RadarChart({items}:{items:any[]}){
 const axisMap=new Map<string,{key:string;label:string}>();
 for(const it of items){
  for(const s of it.canonicalSpecifications??[]){
   if(toNumber(s.value)==null)continue;
   if(!axisMap.has(s.key))axisMap.set(s.key,{key:s.key,label:s.label??s.name??s.key});
  }
 }
 const axes=[...axisMap.values()];
 if(axes.length<3)return <div className="card emptyState">Dados numéricos insuficientes para o gráfico de radar.</div>;
 const n=axes.length;
 const size=380,cx=size/2,cy=size/2,r=140;
 const angle=(i:number)=>Math.PI*2*i/n-Math.PI/2;
 const point=(i:number,v:number)=>({x:cx+r*v*Math.cos(angle(i)),y:cy+r*v*Math.sin(angle(i))});
 const num=(it:any,key:string)=>{
  const s=it.canonicalSpecifications?.find((x:any)=>x.key===key);
  return s?toNumber(s.value):null;
 };
 const ranges=axes.map(a=>{
  const vals=items.map(it=>num(it,a.key)).filter((x):x is number=>x!=null);
  return {min:Math.min(...vals),max:Math.max(...vals)};
 });
 const norm=(i:number,v:number)=>{const r=ranges[i]!;return r.max===r.min?0.5:(v-r.min)/(r.max-r.min);};
 return <div className="card radarCard">
  <h2>Radar comparativo</h2>
  <div className="radarWrap">
   <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label="Gráfico de radar comparativo">
    {[0.25,0.5,0.75,1].map(ring=>(<polygon key={ring} points={axes.map((_,i)=>{const p=point(i,ring);return `${p.x},${p.y}`}).join(' ')} className="radarRing"/>))}
    {axes.map((a,i)=>{const p=point(i,1);return <line key={a.key} x1={cx} y1={cy} x2={p.x} y2={p.y} className="radarAxis"/>;})}
    {axes.map((a,i)=>{const p=point(i,1.18);return <text key={a.key} x={p.x} y={p.y} className="radarLabel" textAnchor="middle" dominantBaseline="middle">{a.label}</text>;})}
    {items.map((it,idx)=>{const pts=axes.map((a,i)=>{const v=num(it,a.key);return point(i,v==null?0:norm(i,v));});return <polygon key={it.id} points={pts.map(p=>`${p.x},${p.y}`).join(' ')} fill={RADAR_COLORS[idx%RADAR_COLORS.length]} fillOpacity={0.22} stroke={RADAR_COLORS[idx%RADAR_COLORS.length]} strokeWidth={2}/>;})}
   </svg>
   <div className="radarLegend">{items.map((it,idx)=><span key={it.id} className="legendItem"><i style={{background:RADAR_COLORS[idx%RADAR_COLORS.length]}}/>{it.name}</span>)}</div>
  </div>
 </div>;
}
