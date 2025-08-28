import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GachaProbabilityManagement } from '@/components/admin/gacha-probability-management';

// Red Phase: これらのテストは最初失敗する
describe('ガチャ確率管理機能', () => {
  test('管理者がガチャごとの確率を設定できる', async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();
    
    render(<GachaProbabilityManagement onSave={mockOnSave} />);
    
    // ガチャ選択
    const gachaSelect = screen.getByRole('combobox', { name: 'ガチャ選択' });
    await user.selectOptions(gachaSelect, 'basic-gacha-001');
    
    // アイテム追加
    const addItemButton = screen.getByRole('button', { name: 'アイテム追加' });
    await user.click(addItemButton);
    
    // アイテム情報入力
    const itemNameInput = screen.getByLabelText('アイテム名');
    const raritySelect = screen.getByLabelText('レアリティ');
    const probabilityInput = screen.getByLabelText('確率（%）');
    
    await user.type(itemNameInput, 'テストボイス');
    await user.selectOptions(raritySelect, 'Common');
    await user.clear(probabilityInput);
    await user.type(probabilityInput, '100.000');
    
    // 保存
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        gachaId: 'basic-gacha-001',
        probabilities: [
          {
            itemName: 'テストボイス',
            rarity: 'Common',
            probability: 100.000
          }
        ]
      });
    });
  });

  test('確率の合計が100%でない場合にエラー表示', async () => {
    const user = userEvent.setup();
    
    const mockProbabilities = [
      { itemName: 'Item1', rarity: 'Common', probability: 70.000 },
      { itemName: 'Item2', rarity: 'Rare', probability: 20.000 }
      // 合計90% - エラーになるべき
    ];
    
    render(
      <GachaProbabilityManagement 
        initialProbabilities={mockProbabilities}
      />
    );
    
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);
    
    expect(screen.getByText(/確率の合計が100%になっていません/)).toBeInTheDocument();
    expect(screen.getByText(/現在の合計: 90.000%/)).toBeInTheDocument();
  });

  test('小数点以下3桁まで設定可能', async () => {
    const user = userEvent.setup();
    
    render(<GachaProbabilityManagement />);
    
    const addItemButton = screen.getByRole('button', { name: 'アイテム追加' });
    await user.click(addItemButton);
    
    const probabilityInput = screen.getByLabelText('確率（%）');
    await user.clear(probabilityInput);
    await user.type(probabilityInput, '0.001');
    
    expect(probabilityInput).toHaveValue(0.001);
    
    // 4桁目は入力できない
    await user.type(probabilityInput, '5');
    expect(probabilityInput).toHaveValue(0.001); // 変わらない
  });

  test('既存のガチャ確率設定の読み込み・編集', async () => {
    const user = userEvent.setup();
    const mockExistingProbabilities = [
      { itemName: '既存ボイス1', rarity: 'Common', probability: 80.000 },
      { itemName: '既存ボイス2', rarity: 'Rare', probability: 20.000 }
    ];
    
    render(
      <GachaProbabilityManagement 
        gachaId="existing-gacha"
        initialProbabilities={mockExistingProbabilities}
      />
    );
    
    // 既存データの表示確認
    expect(screen.getByDisplayValue('既存ボイス1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('80.000')).toBeInTheDocument();
    
    // 編集
    const probabilityInput = screen.getByDisplayValue('80.000');
    await user.clear(probabilityInput);
    await user.type(probabilityInput, '75.000');
    
    // 2つ目のアイテムも調整
    const secondProbabilityInput = screen.getByDisplayValue('20.000');
    await user.clear(secondProbabilityInput);
    await user.type(secondProbabilityInput, '25.000');
    
    expect(probabilityInput).toHaveValue(75);
    expect(secondProbabilityInput).toHaveValue(25);
  });

  test('レアリティごとの確率範囲バリデーション', async () => {
    const user = userEvent.setup();
    
    render(<GachaProbabilityManagement />);
    
    const addItemButton = screen.getByRole('button', { name: 'アイテム追加' });
    await user.click(addItemButton);
    
    const raritySelect = screen.getByLabelText('レアリティ');
    const probabilityInput = screen.getByLabelText('確率（%）');
    
    // Legendaryに高確率を設定しようとする
    await user.selectOptions(raritySelect, 'Legendary');
    await user.clear(probabilityInput);
    await user.type(probabilityInput, '50.000');
    
    const validateButton = screen.getByRole('button', { name: '確認' });
    await user.click(validateButton);
    
    // 警告表示
    expect(screen.getByText(/Legendaryアイテムの確率が高すぎます/)).toBeInTheDocument();
    expect(screen.getByText(/推奨範囲: 0.001% - 5.000%/)).toBeInTheDocument();
  });

  test('ガチャアイテムの削除機能', async () => {
    const user = userEvent.setup();
    const mockProbabilities = [
      { itemName: 'テストアイテム1', rarity: 'Common', probability: 50.000 },
      { itemName: 'テストアイテム2', rarity: 'Rare', probability: 50.000 }
    ];
    
    render(
      <GachaProbabilityManagement 
        initialProbabilities={mockProbabilities}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button', { name: '削除' });
    await user.click(deleteButtons[0]);
    
    // 確認ダイアログ
    const confirmButton = screen.getByRole('button', { name: '削除する' });
    await user.click(confirmButton);
    
    // アイテムが削除されている
    expect(screen.queryByDisplayValue('テストアイテム1')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('テストアイテム2')).toBeInTheDocument();
  });
});