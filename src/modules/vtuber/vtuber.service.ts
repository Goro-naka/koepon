import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VTuber } from './entities/vtuber.entity';

export interface VTuberListResponse {
  vtubers: VTuber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VTuberQueryDto {
  page?: number;
  limit?: number;
  status?: 'active' | 'graduated' | 'hiatus' | 'suspended';
  isVerified?: boolean;
  tags?: string[];
}

@Injectable()
export class VTuberService {
  constructor(
    @InjectRepository(VTuber)
    private readonly vtuberRepository: Repository<VTuber>,
  ) {}

  async findAll(query: VTuberQueryDto): Promise<VTuberListResponse> {
    const { page = 1, limit = 10, status, isVerified, tags } = query;
    
    const skip = (page - 1) * limit;
    const queryBuilder = this.vtuberRepository.createQueryBuilder('vtuber')
      .leftJoinAndSelect('vtuber.gachas', 'gachas');

    if (status) {
      queryBuilder.andWhere('vtuber.status = :status', { status });
    }

    if (isVerified !== undefined) {
      queryBuilder.andWhere('vtuber.isVerified = :isVerified', { isVerified });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('vtuber.tags && :tags', { tags });
    }

    queryBuilder.andWhere('vtuber.isActive = :isActive', { isActive: true });

    const [vtubers, total] = await queryBuilder
      .orderBy('vtuber.subscriberCount', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      vtubers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<VTuber> {
    const vtuber = await this.vtuberRepository
      .createQueryBuilder('vtuber')
      .leftJoinAndSelect('vtuber.gachas', 'gachas')
      .where('vtuber.id = :id', { id })
      .andWhere('vtuber.isActive = :isActive', { isActive: true })
      .getOne();

    if (!vtuber) {
      throw new NotFoundException(`VTuber with ID ${id} not found`);
    }

    return vtuber;
  }

  async findByUserId(userId: string): Promise<VTuber | null> {
    return await this.vtuberRepository
      .createQueryBuilder('vtuber')
      .leftJoinAndSelect('vtuber.gachas', 'gachas')
      .where('vtuber.userId = :userId', { userId })
      .andWhere('vtuber.isActive = :isActive', { isActive: true })
      .getOne();
  }

  async getPopularVTubers(limit: number = 10): Promise<VTuber[]> {
    return await this.vtuberRepository
      .createQueryBuilder('vtuber')
      .where('vtuber.isActive = :isActive', { isActive: true })
      .andWhere('vtuber.status = :status', { status: 'active' })
      .orderBy('vtuber.subscriberCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getActiveGachasByVTuber(vtuberId: string): Promise<any[]> {
    const vtuber = await this.vtuberRepository
      .createQueryBuilder('vtuber')
      .leftJoinAndSelect('vtuber.gachas', 'gachas')
      .where('vtuber.id = :id', { id: vtuberId })
      .andWhere('vtuber.isActive = :isActive', { isActive: true })
      .andWhere('gachas.status = :gachaStatus', { gachaStatus: 'active' })
      .getOne();

    if (!vtuber) {
      throw new NotFoundException(`VTuber with ID ${vtuberId} not found`);
    }

    return vtuber.gachas || [];
  }

  async updateSubscriberCount(id: string, count: number): Promise<VTuber> {
    const vtuber = await this.findOne(id);
    vtuber.subscriberCount = count;
    return await this.vtuberRepository.save(vtuber);
  }

  async updateStatus(id: string, status: 'active' | 'graduated' | 'hiatus' | 'suspended'): Promise<VTuber> {
    const vtuber = await this.findOne(id);
    vtuber.status = status;
    if (status === 'graduated') {
      vtuber.graduationDate = new Date();
    }
    return await this.vtuberRepository.save(vtuber);
  }
}