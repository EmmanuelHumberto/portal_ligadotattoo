# AR-33 API Integration

Home consumes public product and editorial projections.
Product detail consumes catalog detail, public media and commerce offers.
Editorial routes use AR-27 public endpoints.
Offers never receive merchant affiliate destination directly; browser follows the
AR-30 `/go/listing/:id` boundary.
Admin consumes the capability-gated APIs completed through AR-32.

Server Components are preferred for initial data. Client components are reserved
for filters, comparison state, galleries and interactions.

Production auth must forward the server-side Admin session through the auth
adapter; browser code must not receive service credentials.
