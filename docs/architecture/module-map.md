# Module Map

## Convenções

- Colunas marcadas com `—` indicam que o módulo não possui aquele artefato.
- Eventos marcados com `*` são temporais (cron), não emitidos por ações diretas.
- Módulos globais (`@Global()`) são injetáveis sem importação explícita e não aparecem como dependência formal de outros módulos.

---

## Módulos Core

### PrismaModule

| Propriedade | Valor |
|---|---|
| Services | `PrismaService` |
| Modelos | Todos os 45+ modelos do esquema |
| Exporta | `PrismaService` |
| Global | ✅ |
| Testes | — |

### AuditModule

| Propriedade | Valor |
|---|---|
| Services | `AuditService` |
| Modelos | `AuditLog` |
| Endpoints | `GET /audit-logs` |
| Global | ✅ |
| Testes | — |

### NotificationsModule

| Propriedade | Valor |
|---|---|
| Services | `NotificationsService` |
| Modelos | `Notification` |
| Endpoints | `GET /notifications`, `POST /notifications`, `PATCH /notifications/:id/read` |
| Global | ✅ |
| Testes | 3 unit |

---

## Identidade e Acesso

### AuthModule

| Propriedade | Valor |
|---|---|
| Services | `AuthService` |
| Providers | `JwtStrategy`, `JwtAuthGuard`, `PermissionsGuard` |
| Modelos | `User`, `RefreshToken` |
| Endpoints | `POST /auth/login`, `POST /auth/refresh` |
| Dependências externas | JWT, Passport |

### UserModule

| Propriedade | Valor |
|---|---|
| Services | `UserService` |
| Modelos | `User` |
| Endpoints | CRUD `/users` |
| Consome | AuditService |

### RoleModule

| Propriedade | Valor |
|---|---|
| Services | `RoleService` |
| Modelos | `Role`, `Permission`, `UserRole`, `RolePermission` |
| Endpoints | CRUD `/roles` |
| Consome | AuditService |

---

## Empresa e Unidades

### CompanyModule

| Propriedade | Valor |
|---|---|
| Services | `CompanyService` |
| Modelos | `Company`, `Subscription`, `Plan`, `PlanPrice`, `PlanFeature`, `Feature` |
| Endpoints | CRUD `/companies` |
| Consome | AuditService |

### CompanySettingsModule

| Propriedade | Valor |
|---|---|
| Services | `CompanySettingsService` |
| Modelos | `CompanySettings` |
| Endpoints | `GET/PATCH /companies/:id/settings` |
| Consome | AuditService |

### UnitModule

| Propriedade | Valor |
|---|---|
| Services | `UnitService` |
| Modelos | `Unit`, `BusinessHour` |
| Endpoints | CRUD `/units` |
| Consome | AuditService |

---

## Clientes e Profissionais

### CustomerModule

| Propriedade | Valor |
|---|---|
| Services | `CustomerService` |
| Modelos | `Customer` |
| Endpoints | CRUD `/customers` |
| Consome | AuditService |

### ProfessionalModule

| Propriedade | Valor |
|---|---|
| Services | `ProfessionalService` |
| Modelos | `Professional`, `ProfessionalUnit` |
| Endpoints | CRUD `/professionals` |
| Consome | AuditService |

---

## Produtos e Serviços

### ProductModule

| Propriedade | Valor |
|---|---|
| Services | `ProductService` |
| Modelos | `Product` |
| Endpoints | CRUD `/products` |
| Consome | AuditService |

### CategoryModule

| Propriedade | Valor |
|---|---|
| Services | `CategoryService` |
| Modelos | `Category` |
| Endpoints | CRUD `/categories` |
| Consome | AuditService |

### ServiceModule

| Propriedade | Valor |
|---|---|
| Services | `ServiceService` |
| Modelos | `Service` |
| Endpoints | CRUD `/services` |
| Consome | AuditService |

---

## Estoque

### StockModule

