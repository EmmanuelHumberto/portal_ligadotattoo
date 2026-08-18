import {afterEach,describe,expect,it,vi} from 'vitest';
import {OllamaAdapter} from '../src/ai/adapters/ollama.adapter';

const request={
  model:{key:'local',providerKey:'ollama',providerModelId:'qwen3.5:0.8b',enabled:true},
  system:'Return JSON.',prompt:'{"source":"test"}',maxOutputTokens:256,
  responseFormat:'json' as const,
};

afterEach(()=>{
  vi.unstubAllGlobals();
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_CONTEXT_WINDOW;
});

describe('OllamaAdapter',()=>{
  it('uses the local chat API without a paid credential',async()=>{
    const fetchMock=vi.fn(async()=>new Response(JSON.stringify({
      message:{content:'{"ok":true}'},prompt_eval_count:20,eval_count:5,
    }),{status:200}));
    vi.stubGlobal('fetch',fetchMock);

    await expect(new OllamaAdapter().execute(request,new AbortController().signal))
      .resolves.toEqual({text:'{"ok":true}',inputTokens:20,outputTokens:5});
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:11434/api/chat',
      expect.objectContaining({method:'POST'}));
    const body=JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({model:'qwen3.5:0.8b',stream:false,think:false,
      format:'json',options:{num_ctx:4096,num_predict:256}});
  });

  it('supports a private deployment endpoint and reports HTTP failures',async()=>{
    process.env.OLLAMA_BASE_URL='http://ollama:11434/';
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:503})));
    await expect(new OllamaAdapter().execute(request,new AbortController().signal))
      .rejects.toThrow('Ollama HTTP 503');
  });

  it('rejects malformed endpoint configuration before making a request',async()=>{
    process.env.OLLAMA_BASE_URL='file:///tmp/model';
    const fetchMock=vi.fn();
    vi.stubGlobal('fetch',fetchMock);
    await expect(new OllamaAdapter().execute(request,new AbortController().signal))
      .rejects.toThrow('Invalid OLLAMA_BASE_URL');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
