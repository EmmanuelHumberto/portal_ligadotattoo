import { Pool } from 'pg';
import type { JobHandler, JobResult } from '../job-runner';

const MODEL='deepseek-v4-flash';

export class CatalogTranslateHandler implements JobHandler {
  readonly type='catalog.translate';

  constructor(
    private readonly pool:Pool,
    private readonly apiKey:string,
  ) {}

  async handle():Promise<JobResult>{
    if(!this.apiKey)return 'DONE';
    const rows=await this.pool.query(
      `select cf.subject_id, cf.value
         from knowledge.canonical_fact cf
        where cf.property_key='description'
          and cf.decision_reason='CATALOG_IMPORT'
        order by cf.id limit 40`,
    );
    for(const r of rows.rows){
      try {
        const translated=await this.translate(String(r.value));
        if(!translated)continue;
        await this.pool.query(
          `update knowledge.canonical_fact
              set value=$1::jsonb, decision_reason='CATALOG_TRANSLATED'
            where subject_type='PRODUCT_MODEL'
              and subject_id=$2
              and property_key='description'
              and decision_reason='CATALOG_IMPORT'`,
          [JSON.stringify(translated),r.subject_id],
        );
      } catch {
        // segue
      }
    }
    return 'DONE';
  }

  private async translate(text:string):Promise<string|null>{
    const res=await fetch('https://api.deepseek.com/chat/completions',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        authorization:`Bearer ${this.apiKey}`,
      },
      body:JSON.stringify({
        model:MODEL,
        messages:[
          {role:'system',content:'Você traduz descrições de produtos de tatuagem para o português do Brasil. Traduza de forma natural e profissional. NÃO repita o nome do produto no início do texto. Mantenha termos técnicos quando apropriado (RCA, mAh, stroke, voltage, wireless, grip). Retorne APENAS o texto traduzido, sem aspas e sem comentários.'},
          {role:'user',content:text},
        ],
        max_tokens:700,
        temperature:0.3,
      }),
    });
    if(!res.ok)return null;
    const data=await res.json() as any;
    const content=data?.choices?.[0]?.message?.content;
    return typeof content==='string' ? content.trim() : null;
  }
}