| Propriedade | Valor |
|---|---|
| Services | `SupplierService`, `PurchaseService`, `StockMovementService`, `TransferService`, `InventoryService`, `StockReportService`, `StockAlertService`, `StockDashboardService` |
| Controllers | `SupplierController`, `PurchaseController`, `StockMovementController`, `TransferController`, `InventoryController`, `StockReportController`, `StockAlertController`, `StockDashboardController` |
| Modelos | `Supplier`, `Purchase`, `PurchaseItem`, `StockMovement`, `Stock`, `Transfer`, `InventoryCount`, `InventoryItem`, `StockAlert` |
| Endpoints | `GET/POST /suppliers`, `GET/POST /purchases`, `POST /purchases/:id/confirm`, `GET/POST /stock/movements`, `POST /stock/adjust`, `GET /stock/products/:id/stock`, `GET/POST /stock/transfers`, `GET/POST /stock/inventory`, `GET /stock/reports/*`, `GET /stock/alerts`, `POST /stock/alerts/check`, `GET /stock/dashboard/*` |
| Eventos publicados | `StockLow`*, `StockZero`*, `StockNegative`* (via alertas automáticos) |
| Consome | AuditService, StockMovementService (usado por Purchase/Transfer/Inventory), StockAlertService |
| Exporta | Todos os services |
| Testes | 99 unit + 185 e2e |

---

## PDV

### SaleModule

| Propriedade | Valor |
|---|---|
| Services | `SaleService`, `SalePaymentService`, `SaleDashboardService` |
| Controllers | `SaleController`, `PaymentController`, `SaleDashboardController` |
| Modelos | `Sale`, `SaleItem`, `Payment` |
| Endpoints | `GET/POST/PATCH/DELETE /sales`, `PATCH /sales/:id/open`, `PATCH /sales/:id/cancel`, `PATCH /sales/:id/refund`, `POST/GET /sales/:id/payments`, `POST/GET/PATCH/DELETE /sales/:id/items`, `GET /payments/:id`, `PATCH /payments/:id/cancel`, `PATCH /payments/:id/refund`, `GET /sales/dashboard/*` |
| Eventos publicados | `SaleCreated`, `SaleOpened`, `SalePaid`, `SaleCancelled`, `SaleRefunded`, `PaymentReceived` |
| Eventos consumidos | `SalePaid` → AutomationService.onSalePaid |
| Providers utilizados | StockMovementService, FinancialService, CashbackService, LoyaltyService, AutomationService |
| Importa | StockModule, FinancialModule, CashbackModule, LoyaltyModule, AutomationModule |
| Consome | AuditService, NotificationsService |
| Testes | 36 unit |

### CouponModule

| Propriedade | Valor |
|---|---|
| Services | `CouponService` |
| Controllers | `CouponController` |
| Modelos | `Coupon` |
| Endpoints | CRUD `/coupons`, `GET /coupons/code/:code`, `POST /coupons/validate`, `POST /coupons/apply/:saleId/:code` |
| Consome | AuditService |
| Testes | — (incluído nos 10 testes de comercial) |

### CashbackModule

| Propriedade | Valor |
|---|---|
| Services | `CashbackService` |
| Controllers | `CashbackController` |
| Modelos | `CashbackTransaction` |
| Endpoints | `GET /cashback/balance/:customerId`, `GET /cashback/history/:customerId` |
| Eventos publicados | `CashbackGranted`, `CashbackUsed` |
| Consome | AuditService |
| Testes | — |

### LoyaltyModule

| Propriedade | Valor |
|---|---|
| Services | `LoyaltyService` |
| Controllers | `LoyaltyController` |
| Modelos | `LoyaltyProgram`, `LoyaltyPoints` |
| Endpoints | `GET/PATCH /loyalty/config`, `GET /loyalty/balance/:customerId`, `GET /loyalty/history/:customerId` |
| Eventos publicados | `LoyaltyPointsGranted`, `LoyaltyPointsRedeemed` |
| Consome | AuditService |
| Testes | — |

### CashModule

| Propriedade | Valor |
|---|---|
| Services | `CashService` |
| Controllers | `CashController` |
| Modelos | `CashRegister`, `CashTransaction`, `CashClosing` |
| Endpoints | `GET /cash/current`, `POST /cash/open`, `POST /cash/:id/close`, `POST /cash/:id/reopen`, `POST /cash/:id/supply`, `POST /cash/:id/withdraw`, `GET /cash/:id/summary`, `GET /cash/history` |
| Eventos publicados | `CashOpened`, `CashClosed` |
| Consome | FinancialService (close), AuditService |
| Importa | FinancialModule |
| Testes | 13 unit |

---

## Financeiro

### FinancialModule

| Propriedade | Valor |
|---|---|
| Services | `FinancialService` |
| Controllers | `FinancialController` |
| Modelos | `FinancialCategory`, `FinancialAccount`, `CashClosing` |
| Endpoints | CRUD `/financial/categories`, CRUD `/financial/accounts`, `POST /financial/accounts/:id/pay`, `POST /financial/accounts/:id/cancel`, `GET /financial/cash-flow`, `POST /financial/cash-closing`, `GET /financial/cash-closings` |
| Eventos publicados | `PaymentReceived`, `PaymentCancelled` |
| Consome | AuditService |
| Exporta | FinancialService |
| Testes | — |

