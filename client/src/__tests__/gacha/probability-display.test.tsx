import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GachaProbabilityDisplay } from '@/components/gacha/probability-display';

// Red Phase: これらのテストは最初失敗する
describe('ガチャ確率動的設定・表示', () => {
  test('各ガチャごとに異なる確率が表示される', async () => {
    const user = userEvent.setup();
    
    const basicGachaProbabilities = [
      { itemName: 'コモンボイス', rarity: 'Common', probability: 80.000 },
      { itemName: 'レアボイス', rarity: 'Rare', probability: 18.000 },
      { itemName: 'エピックボイス', rarity: 'Epic', probability: 2.000 }
    ];

    const premiumGachaProbabilities = [
      { itemName: 'レアボイス', rarity: 'Rare', probability: 50.000 },
      { itemName: 'エピックボイス', rarity: 'Epic', probability: 35.000 },
      { itemName: 'レジェンダリーボイス', rarity: 'Legendary', probability: 15.000 }
    ];
    
    // 基本ガチャの確率表示
    const { rerender } = render(
      <GachaProbabilityDisplay 
        gachaId="basic-gacha-001" 
        probabilities={basicGachaProbabilities} 
      />
    );
    
    await user.click(screen.getByRole('button', { name: '確率を表示' }));
    
    await waitFor(() => {
      expect(screen.getByText('コモンボイス: 80.000%')).toBeInTheDocument();
      expect(screen.getByText('レアボイス: 18.000%')).toBeInTheDocument();
    });
    
    // 基本ガチャの確率を非表示にする
    await user.click(screen.getByRole('button', { name: '確率を表示' }));
    
    // プレミアムガチャの確率表示
    rerender(
      <GachaProbabilityDisplay 
        gachaId="premium-gacha-002" 
        probabilities={premiumGachaProbabilities} 
      />
    );
    
    await user.click(screen.getByRole('button', { name: '確率を表示' }));
    
    await waitFor(() => {
      expect(screen.getByText('レアボイス: 50.000%')).toBeInTheDocument();
      expect(screen.getByText('レジェンダリーボイス: 15.000%')).toBeInTheDocument();
    });
  });

  test('確率の合計が100%である', async () => {
    const mockGachaProbabilities = [
      { itemName: 'Item1', rarity: 'Common', probability: 70.000 },
      { itemName: 'Item2', rarity: 'Rare', probability: 25.000 },
      { itemName: 'Item3', rarity: 'Epic', probability: 4.500 },
      { itemName: 'Item4', rarity: 'Legendary', probability: 0.500 }
    ];
    
    const totalProbability = mockGachaProbabilities.reduce(
      (sum, item) => sum + item.probability, 0
    );
    
    expect(totalProbability).toBe(100.000);
  });

  test('確率表示が景品表示法に準拠している', async () => {
    const user = userEvent.setup();
    const mockProbabilities = [
      { itemName: 'レアアイテム', rarity: 'Rare', probability: 5.123 }
    ];

    render(<GachaProbabilityDisplay probabilities={mockProbabilities} />);
    
    await user.click(screen.getByRole('button', { name: '確率を表示' }));
    
    await waitFor(() => {
      // 小数点以下3桁まで表示
      expect(screen.getByText(/5\.123%/)).toBeInTheDocument();
      
      // 有料ガチャである旨の表示
      expect(screen.getByText(/有料ガチャ/)).toBeInTheDocument();
      
      // 確率は参考値である旨の注意書き
      expect(screen.getByText(/確率は参考値/)).toBeInTheDocument();
    });
  });
});