// Red-Green-Refactor: Green Phase用の最小限実装
import { useState } from 'react';

interface ProbabilityItem {
  itemName: string;
  rarity: string;
  probability: number;
}

interface GachaProbabilityData {
  gachaId: string;
  probabilities: ProbabilityItem[];
}

interface GachaProbabilityManagementProps {
  gachaId?: string;
  initialProbabilities?: ProbabilityItem[];
  onSave?: (data: GachaProbabilityData) => void;
}

export function GachaProbabilityManagement({ 
  gachaId: initialGachaId = '',
  initialProbabilities = [],
  onSave 
}: GachaProbabilityManagementProps) {
  const [selectedGachaId, setSelectedGachaId] = useState(initialGachaId);
  const [probabilities, setProbabilities] = useState<ProbabilityItem[]>(initialProbabilities);
  const [error, setError] = useState<string>('');
  const [showValidationWarning, setShowValidationWarning] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number>(-1);

  const addItem = () => {
    setProbabilities([...probabilities, { itemName: '', rarity: 'Common', probability: 0 }]);
  };

  const updateItem = (index: number, field: keyof ProbabilityItem, value: any) => {
    const updated = [...probabilities];
    if (field === 'probability') {
      // 小数点以下3桁まで制限
      if (value.toString().split('.')[1]?.length > 3) {
        return; // 4桁目は入力を拒否
      }
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setProbabilities(updated);
  };

  const deleteItem = (index: number) => {
    if (showDeleteConfirm === index) {
      const updated = probabilities.filter((_, i) => i !== index);
      setProbabilities(updated);
      setShowDeleteConfirm(-1);
    } else {
      setShowDeleteConfirm(index);
    }
  };

  const validateAndSave = () => {
    const total = probabilities.reduce((sum, item) => sum + item.probability, 0);
    const strictTolerance = 0.001; // 厳密な許容誤差
    const relaxedTolerance = 0.02; // 緩い許容誤差（浮動小数点誤差を考慮）
    
    const diff = Math.abs(total - 100);
    
    if (diff > relaxedTolerance) {
      setError(`確率の合計が100%になっていません。現在の合計: ${total.toFixed(3)}%`);
      return;
    }

    // 小数点誤差の範囲内の場合は警告表示するが保存は可能
    if (diff > strictTolerance) {
      setError(`確率合計: ${total.toFixed(3)}%（小数点誤差により100%未満ですが保存可能です）`);
    } else {
      setError('');
    }
    
    if (onSave && selectedGachaId) {
      onSave({
        gachaId: selectedGachaId,
        probabilities
      });
    }
  };

  const validateRarity = () => {
    const legendaryItems = probabilities.filter(item => item.rarity === 'Legendary');
    const highProbabilityLegendary = legendaryItems.find(item => item.probability > 5.0);
    
    if (highProbabilityLegendary) {
      setShowValidationWarning('Legendaryアイテムの確率が高すぎます。推奨範囲: 0.001% - 5.000%');
    }
  };

  return (
    <div>
      <div>
        <label htmlFor="gacha-select">ガチャ選択</label>
        <select 
          id="gacha-select"
          value={selectedGachaId}
          onChange={(e) => setSelectedGachaId(e.target.value)}
        >
          <option value="">ガチャを選択</option>
          <option value="basic-gacha-001">基本ガチャ</option>
          <option value="premium-gacha-002">プレミアムガチャ</option>
        </select>
      </div>

      {probabilities.map((item, index) => (
        <div key={index}>
          <label htmlFor={`item-name-${index}`}>アイテム名</label>
          <input
            id={`item-name-${index}`}
            value={item.itemName}
            onChange={(e) => updateItem(index, 'itemName', e.target.value)}
          />
          
          <label htmlFor={`rarity-${index}`}>レアリティ</label>
          <select
            id={`rarity-${index}`}
            value={item.rarity}
            onChange={(e) => updateItem(index, 'rarity', e.target.value)}
          >
            <option value="Common">Common</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
          </select>
          
          <label htmlFor={`probability-${index}`}>確率（%）</label>
          <input
            id={`probability-${index}`}
            type="number"
            step="0.001"
            value={item.probability.toFixed(3)}
            onChange={(e) => updateItem(index, 'probability', e.target.value)}
          />
          
          <button onClick={() => deleteItem(index)}>
            削除
          </button>
          
          {showDeleteConfirm === index && (
            <button onClick={() => deleteItem(index)}>
              削除する
            </button>
          )}
        </div>
      ))}

      <button onClick={addItem}>アイテム追加</button>
      <button onClick={validateRarity}>確認</button>
      <button onClick={validateAndSave}>保存</button>

      {error && <div>{error}</div>}
      {showValidationWarning && <div>{showValidationWarning}</div>}
    </div>
  );
}