---

## Agenda

### AppointmentModule

| Propriedade | Valor |
|---|---|
| Services | `AppointmentService` |
| Controllers | `AppointmentController` |
| Modelos | `Appointment` |
| Endpoints | CRUD `/appointments`, `POST /appointments/:id/cancel`, `POST /appointments/:id/reschedule` |
| Eventos publicados | `AppointmentCreated`, `AppointmentConfirmed`, `AppointmentCancelled`, `AppointmentCompleted`, `AppointmentNoShow` |
| Providers utilizados | IntegrationsService (Google Calendar sync) |
| Consome | AuditService, NotificationsService |
| Exporta | — |
| Testes | — |

---

## CRM

### CrmModule

| Propriedade | Valor |
|---|---|
| Services | `CrmService`, `CrmDashboardService` |
| Controllers | `CrmController`, `CrmDashboardController` |
| Modelos | `CustomerSegment`, `CustomerTag`, `CustomerTagAssignment` |
| Endpoints | `GET /crm/profile/:customerId`, CRUD `/crm/segments`, `GET /crm/segments/customer/:customerId`, `GET /crm/dashboard/*` |
| Consome | AuditService |
| Testes | 10 unit |

### CampaignModule

| Propriedade | Valor |
|---|---|
| Services | `CampaignService` |
| Controllers | `CampaignController` |
| Modelos | `Campaign`, `CampaignRecipient` |
| Endpoints | CRUD `/crm/campaigns`, `POST/GET /crm/campaigns/:id/recipients` |
| Eventos publicados | `CampaignCreated`, `CampaignScheduled`, `CampaignStarted`, `CampaignFinished` |
| Consome | AuditService |
| Testes | 10 unit |

### InteractionModule

| Propriedade | Valor |
|---|---|
| Services | `InteractionService` |
| Controllers | `InteractionController` |
| Modelos | `CustomerInteraction` |
| Endpoints | `GET/POST/PATCH/DELETE /crm/interactions` |
| Eventos publicados | `InteractionCreated` |
| Consome | AuditService |
| Testes | 3 unit |

### TaskModule

| Propriedade | Valor |
|---|---|
| Services | `TaskService` |
| Controllers | `TaskController` |
| Modelos | `CustomerTask` |
| Endpoints | `GET/POST /crm/tasks`, `PATCH /crm/tasks/:id`, `PATCH /crm/tasks/:id/complete`, `PATCH /crm/tasks/:id/cancel` |
| Eventos publicados | `TaskCreated`, `TaskCompleted`, `TaskOverdue`* |
| Consome | AuditService |
| Exporta | TaskService |
| Testes | 5 unit |

---

## Automação

### AutomationModule

| Propriedade | Valor |
|---|---|
| Services | `AutomationService` |
| Modelos | `AutomationExecution` |
| Endpoints | — (apenas interno + cron) |
| Eventos consumidos | `SalePaid` (via SalePaymentService), `AppointmentCompleted` (preparado) |
| Eventos temporais | `CustomerBirthday`*, `CustomerInactive`*, `TaskOverdue`*, `CouponExpiring`* |
| Providers utilizados | TaskService (cria tarefas), NotificationsService (notificações) |
| Importa | ScheduleModule, TaskModule |
| Consome | AuditService |
| Dependências externas | `@nestjs/schedule` |
| Testes | — |

---

## Integrações

### IntegrationsModule (Global)

| Propriedade | Valor |
|---|---|
| Services | `IntegrationsService`, `IntegrationLogService`, `WebhookService`, `DomainEventBus`, `PaymentProviderService`, `ProviderFactory`, `PaymentProviderFactory` |
| Controllers | `WebhookController` |
| Providers | `EvolutionProvider`, `GoogleProvider`, `MercadoPagoProvider`, `StripeProvider` (stub), `AsaasProvider` (stub) |
| Modelos | `Integration`, `IntegrationLog` |
| Endpoints | `POST /integrations/webhooks/:provider`, `POST /integrations/webhooks/payment/:provider` |
| Eventos publicados | `IntegrationLog` (sempre registrado) |
| Importa | ConversationsModule (forwardRef) |
| Consome | AuditService |
| Dependências externas | Fetch API (HTTP calls para Evolution, Google, Mercado Pago) |
| Global | ✅ |
| Testes | 8 unit (Evolution + MercadoPago providers) |

