# AR-41 Architecture Regression Review

For every material feature/release verify:
- no new direct source -> canonical shortcut;
- no AI -> canonical automatic promotion;
- no frontend provider secrets;
- no direct unsafe dynamic fetch;
- no public media without rights eligibility;
- no affiliate private parameter leak;
- no privileged unaudited mutation;
- no unbounded retry/non-idempotent job;
- no arbitrary filtered URL accidentally canonicalized;
- no analytics PII/free-form query expansion;
- no production rebuild after staging verification;
- no destructive migration violating rollback compatibility.
