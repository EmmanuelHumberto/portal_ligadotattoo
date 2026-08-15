import { Module } from '@nestjs/common';
import { AIModule } from './ai/ai.module';
import { AnalyticsIngestService } from './analytics/analytics-ingest.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AdminIntelligenceController } from './analytics/admin-intelligence.controller';
import { ExperimentService } from './analytics/experiment.service';
import { FunnelQuery } from './analytics/funnel.query';
import { QualityQuery } from './analytics/quality.query';
import { CatalogModule } from './catalog/catalog.module';
import { CommercePublicQuery } from './catalog/commerce-public.query';
import { ProductController } from './catalog/catalog.controller.v2';
import { AdminProductQuery } from './catalog/admin-product.query';
import { CreateProductHandler } from './catalog/create-product.handler';
import { ProductRepository } from './catalog/product.repository';
import { PublicCatalogController } from './catalog/public-catalog.controller';
import { PublicCommerceController } from './catalog/public-commerce.controller';
import {PublicManufacturerController} from './catalog/public-manufacturer.controller';
import {PublicManufacturerQuery} from './catalog/public-manufacturer.query';
import { PublicProductQuery } from './catalog/public-product.query';
import { AffiliateLinkService } from './commerce/affiliate-link.service';
import { CommerceController } from './commerce/commerce.controller';
import { CommerceQuery } from './commerce/commerce.query';
import { CommerceRepository } from './commerce/commerce.repository';
import { RecordPriceHandler } from './commerce/record-price.handler';
import { CreateEditorialHandler } from './editorial/create-editorial.handler';
import { EditorialController } from './editorial/editorial.controller';
import { EditorialQuery } from './editorial/editorial.query';
import { EditorialRepository } from './editorial/editorial.repository';
import { GenerateAIDraftHandler } from './editorial/generate-ai-draft.handler';
import { StoryCandidateQuery } from './editorial/story-candidate.query';
import { InternalEditorialController } from './editorial/internal-editorial.controller';
import { PipelineConfigController } from './editorial/pipeline-config.controller';
import { EditorialTopicController } from './editorial/topic.controller';
import { PipelineConfigRepository } from './editorial/pipeline-config.repository';
import { EditorialWorkflowHandler } from './editorial/review-publish.handler';
import { MeController } from './iam/me.controller';
import { IngestionController } from './ingestion/ingestion.controller';
import { IngestionQuery } from './ingestion/ingestion.query';
import { SourceRepository } from './ingestion/source.repository';
import { CreateCanonicalProposalHandler } from './knowledge/create-proposal.handler';
import { DecideCanonicalProposalHandler } from './knowledge/decide-proposal.handler';
import { KnowledgeController } from './knowledge/knowledge.controller';
import { KnowledgeQuery } from './knowledge/knowledge.query';
import { CanonicalRepository } from './knowledge/canonical.repository';
import { ClaimRepository } from './knowledge/claim.repository';
import { RecordClaimHandler } from './knowledge/record-claim.handler';
import { MediaLibraryController } from './media/media-library.controller';
import { MediaLibraryQuery } from './media/media-library.query';
import { MediaController } from './media/media.controller';
import { MediaRepository } from './media/media.repository';
import {MEDIA_DELIVERY,MEDIA_STORAGE} from './media/media-storage.port';
import { PublicMediaQuery } from './media/public-media.query';
import {createMediaDelivery} from './media/s3-media-delivery.adapter';
import {createMediaStorage} from './media/s3-media-storage.adapter';
import { SetMediaRightsHandler } from './media/set-media-rights.handler';
import {UploadMediaHandler} from './media/upload-media.handler';
import { AuditQuery } from './ops/audit.query';
import { OperationsController } from './ops/operations.controller';
import { OperationsQuery } from './ops/operations.query';
import { ReadinessService } from './ops/readiness.service';
import { PostgresAuditRepository } from './platform/audit.repository';
import { OutboxRepository } from './platform/outbox.repository';
import { PublicSearchController } from './search/public-search.controller';
import { PublicSearchQuery } from './search/public-search.query';
import { ServiceController } from './service/service.controller';
import { ServiceQuery } from './service/service.query';
import { LaboratoryController } from './laboratory/laboratory.controller';
import { LaboratoryQuery } from './laboratory/laboratory.query';

const controllers = [
  ProductController,
  PublicCatalogController,
  PublicCommerceController,
  PublicManufacturerController,
  KnowledgeController,
  EditorialController,
  InternalEditorialController,
  PipelineConfigController,
  EditorialTopicController,
  IngestionController,
  CommerceController,
  MediaController,
  MediaLibraryController,
  PublicSearchController,
  OperationsController,
  AnalyticsController,
  AdminIntelligenceController,
  MeController,
  ServiceController,
  LaboratoryController,
];

const providers = [
  OutboxRepository,
  PostgresAuditRepository,
  ProductRepository,
  AdminProductQuery,
  CreateProductHandler,
  PublicProductQuery,
  PublicManufacturerQuery,
  CommercePublicQuery,
  ClaimRepository,
  CanonicalRepository,
  RecordClaimHandler,
  CreateCanonicalProposalHandler,
  DecideCanonicalProposalHandler,
  KnowledgeQuery,
  EditorialRepository,
  CreateEditorialHandler,
  EditorialWorkflowHandler,
  EditorialQuery,
  GenerateAIDraftHandler,
  StoryCandidateQuery,
  PipelineConfigRepository,
  SourceRepository,
  IngestionQuery,
  CommerceRepository,
  CommerceQuery,
  RecordPriceHandler,
  AffiliateLinkService,
  MediaRepository,
  UploadMediaHandler,
  MediaLibraryQuery,
  PublicMediaQuery,
  SetMediaRightsHandler,
  PublicSearchQuery,
  AuditQuery,
  OperationsQuery,
  ReadinessService,
  AnalyticsIngestService,
  ExperimentService,
  FunnelQuery,
  QualityQuery,
  ServiceQuery,
  LaboratoryQuery,
  {
    provide:MEDIA_STORAGE,
    useFactory:()=>createMediaStorage(process.env),
  },
  {
    provide: MEDIA_DELIVERY,
    useFactory:()=>createMediaDelivery(process.env),
  },
];

@Module({
  imports: [CatalogModule, AIModule],
  controllers,
  providers,
})
export class FeaturesModule {}
