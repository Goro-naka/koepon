import { Injectable } from '@nestjs/common';
import { GachaItem } from '../entities/gacha-item.entity';

export interface DrawableItem {
  id: string;
  dropRate: number;
  rarity: string;
  maxCount?: number;
  currentCount: number;
  [key: string]: any;
}

@Injectable()
export class DrawAlgorithm {
  /**
   * Normalize drop rates to sum to 1.0
   */
  normalizeDropRates<T extends { dropRate: number }>(items: T[]): T[] {
    const totalRate = items.reduce((sum, item) => sum + item.dropRate, 0);
    
    if (totalRate === 0) {
      return items;
    }

    return items.map(item => ({
      ...item,
      dropRate: item.dropRate / totalRate,
    }));
  }

  /**
   * Execute multiple draws with proper probability distribution
   */
  async executeDraws(
    items: GachaItem[],
    userId: string,
    drawCount: number,
    previousDraws?: Array<{ rarity: string }>
  ): Promise<GachaItem[]> {
    this.validateItems(items);

    const availableItems = this.filterAvailableItems(items);
    if (availableItems.length === 0) {
      throw new Error('No available items for draw');
    }

    const normalizedItems = this.normalizeDropRates(availableItems);
    const results: GachaItem[] = [];

    for (let i = 0; i < drawCount; i++) {
      const selectedItem = this.performSingleDraw(
        normalizedItems,
        userId,
        previousDraws,
        results
      );
      results.push(selectedItem);
    }

    return results;
  }

  /**
   * Validate items structure and constraints
   */
  validateItems(items: GachaItem[]): void {
    if (!items || items.length === 0) {
      throw new Error('No items provided');
    }

    items.forEach(item => {
      if (item.dropRate < 0 || item.dropRate > 1) {
        throw new Error('Invalid drop rate');
      }

      if ((item.maxCount && item.maxCount < 0) || item.currentCount < 0) {
        throw new Error('Invalid count values');
      }
    });
  }

  /**
   * Weighted random selection
   */
  calculateWeightedRandom<T extends { weight?: number; dropRate?: number }>(
    items: T[]
  ): T {
    if (!items || items.length === 0) {
      throw new Error('No items available for selection');
    }

    if (items.length === 1) {
      return items[0];
    }

    const weights = items.map(item => item.weight || item.dropRate || 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < items.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return items[i];
      }
    }

    // Fallback to last item
    return items[items.length - 1];
  }

  /**
   * Filter items that are still available for draw
   */
  private filterAvailableItems(items: GachaItem[]): GachaItem[] {
    return items.filter(item => {
      if (item.maxCount && item.currentCount >= item.maxCount) {
        return false;
      }
      return true;
    });
  }

  /**
   * Perform a single draw with rarity guarantee logic
   */
  private performSingleDraw(
    items: GachaItem[],
    userId: string,
    previousDraws?: Array<{ rarity: string }>,
    currentResults?: GachaItem[]
  ): GachaItem {
    const guaranteeThreshold = 50;
    let eligibleItems = items;

    // Check for rarity guarantee
    if (previousDraws && this.shouldTriggerGuarantee(previousDraws, guaranteeThreshold)) {
      eligibleItems = items.filter(item => 
        ['rare', 'epic', 'legendary'].includes(item.rarity)
      );
      
      if (eligibleItems.length === 0) {
        eligibleItems = items; // Fallback if no rare+ items available
      }
    }

    return this.calculateWeightedRandom(eligibleItems);
  }

  /**
   * Check if rarity guarantee should be triggered
   */
  private shouldTriggerGuarantee(
    previousDraws: Array<{ rarity: string }>,
    threshold: number
  ): boolean {
    // Count draws since last rare+ item
    let drawsSinceRare = 0;
    
    for (let i = previousDraws.length - 1; i >= 0; i--) {
      if (['rare', 'epic', 'legendary'].includes(previousDraws[i].rarity)) {
        break;
      }
      drawsSinceRare++;
    }

    return drawsSinceRare >= threshold - 1; // -1 because current draw counts
  }
}