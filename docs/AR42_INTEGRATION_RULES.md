# Integration Rules

1. One root workspace and one lockfile.
2. Web imports only public/shared contracts, never API persistence internals.
3. Worker and API may share explicit contracts but retain separate entrypoints.
4. Runtime secrets are environment/secret-manager inputs.
5. NEXT_PUBLIC variables contain only intentionally public configuration.
6. Database migrations are globally ordered and immutable after production use.
7. Every previous AR migration must be reconciled into this single migration chain.
8. Provider SDKs live behind AI adapters.
9. Direct source-controlled fetch remains forbidden outside safe-fetch infrastructure.
10. Public projection and canonical write models remain separate.
