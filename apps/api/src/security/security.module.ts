import {Global,Module} from '@nestjs/common';
import {OriginCsrfGuard} from './origin-csrf.guard';
import {PublicAbuseService} from './public-abuse.service';

@Global()
@Module({
 providers:[OriginCsrfGuard,PublicAbuseService],
 exports:[OriginCsrfGuard,PublicAbuseService],
})
export class SecurityModule{}
