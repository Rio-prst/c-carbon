import { Module } from '@nestjs/common';
import { SupabaseStorageProvider } from './supabase-storage.provider';
import { StorageConfigService } from './storage-config.service';
import { EVIDENCE_STORAGE } from './evidence-storage.provider.interface';

@Module({
  providers: [
    StorageConfigService,
    // Registered under the token only: a second registration under the class
    // token would build a second client.
    { provide: EVIDENCE_STORAGE, useClass: SupabaseStorageProvider },
  ],
  exports: [EVIDENCE_STORAGE, StorageConfigService],
})
export class EvidenceStorageModule {}
