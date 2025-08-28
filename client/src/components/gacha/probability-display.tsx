// Red-Green-Refactor: Green Phase用の最小限実装
import { useState } from 'react';

interface ProbabilityItem {
  itemName: string;
  rarity: string;
  probability: number;
}

interface GachaProbabilityDisplayProps {
  gachaId?: string;
  probabilities: ProbabilityItem[];
}

export function GachaProbabilityDisplay({ gachaId, probabilities }: GachaProbabilityDisplayProps) {
  const [showProbabilities, setShowProbabilities] = useState(false);

  const handleToggle = () => {
    setShowProbabilities(!showProbabilities);
  };

  return (
    <div>
      <button onClick={handleToggle}>
        確率を表示
      </button>
      
      {showProbabilities && (
        <div>
          {probabilities.map((item, index) => (
            <div key={index}>
              {item.itemName}: {item.probability.toFixed(3)}%
            </div>
          ))}
          
          <div>有料ガチャ</div>
          <div>確率は参考値</div>
        </div>
      )}
    </div>
  );
}