# AI Provider Hub

The AI layer is provider-neutral.

Initial provider adapters:
- OpenAI;
- Anthropic;
- DeepSeek.

The registry is extensible to future providers/models without coupling public
frontend code to a vendor.

A workload policy selects:
- preferred provider/model;
- fallback order;
- timeout;
- retry behavior;
- cost/latency constraints where configured;
- enabled/disabled state.

Rules:
1. credentials are backend-only;
2. frontend never selects using provider secrets;
3. every meaningful execution records workload/provider/model/status/latency;
4. provider errors are normalized;
5. fallback is workload policy, not scattered application logic;
6. AI-generated output has no automatic canonical/public authority;
7. outages degrade AI-assisted functionality rather than governance;
8. routing configuration can change without frontend rebuild.

Conceptual interface:

AI Workload
    |
    v
Provider Hub
 |     |      |
 v     v      v
OpenAI Anthropic DeepSeek
    \   |   /
     Normalized Result
          |
          v
Proposal / Assistive Output / Execution Record
