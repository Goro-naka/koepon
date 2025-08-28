import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageServiceException } from '../exceptions/reward.exceptions';

export interface FileMetadata {
  vtuberId: string;
  name: string;
  description?: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
}

@Injectable()
export class StorageService {
  private readonly supabaseClient: SupabaseClient;
  private readonly bucketName: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    this.bucketName = this.configService.get('SUPABASE_STORAGE_BUCKET', 'koepon-files');
  }

  async uploadFile(file: Buffer, key: string, metadata: FileMetadata): Promise<UploadResult> {
    try {
      const { data, error } = await this.supabaseClient.storage
        .from(this.bucketName)
        .upload(key, file, {
          contentType: metadata.mimeType,
          metadata: {
            vtuberId: metadata.vtuberId,
            name: metadata.name,
            originalName: metadata.originalName,
            description: metadata.description || '',
          },
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: urlData } = this.supabaseClient.storage
        .from(this.bucketName)
        .getPublicUrl(key);

      return {
        key,
        url: urlData.publicUrl,
        cdnUrl: urlData.publicUrl,
      };
    } catch (error) {
      throw new StorageServiceException(`Failed to upload file: ${error.message}`);
    }
  }

  async generateSignedUrl(key: string, expirationTime: number): Promise<string> {
    try {
      const { data, error } = await this.supabaseClient.storage
        .from(this.bucketName)
        .createSignedUrl(key, expirationTime);

      if (error) {
        throw new Error(error.message);
      }

      return data.signedUrl;
    } catch (error) {
      throw new StorageServiceException(`Failed to generate signed URL: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient.storage
        .from(this.bucketName)
        .remove([key]);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw new StorageServiceException(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const { data, error } = await this.supabaseClient.storage
        .from(this.bucketName)
        .info(key);

      if (error) {
        throw new Error(error.message);
      }

      return {
        vtuberId: data.metadata?.vtuberId || '',
        name: data.metadata?.name || '',
        description: data.metadata?.description || '',
        originalName: data.metadata?.originalName || '',
        mimeType: data.mimeType || 'application/octet-stream',
        size: data.size || 0,
      };
    } catch (error) {
      throw new StorageServiceException(`Failed to get file metadata: ${error.message}`);
    }
  }

  getCdnUrl(key: string): string {
    const { data } = this.supabaseClient.storage
      .from(this.bucketName)
      .getPublicUrl(key);
    return data.publicUrl;
  }

  async invalidateCache(key: string): Promise<void> {
    // Supabase storage doesn't require manual cache invalidation
    // The CDN automatically handles cache invalidation
    console.log(`Cache invalidation requested for key: ${key} - handled automatically by Supabase`);
  }
}