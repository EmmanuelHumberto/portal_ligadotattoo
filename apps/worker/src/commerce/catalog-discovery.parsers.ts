export type CatalogProductType=
  'PEN'|'ROTARY'|'COIL'|'CARTRIDGE'|'INK'|'BATTERY'|'POWER_SUPPLY'|'ACCESSORY';

export function extractProductLinks(html:string,baseUrl:string):string[]{
  const base=new URL(baseUrl);
  const seen=new Set<string>();
  const out:string[]=[];
  for(const match of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)){
    const href=match[1];
    if(!href)continue;
    let url:URL;
    try{url=new URL(href,base);}catch{continue;}
    if(url.hostname!==base.hostname)continue;
    const path=url.pathname.toLowerCase();
    const segments=path.split('/').filter(Boolean);
    if(!segments.length)continue;
    if(segments.some(segment=>[
      'login','cart','account','search','blog','news','about','contact',
      'collections','pages','pmu','smp','cosmetic',
    ].includes(segment)))continue;
    if(/machine|machines|rotary|coil|pen\b|cartridge|needle|grip|power|battery|supply|ink|cable|rca|clip\b|nova|hawk|wand|spektra|flux|xion|\bexo\b|mast|flite|stigma|torque|equalizer|proton/i.test(path)){
      const key=url.origin+url.pathname.replace(/\/$/,'');
      if(!seen.has(key)){seen.add(key);out.push(key);}
    }
  }
  return out;
}

export function isNoise(name:string):boolean{
  const normalized=name.toLowerCase();
  if(normalized.includes('▾'))return true;
  if(/para tatuar|comodidad|robustos|ergonômicos|fácil de limpar/i.test(normalized))return true;
  if(/^(coil machine|rotary & coil machine|rotary machine|wireless machine|power supplies?|traditional power supply|aftercare|tattoo ink mixer|tattoo ink cup|accessories?|cartridges?|needles?|grips?|inks?|machines?|supplies?)$/i.test(normalized))return true;
  return /comparison|tattoo machines|rotary machines|stencil printer|wireless thermal/i.test(normalized);
}

export function classifyProductType(
  name:string,productType?:string,tags?:string[],
):CatalogProductType{
  const normalized=name.toLowerCase();
  const type=(productType??'').toLowerCase();
  const groupedTags=(tags??[]).join(' ').toLowerCase();
  if(/cartridge|cartucho/i.test(normalized)&&!/machine/i.test(normalized))return 'CARTRIDGE';
  if(/power supply|power box|power pack|power unit|powerpack|fonte/i.test(normalized)&&!/machine/i.test(normalized))return 'POWER_SUPPLY';
  if(/battery|batteries|bateria|powerbolt|power bolt/i.test(normalized)&&!/machine|pen|rotary/i.test(normalized))return 'BATTERY';
  if(/\bcoil\b/i.test(`${normalized} ${type} ${groupedTags}`)&&!/cores?\b|washers?\b|\bcoils\b/i.test(normalized))return 'COIL';
  if(/rotary/i.test(`${normalized} ${groupedTags}`))return 'ROTARY';
  if(/machine|tattoo pen|wireless pen|power pen|pen gun|tattoo gun|tattoo kit|\bpmu\b|wand|shader|packer|liner|\bpen\b/i.test(normalized)
    &&!/grip|torsion|tube|needle|plier|pencil/i.test(normalized))return 'PEN';
  if(/\bink\b|tinta|pigment|colour|color|greywash|graywash/i.test(normalized)
    &&!/cup|cap|grip|cartridge|needle|cable|rca/i.test(normalized))return 'INK';
  if(/linetion|sworder|flux|spektra|xion|hawk|bishop|cheyenne|critical|ambition|axys|vlad|equaliser|stigma|musotoku|kwadron/i.test(normalized)
    &&!/cartridge|cartucho|needle|agulha|grip|ink|tinta|battery|power|fonte|cable|rca|cup|bandagem|anel|boné/i.test(normalized))return 'PEN';
  return 'ACCESSORY';
}

