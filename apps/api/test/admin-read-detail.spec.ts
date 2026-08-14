import {describe,expect,it,vi} from 'vitest';
import {KnowledgeQuery} from '../src/knowledge/knowledge.query';
import {EditorialQuery} from '../src/editorial/editorial.query';

describe('admin read detail queries',()=>{
  it('returns a single claim by id when present',async()=>{
    const pool={query:vi.fn().mockResolvedValue({rowCount:1,rows:[{
      id:'c-1',subject_type:'PRODUCT',subject_id:'p-1',property_key:'stroke_mm',
      value:{n:3.5},claimant_type:'SPEC',claimant_id:null,
      source_snapshot_id:null,source_url:null,
      observed_at:'2026-08-13T00:00:00Z',confidence:0.9,status:'ACTIVE',version:1,
    }]})};
    const result=await new KnowledgeQuery(pool as any).claimById('c-1');
    expect(result).toMatchObject({
      id:'c-1',status:'ACTIVE',property_key:'stroke_mm',
    });
  });

  it('returns null when a claim id is unknown',async()=>{
    const pool={query:vi.fn().mockResolvedValue({rowCount:0,rows:[]})};
    await expect(new KnowledgeQuery(pool as any).claimById('missing'))
      .resolves.toBeNull();
  });

  it('maps an editorial admin detail including event fields',async()=>{
    const pool={query:vi.fn().mockResolvedValue({rowCount:1,rows:[{
      id:'e-1',content_type:'EVENT',slug:'fixture-event',title:'Fixture Event',
      subtitle:null,summary:null,body_document:{version:1,blocks:[]},
      status:'DRAFT',origin:'HUMAN',created_by:'actor-1',approved_by:null,
      scheduled_at:null,published_at:null,version:1,
      created_at:'2026-08-13T00:00:00Z',updated_at:'2026-08-13T00:00:00Z',
      starts_at:'2026-09-13T00:00:00Z',ends_at:null,timezone:'America/Sao_Paulo',
      venue_name:null,city:'São Paulo',country_code:'BR',
      official_url:null,event_status:'SCHEDULED',
    }]})};
    const result=await new EditorialQuery(pool as any).adminById('e-1');
    expect(result).toMatchObject({
      id:'e-1',contentType:'EVENT',status:'DRAFT',
      event:{startsAt:'2026-09-13T00:00:00Z',status:'SCHEDULED'},
    });
  });

  it('returns null for an unknown editorial id',async()=>{
    const pool={query:vi.fn().mockResolvedValue({rowCount:0,rows:[]})};
    await expect(new EditorialQuery(pool as any).adminById('missing'))
      .resolves.toBeNull();
  });
});
