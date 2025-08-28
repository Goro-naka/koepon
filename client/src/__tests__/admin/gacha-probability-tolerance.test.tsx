import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GachaProbabilityManagement } from '@/components/admin/gacha-probability-management';

// 小数点誤差対応のテストケース
describe('ガチャ確率管理 - 小数点誤差対応', () => {
  test('33.33% × 3個 = 99.99%の場合は警告表示するが保存可能', async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();
    
    const testProbabilities = [
      { itemName: 'アイテム1', rarity: 'Common', probability: 33.33 },
      { itemName: 'アイテム2', rarity: 'Common', probability: 33.33 },
      { itemName: 'アイテム3', rarity: 'Common', probability: 33.33 }
      // 合計: 99.99%
    ];
    
    render(
      <GachaProbabilityManagement 
        initialProbabilities={testProbabilities}
        onSave={mockOnSave}
      />
    );
    
    // ガチャを選択
    const gachaSelect = screen.getByLabelText('ガチャ選択');
    await user.selectOptions(gachaSelect, 'basic-gacha-001');
    
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);
    
    // 警告は表示されるが保存は実行される
    // 実際に表示されているメッセージ確認
    expect(screen.getByText(/99.990%/)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        gachaId: 'basic-gacha-001',
        probabilities: testProbabilities
      });
    });
  });

  test('誤差が大きすぎる場合（98%など）は保存不可', async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();
    
    const testProbabilities = [
      { itemName: 'アイテム1', rarity: 'Common', probability: 50.0 },
      { itemName: 'アイテム2', rarity: 'Common', probability: 48.0 }
      // 合計: 98.0% - 許容範囲外
    ];
    
    render(
      <GachaProbabilityManagement 
        gachaId="test-gacha"
        initialProbabilities={testProbabilities}
        onSave={mockOnSave}
      />
    );
    
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);
    
    // エラー表示され、保存は実行されない
    expect(screen.getByText(/確率の合計が100%になっていません/)).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});