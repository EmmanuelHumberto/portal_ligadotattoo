import {Module} from '@nestjs/common';
import {FeaturesModule} from './features.module';
import {HealthController} from './health.controller';
import {IamModule} from './iam/iam.module';
import {DatabaseModule} from './platform/database.module';
import {SecurityModule} from './security/security.module';
import {SystemController} from './system.controller';

@Module({
 imports:[DatabaseModule,IamModule,SecurityModule,FeaturesModule],
 controllers:[HealthController,SystemController],
})
export class AppModule {}
