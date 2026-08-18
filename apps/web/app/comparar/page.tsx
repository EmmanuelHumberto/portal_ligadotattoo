import {api} from '../../lib/api';
import {SiteHeader} from '../../components/site-header';
import type {
 ProductComparison,ProductDetail,PublicSpecification,SearchParams,
} from '../../lib/public-api-contracts';

const RADAR_COLORS=['#c9a66b','#5aa9e6','#e66b5a','#7fd69a'];
const RADAR_AXES=[
 {label:'RPM / Hz',keys:['rpm','motor_rpm','frequency']},
 {label:'Curso',keys:['stroke']},
 {label:'Bateria',keys:['battery_capacity','capacity','battery']},
 {label:'Peso',keys:['weight']},
 {label:'Tensão',keys:['voltage_range','voltage','motor_nominal_voltage','input-voltage','output-voltage']},
 {label:'Protrusão do grip',keys:['grip_protrusion']},
];

export default async function Compare({searchParams}:{searchParams:Promise<SearchParams>}){
 const raw=(await searchParams).ids;
 const ids=Array.isArray(raw)?raw[0]??'':raw??'';
 const clean=ids.split(',').filter(Boolean).slice(0,4);
 const data:ProductComparison=clean.length
  ? await api<ProductComparison>(`/public/products/compare?ids=${clean.join(',')}`)
  : {items:[]};
 const items=data.items;
 const rows=collect(items);
 return <><SiteHeader/><main className="shell comparePage">
  <p className="accent">COMPARADOR</p><h1>Compare máquinas lado a lado</h1>
  {!items.length?<div className="card emptyState">Adicione até quatro máquinas para comparar.</div>:
  <>
   <RadarChart items={items}/>
   <div className="compareTable" role="region" aria-label="Comparação de máquinas" tabIndex={0}>
    <table>
     <thead><tr><th>Característica</th>{items.map(p=><th key={p.id}>{p.name}<small>{p.brand.name}</small></th>)}</tr></thead>
     <tbody>
      <tr><th>Preço (a partir de)</th>{items.map(p=><td key={p.id}>{p.offersSummary?`${p.offersSummary.currency} ${p.offersSummary.fromAmount}`:'—'}</td>)}</tr>
      {rows.map(r=><tr key={r.key}><th>{r.label}</th>{items.map(p=><td key={p.id}>{value(p,r.key)}</td>)}</tr>)}
     </tbody>
    </table>
   </div>
  </>}
 </main></>
}

function collect(items:ProductDetail[]){
 const rows=new Map<string,{key:string;label:string}>();
 for(const product of items)for(const spec of product.specifications)
  rows.set(spec.key,{key:spec.key,label:spec.label??spec.name??spec.key});
 return [...rows.values()];
}
function value(product:ProductDetail,key:string){
 return display(product.specifications.find(spec=>spec.key===key)?.value);
}

function toNumber(v:unknown):number|null{
 if(v==null)return null;
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 if(typeof v==='string'){
  const n=parseFloat(v.replace(',','.'));
  return Number.isNaN(n)?null:n;
 }
 return null;
}

function numFor(it:ProductDetail,keys:string[]):number|null{
 for(const k of keys){
  const s=it.canonicalSpecifications.find(x=>x.key===k);
  if(s){const v=toNumber(s.value);if(v!=null)return v;}
 }
 return null;
}

function RadarChart({items}:{items:ProductDetail[]}){
 const axes=RADAR_AXES.filter(a=>items.some(it=>numFor(it,a.keys)!=null));
 if(axes.length<2)return <div className="card emptyState">Dados numéricos insuficientes para o gráfico de radar.</div>;
 const n=axes.length;
 const size=380,cx=size/2,cy=size/2,r=140;
 const angle=(i:number)=>Math.PI*2*i/n-Math.PI/2;
 const point=(i:number,v:number)=>({x:cx+r*v*Math.cos(angle(i)),y:cy+r*v*Math.sin(angle(i))});
 const ranges=axes.map(a=>{
  const vals=items.map(it=>numFor(it,a.keys)).filter((x):x is number=>x!=null);
  return {min:Math.min(...vals),max:Math.max(...vals)};
 });
 const norm=(i:number,v:number|null)=>{
  const r=ranges[i]!;
  if(v==null)return 0;
  return r.max===r.min?0.5:(v-r.min)/(r.max-r.min);
 };
 return <div className="card radarCard">
  <h2>Radar comparativo</h2>
  <div className="radarWrap">
   <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label="Gráfico de radar comparativo">
    {[0.25,0.5,0.75,1].map(ring=>(<polygon key={ring} points={axes.map((_,i)=>{const p=point(i,ring);return `${p.x},${p.y}`}).join(' ')} className="radarRing"/>))}
    {axes.map((a,i)=>{const p=point(i,1);return <line key={a.label} x1={cx} y1={cy} x2={p.x} y2={p.y} className="radarAxis"/>;})}
    {axes.map((a,i)=>{const p=point(i,1.18);return <text key={a.label} x={p.x} y={p.y} className="radarLabel" textAnchor="middle" dominantBaseline="middle">{a.label}</text>;})}
    {items.map((it,idx)=>{const pts=axes.map((a,i)=>{const v=numFor(it,a.keys);return point(i,norm(i,v));});return <polygon key={it.id} points={pts.map(p=>`${p.x},${p.y}`).join(' ')} fill={RADAR_COLORS[idx%RADAR_COLORS.length]} fillOpacity={0.22} stroke={RADAR_COLORS[idx%RADAR_COLORS.length]} strokeWidth={2}/>;})}
   </svg>
   <div className="radarLegend">{items.map((it,idx)=><span key={it.id} className="legendItem"><i style={{background:RADAR_COLORS[idx%RADAR_COLORS.length]}}/>{it.name}</span>)}</div>
  </div>
 </div>;
}

function display(value:PublicSpecification['value']|undefined):string{
 if(value==null)return '—';
 return typeof value==='string'?value:JSON.stringify(value);
}