### ConversationsModule

| Propriedade | Valor |
|---|---|
| Services | `ConversationsService` |
| Controllers | `ConversationsController` |
| Modelos | `Conversation`, `ConversationMessage`, `ConversationNote`, `ConversationTag` |
| Endpoints | `GET /conversations`, `GET /conversations/:id`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`, `PATCH /conversations/:id/assign`, `PATCH /conversations/:id/priority`, `PATCH /conversations/:id/close`, `POST /conversations/:id/notes`, `GET /conversations/:id/notes`, `POST /conversations/:id/tags`, `DELETE /conversations/:id/tags/:tagId` |
| Eventos publicados | `ConversationCreated`, `ConversationMessageReceived`, `ConversationAssigned`, `ConversationClosed` (documentados, pendentes de hook) |
| Importa | IntegrationsModule (forwardRef) |
| Consome | AuditService |
| Testes | 6 unit |

---

## Mapa de Dependências

```
UserModule       → AuditService
RoleModule       → AuditService
CompanyModule    → AuditService
UnitModule       → AuditService
CustomerModule   → AuditService
ProductModule    → AuditService
CategoryModule   → AuditService
ServiceModule    → AuditService

StockModule      → AuditService, StockMovementService (interno)
SaleModule       → StockMovementService, FinancialService, CashbackService,
                   LoyaltyService, AutomationService, AuditService, NotificationsService
CashModule       → FinancialService, AuditService
AppointmentModule → AuditService, NotificationsService, IntegrationsService

CrmModule        → AuditService
CampaignModule   → AuditService
InteractionModule → AuditService
TaskModule       → AuditService
AutomationModule → TaskService, NotificationsService, AuditService

ConversationsModule → IntegrationsService, AuditService
IntegrationsModule  → ConversationsModule (forwardRef)

AuditModule      → PrismaService (global)
NotificationsModule → PrismaService (global)
```

---

## Serviços Globais (injetáveis sem import)

| Serviço | Módulo | Uso principal |
|---|---|---|
| `PrismaService` | PrismaModule | Acesso a banco |
| `AuditService` | AuditModule | Auditoria de operações |
| `NotificationsService` | NotificationsModule | Notificações internas |
| `IntegrationsService` | IntegrationsModule | Integrações externas |
| `IntegrationLogService` | IntegrationsModule | Log de chamadas |
| `WebhookService` | IntegrationsModule | Recepção de webhooks |
| `DomainEventBus` | IntegrationsModule | Pub/sub in-memory |
| `ProviderFactory` | IntegrationsModule | Fábrica de providers |

---

## Eventos de Domínio

Ver `docs/technical/domain-events.md` para o catálogo completo com 51 eventos.

### Fluxo de eventos

```
Controller → Service → (ação direta)
                         ├── AuditService.create
                         ├── NotificationsService.create
                         ├── AutomationService.onXxx (eventos síncronos)
                         ├── IntegrationsService (webhook outbound)
                         └── DomainEventBus.publish (preparado)

Service → CRON → AutomationService (eventos temporais)
                   ├── checkBirthdays (08:00)
                   ├── checkInactiveCustomers (06:00)
                   ├── checkOverdueTasks (07:00)
                   └── checkExpiringCoupons (09:00)
```

---

## Providers de Integração

### Canais

| Provider | Tipo | Status |
|---|---|---|
| Evolution | WhatsApp | ✅ Implementado |
| Google Calendar | Agenda | ✅ Implementado |
| Mercado Pago | Pagamentos | ✅ PIX/Cartão/Checkout |
| Stripe | Pagamentos | ⏳ Stub |
| Asaas | Pagamentos | ⏳ Stub |

### PaymentProvider Capabilities

| Provider | PIX | CARD | BOLETO | CHECKOUT | SUBSCRIPTION | REFUND | WEBHOOK |
|---|---|---|---|---|---|---|---|
| Mercado Pago | ✅ | ✅ | — | ✅ | — | ✅ | ✅ |
| Stripe | — | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| Asaas | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |

---

## Resumo Numérico

| Métrica | Valor |
|---|---|
| Módulos | 30+ |
| Serviços | 40+ |
| Controllers | 25+ |
| Endpoints | 150+ |
| Modelos Prisma | 45+ |
| Testes | 381 |
| Providers de integração | 5 |
| Eventos de domínio | 51 catalogados |
| Dependências externas | JWT, Passport, @nestjs/schedule, Fetch API |
| Serviços globais | 8 |
