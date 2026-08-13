const SECRET_KEYS = new Set([
  'authorization','cookie','set-cookie','password','secret','token',
  'api_key','apikey','access_token','refresh_token','client_secret',
]);

export function redactOperationalValue(value:any,depth=0):any {
  if (depth>8) return '[MAX_DEPTH]';
  if (Array.isArray(value))
    return value.slice(0,100).map(x=>redactOperationalValue(x,depth+1));
  if (!value || typeof value!=='object') {
    if (typeof value==='string' && value.length>4000)
      return value.slice(0,4000)+'[TRUNCATED]';
    return value;
  }
  const out:Record<string,unknown>={};
  for (const [k,v] of Object.entries(value)) {
    const key=k.toLowerCase().replace(/[- ]/g,'_');
    out[k]=SECRET_KEYS.has(key) || key.includes('password') ||
      key.includes('secret') || key.endsWith('_token')
      ? '[REDACTED]'
      : redactOperationalValue(v,depth+1);
  }
  return out;
}