export function cleanProductName(rawTitle:string):string|null{
  const raw=rawTitle.replace(/\s+/g,' ').trim();
  if(!raw)return null;
  let first=raw.split(/\s[|–—:]\s/)[0];
  first=(first??raw).trim();
  first=first.replace(/\s*[-–—]\s*(R?\$\s?)?\d[\d.,]*\s*$/,'').trim();
  if(first.length<3||first.length>80)return null;
  return first;
}

export function slugify(value:string){
  return value.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')||'machine';
}

export function cleanShopifyBody(bodyHtml:unknown):string{
  const html=typeof bodyHtml==='string'?bodyHtml:'';
  if(!html)return '';
  return html
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&[a-z#0-9]+;/gi,' ')
    .replace(/\s+/g,' ').trim();
}

export function extractMetaDescription(html:string):string|null{
  const raw=/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1]
    ??/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
  if(!raw)return null;
  return raw.replace(/▾/g,'·').replace(/\s+/g,' ').trim();
}

export function cleanPageText(html:string):string{
  const main=/<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1]
    ??/<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1]??html;
  return main
    .replace(/<(script|style|nav|header|footer|noscript|svg|form|aside)[^>]*>[\s\S]*?<\/\1>/gi,' ')
    .replace(/<div[^>]*class=["'][^"']*(?:collapse|dropdown|mega|menu)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,' ')
    .replace(/<img[^>]*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&[a-z#0-9]+;/gi,' ')
    .replace(/\s+/g,' ').trim();
}

export function extractTechnicalSpecs(
  text:string,category:string='ACCESSORY',
):Array<{key:string;value:string}>{
  const normalized=text.replace(/\s+/g,' ').trim();
  if(!normalized)return [];
  const output:Array<{key:string;value:string}>=[];
  const seen=new Set<string>();
  const add=(key:string,value:string|undefined)=>{
    const normalizedValue=(value??'').trim();
    if(normalizedValue&&!seen.has(key)){
      seen.add(key);output.push({key,value:normalizedValue});
    }
  };
  let match:RegExpExecArray|null;
  const machine=['PEN','ROTARY','COIL'].includes(category);

  if(machine){
    match=/stroke[^.\n]{0,60}?(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to|a)\s*(\d+(?:[.,]\d+)?))?\s*mm/i.exec(normalized);
    if(!match)match=/(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:[.,]\d+)?))?\s*mm\s*(?:adjustable\s*)?stroke/i.exec(normalized);
    if(match)add('stroke',match[2]?`${match[1]}–${match[2]} mm`:`${match[1]} mm`);
  }
  match=/(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to|and)\s*(\d+(?:[.,]\d+)?))?\s*(?:v|volts?)\b/i.exec(normalized);
  if(match)add('voltage_range',match[2]?`${match[1]}–${match[2]} V`:`${match[1]} V`);
  if(machine){
    match=/(coreless|brushless|swiss(?:-made)?\s+motor|maxon\s+motor|faubion\s+motor|dc\s+motor|swiss\s+motor)/i.exec(normalized);
    if(match)add('motor_type',match[1]);
    else{
      match=/motor[^.\n]{0,40}?(coreless|brushless)/i.exec(normalized);
      if(match)add('motor_type',match[1]);
    }
    match=/(\d[\d,.]*)\s*(?:rpm|rotations?\s*(?:per|a)\s*minute)/i.exec(normalized);
    if(match)add('rpm',`${match[1]} RPM`);
  }
  match=/(\d+)\s*mah\b/i.exec(normalized);
  if(match)add('battery_capacity',`${match[1]} mAh`);
  match=/\b(1[0-9]{4}|2[0-9]{4})\b/i.exec(normalized);
  if(match&&/batter/i.test(normalized))add('battery',match[1]);
  match=/weight[^.\n]{0,40}?(\d+(?:[.,]\d+)?)\s*(g|oz|grams?|ounces?)\b/i.exec(normalized)
    ??/(\d+(?:[.,]\d+)?)\s*(g|oz|grams?|ounces?)\b/i.exec(normalized);
  if(match)add('weight',`${match[1]} ${match[2]}`);
  match=/(aircraft(?:-grade)?\s*(?:aluminum|aluminium)|aluminum|aluminium|titanium|brass|stainless\s*steel|copper|aerospace\s*(?:aluminum|aluminium))\b/i.exec(normalized);
  if(match)add('material',match[1]);
  if(machine){
    match=/(direct\s*drive|swash\s*drive|swashdrive|gear\s*drive|linear\s*(?:rotary|drive)|cam\s*drive)/i.exec(normalized);
    if(match)add('drive',match[1]);
    if(/adjustable\s*(?:stroke|course)/i.test(normalized))add('stroke_type','Ajustável');
    else if(/fixed\s*(?:stroke|course)/i.test(normalized))add('stroke_type','Fixo');
  }
  match=/(touch\s*screen|lcd|oled|led\s*display|digital\s*display|tft)/i.exec(normalized);
  if(match)add('screen',match[1]);
  match=/(bluetooth|ble|wifi|wi-fi|wireless)\b/i.exec(normalized);
  if(match)add('connectivity',match[1]);
  match=/(usb-c|usb\s*type-c|type-c|usb)\b/i.exec(normalized);
  if(match)add('charge_port',(match[1]??'').toUpperCase());
  match=/(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|h)\s*(?:charge|charging|runtime|of\s*power|battery\s*life)/i.exec(normalized);
  if(match)add('runtime',`${match[1]} h`);

  if(category==='BATTERY'){
    match=/(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|h)\s*(?:to\s*)?(?:charge|charging|recharge)/i.exec(normalized);
    if(match)add('charge_time',`${match[1]} h`);
  }
  if(category==='POWER_SUPPLY'){
    match=/(\d+(?:[.,]\d+)?)\s*w\b/i.exec(normalized);
    if(match)add('power',`${match[1]} W`);
    match=/output[^.\n]{0,30}?(\d+(?:[.,]\d+)?)\s*(?:v|volts?)\b/i.exec(normalized);
    if(match)add('output-voltage',`${match[1]} V`);
    match=/input[^.\n]{0,30}?(\d+(?:[.,]\d+)?)\s*(?:v|volts?)\b/i.exec(normalized);
    if(match)add('input-voltage',`${match[1]} V`);
  }
  if(category==='INK'){
    match=/(\d+)\s*(?:color|colour|cores|shades|colors?)/i.exec(normalized);
    if(match)add('colors',`${match[1]} cores`);
    match=/(\d+(?:[.,]\d+)?)\s*(?:ml|oz|fl\s*oz)\b/i.exec(normalized);
    if(match)add('volume',`${match[1]} ${/ml/i.test(match[0])?'ml':'oz'}`);
    match=/(water(?:-|\s*)based|alcohol(?:-|\s*)based|acrylic)/i.exec(normalized);
    if(match)add('base',match[1]);
    if(/vegan|cruelty(?:-|\s*)free/i.test(normalized))add('vegan','Sim');
    if(/steril(?:ized|e)|gamma|eo\s*(?:gas|sterilized)/i.test(normalized))add('sterile','Sim');
  }
  if(category==='CARTRIDGE'){
    match=/\b(\d+(?:\.\d+)?)\s*(RL|RS|RM|M1|M2|F)\b/i.exec(normalized);
    if(match)add('needle_config',match[0].trim());
    else{
      match=/(round\s*(?:liner|shader)|magnum|flat\s*(?:shader|magnum)|liner|shader)/i.exec(normalized);
      if(match)add('needle_config',match[1]);
    }
    match=/(\d+(?:[.,]\d+)?)\s*(?:pcs|pieces|pack|count|unid)/i.exec(normalized);
    if(match)add('quantity',match[1]);
    if(/steril(?:ized|e)|eo\s*(?:gas|sterilized)|gamma/i.test(normalized))add('sterile','Sim');
  }
  return output;
}
