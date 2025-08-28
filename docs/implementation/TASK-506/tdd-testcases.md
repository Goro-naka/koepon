# TASK-506: 法的要件対応 - TDDテストケース設計

## TDD フェーズ: Test Case Design (2/6)

## 概要

法的要件実装のためのテストケースを設計する。特定商取引法、利用規約、プライバシーポリシー、ガチャ確率表示の各機能について包括的なテストを作成する。

## テスト戦略

- **Red Phase**: テストが失敗することを確認
- **Green Phase**: 最小限の実装でテスト通過
- **Refactor Phase**: 品質・パフォーマンスの向上

## 1. 特定商取引法表記テスト

### LC-001: 特定商取引法ページ表示テスト
```typescript
// __tests__/legal/commercial-transactions.test.tsx
describe('特定商取引法表記ページ', () => {
  test('特定商取引法ページが正常に表示される', async () => {
    const { getByRole, getByText } = render(<CommercialTransactionsPage />);
    
    // ページタイトルの確認
    expect(getByRole('heading', { name: '特定商取引法に基づく表記' })).toBeInTheDocument();
    
    // 必須項目の存在確認
    expect(getByText('事業者名')).toBeInTheDocument();
    expect(getByText('所在地')).toBeInTheDocument();
    expect(getByText('電話番号')).toBeInTheDocument();
    expect(getByText('電子メールアドレス')).toBeInTheDocument();
    expect(getByText('代表者')).toBeInTheDocument();
    expect(getByText('販売価格')).toBeInTheDocument();
    expect(getByText('支払方法')).toBeInTheDocument();
    expect(getByText('商品の引渡時期')).toBeInTheDocument();
    expect(getByText('返品・交換')).toBeInTheDocument();
  });

  test('特定商取引法情報が正しく表示される', async () => {
    const mockCommercialInfo = {
      companyName: 'テスト株式会社',
      representativeName: 'テスト太郎',
      address: '東京都渋谷区テスト1-1-1',
      phoneNumber: '03-1234-5678',
      email: 'contact@test.com'
    };
    
    const { getByText } = render(
      <CommercialTransactionsPage commercialInfo={mockCommercialInfo} />
    );
    
    expect(getByText('テスト株式会社')).toBeInTheDocument();
    expect(getByText('テスト太郎')).toBeInTheDocument();
    expect(getByText('東京都渋谷区テスト1-1-1')).toBeInTheDocument();
    expect(getByText('03-1234-5678')).toBeInTheDocument();
    expect(getByText('contact@test.com')).toBeInTheDocument();
  });
});
```

### LC-002: 特定商取引法API テスト
```typescript
// __tests__/api/legal/commercial.test.ts
describe('/api/legal/commercial', () => {
  test('特定商取引法情報を正常に取得できる', async () => {
    const response = await GET('/api/legal/commercial');
    
    expect(response.status).toBe(200);
    
    const commercialInfo = await response.json();
    
    expect(commercialInfo).toHaveProperty('companyName');
    expect(commercialInfo).toHaveProperty('representativeName');
    expect(commercialInfo).toHaveProperty('address');
    expect(commercialInfo).toHaveProperty('phoneNumber');
    expect(commercialInfo).toHaveProperty('email');
    expect(commercialInfo).toHaveProperty('pricing');
    expect(commercialInfo).toHaveProperty('paymentMethods');
    expect(commercialInfo).toHaveProperty('deliveryInfo');
    expect(commercialInfo).toHaveProperty('returnPolicy');
  });

  test('特定商取引法情報の形式が正しい', async () => {
    const response = await GET('/api/legal/commercial');
    const commercialInfo = await response.json();
    
    expect(typeof commercialInfo.companyName).toBe('string');
    expect(commercialInfo.companyName.length).toBeGreaterThan(0);
    expect(commercialInfo.phoneNumber).toMatch(/^\d{2,4}-\d{2,4}-\d{4}$/);
    expect(commercialInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
```

## 2. 利用規約テスト

### LC-003: 利用規約ページ表示テスト
```typescript
// __tests__/legal/terms-of-service.test.tsx
describe('利用規約ページ', () => {
  test('利用規約ページが正常に表示される', async () => {
    const { getByRole, getByText } = render(<TermsOfServicePage />);
    
    expect(getByRole('heading', { name: '利用規約' })).toBeInTheDocument();
    expect(getByText('サービス内容')).toBeInTheDocument();
    expect(getByText('利用者の義務')).toBeInTheDocument();
    expect(getByText('禁止行為')).toBeInTheDocument();
    expect(getByText('知的財産権')).toBeInTheDocument();
    expect(getByText('免責事項')).toBeInTheDocument();
    expect(getByText('準拠法・管轄裁判所')).toBeInTheDocument();
  });

  test('最終更新日が表示される', async () => {
    const mockTerms = {
      lastUpdated: new Date('2024-01-01T00:00:00Z'),
      version: 'v1.0'
    };
    
    const { getByText } = render(<TermsOfServicePage terms={mockTerms} />);
    
    expect(getByText(/最終更新日.*2024年1月1日/)).toBeInTheDocument();
    expect(getByText('バージョン: v1.0')).toBeInTheDocument();
  });
});
```

### LC-004: 利用規約同意フローテスト
```typescript
// __tests__/auth/consent-flow.test.tsx
describe('利用規約同意フロー', () => {
  test('未同意の場合、サービス利用を制限する', async () => {
    const mockUser = { id: 'user-123', termsAccepted: false };
    
    const { getByRole, queryByText } = render(
      <AuthProvider user={mockUser}>
        <GachaPage />
      </AuthProvider>
    );
    
    expect(queryByText('ガチャを引く')).not.toBeInTheDocument();
    expect(getByRole('button', { name: '利用規約に同意する' })).toBeInTheDocument();
  });

  test('利用規約同意後、サービス利用可能', async () => {
    const { getByRole } = render(<ConsentFlow />);
    
    const termsCheckbox = getByRole('checkbox', { name: '利用規約に同意する' });
    const privacyCheckbox = getByRole('checkbox', { name: 'プライバシーポリシーに同意する' });
    const submitButton = getByRole('button', { name: '同意して利用開始' });
    
    // 初期状態では無効
    expect(submitButton).toBeDisabled();
    
    // チェックボックスをチェック
    await userEvent.click(termsCheckbox);
    await userEvent.click(privacyCheckbox);
    
    // ボタンが有効化される
    expect(submitButton).toBeEnabled();
  });

  test('同意情報が正しく記録される', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    };

    const { getByRole } = render(
      <SupabaseProvider value={mockSupabase}>
        <ConsentFlow userId="user-123" />
      </SupabaseProvider>
    );

    await userEvent.click(getByRole('checkbox', { name: '利用規約に同意する' }));
    await userEvent.click(getByRole('checkbox', { name: 'プライバシーポリシーに同意する' }));
    await userEvent.click(getByRole('button', { name: '同意して利用開始' }));

    expect(mockSupabase.from).toHaveBeenCalledWith('legal_consents');
    expect(mockSupabase.from().insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        consent_type: 'terms_of_service',
        accepted_at: expect.any(String)
      })
    );
  });
});
```

## 3. プライバシーポリシーテスト

### LC-005: プライバシーポリシー表示テスト
```typescript
// __tests__/legal/privacy-policy.test.tsx
describe('プライバシーポリシーページ', () => {
  test('プライバシーポリシーが正常に表示される', async () => {
    const { getByRole, getByText } = render(<PrivacyPolicyPage />);
    
    expect(getByRole('heading', { name: 'プライバシーポリシー' })).toBeInTheDocument();
    expect(getByText('収集する個人情報')).toBeInTheDocument();
    expect(getByText('利用目的')).toBeInTheDocument();
    expect(getByText('第三者への提供')).toBeInTheDocument();
    expect(getByText('安全管理措置')).toBeInTheDocument();
    expect(getByText('個人情報の開示・訂正・削除')).toBeInTheDocument();
    expect(getByText('お問い合わせ窓口')).toBeInTheDocument();
  });

  test('個人情報の種類が明記されている', async () => {
    const mockPrivacyPolicy = {
      personalInfoTypes: [
        { type: 'email', description: 'メールアドレス' },
        { type: 'username', description: 'ユーザー名' },
        { type: 'payment', description: '決済情報' }
      ]
    };
    
    const { getByText } = render(
      <PrivacyPolicyPage privacyPolicy={mockPrivacyPolicy} />
    );
    
    expect(getByText('メールアドレス')).toBeInTheDocument();
    expect(getByText('ユーザー名')).toBeInTheDocument();
    expect(getByText('決済情報')).toBeInTheDocument();
  });
});
```

## 4. ガチャ確率表示テスト

### LC-006: ガチャ確率動的設定・表示テスト
```typescript
// __tests__/gacha/probability-display.test.tsx
describe('ガチャ確率動的設定・表示', () => {
  test('各ガチャごとに異なる確率が表示される', async () => {
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
    const { rerender, getByText, getByRole } = render(
      <GachaProbabilityDisplay 
        gachaId="basic-gacha-001" 
        probabilities={basicGachaProbabilities} 
      />
    );
    
    await userEvent.click(getByRole('button', { name: '確率を表示' }));
    expect(getByText('コモンボイス: 80.000%')).toBeInTheDocument();
    expect(getByText('レアボイス: 18.000%')).toBeInTheDocument();
    
    // プレミアムガチャの確率表示
    rerender(
      <GachaProbabilityDisplay 
        gachaId="premium-gacha-002" 
        probabilities={premiumGachaProbabilities} 
      />
    );
    
    await userEvent.click(getByRole('button', { name: '確率を表示' }));
    expect(getByText('レアボイス: 50.000%')).toBeInTheDocument();
    expect(getByText('レジェンダリーボイス: 15.000%')).toBeInTheDocument();
  });

  test('確率の合計が100%である', async () => {
    const mockGachaProbabilities = [
      { probability: 70.000 },
      { probability: 25.000 },
      { probability: 4.500 },
      { probability: 0.500 }
    ];
    
    const totalProbability = mockGachaProbabilities.reduce(
      (sum, item) => sum + item.probability, 0
    );
    
    expect(totalProbability).toBe(100.000);
  });

  test('確率表示が景品表示法に準拠している', async () => {
    const { getByText } = render(<GachaProbabilityDisplay />);
    
    // 小数点以下3桁まで表示
    expect(getByText(/\d+\.\d{3}%/)).toBeInTheDocument();
    
    // 有料ガチャである旨の表示
    expect(getByText(/有料ガチャ/)).toBeInTheDocument();
    
    // 確率は参考値である旨の注意書き
    expect(getByText(/確率は参考値/)).toBeInTheDocument();
  });
});
```

### LC-007: ガチャ確率API テスト
```typescript
// __tests__/api/gacha/probabilities.test.ts
describe('/api/gacha/[id]/probabilities', () => {
  test('ガチャ確率を正常に取得できる', async () => {
    const response = await GET('/api/gacha/test-gacha-001/probabilities');
    
    expect(response.status).toBe(200);
    
    const probabilityData = await response.json();
    
    expect(probabilityData).toHaveProperty('gachaId');
    expect(probabilityData).toHaveProperty('gachaName');
    expect(probabilityData).toHaveProperty('probabilities');
    expect(Array.isArray(probabilityData.probabilities)).toBe(true);
  });

  test('確率データの形式が正しい', async () => {
    const response = await GET('/api/gacha/test-gacha-001/probabilities');
    const probabilityData = await response.json();
    
    const firstItem = probabilityData.probabilities[0];
    
    expect(firstItem).toHaveProperty('itemId');
    expect(firstItem).toHaveProperty('itemName');
    expect(firstItem).toHaveProperty('rarity');
    expect(firstItem).toHaveProperty('probability');
    
    expect(typeof firstItem.probability).toBe('number');
    expect(firstItem.probability).toBeGreaterThan(0);
    expect(firstItem.probability).toBeLessThanOrEqual(100);
  });

  test('確率の合計が100%である', async () => {
    const response = await GET('/api/gacha/test-gacha-001/probabilities');
    const probabilityData = await response.json();
    
    const totalProbability = probabilityData.probabilities.reduce(
      (sum: number, item: any) => sum + item.probability, 0
    );
    
    expect(totalProbability).toBe(100);
  });

  test('存在しないガチャの場合404エラー', async () => {
    const response = await GET('/api/gacha/non-existent-gacha/probabilities');
    expect(response.status).toBe(404);
    
    const errorData = await response.json();
    expect(errorData.error).toBe('Gacha not found');
  });
});
```

## 5. 法的表記アクセシビリティテスト

### LC-008: フッターリンクテスト
```typescript
// __tests__/components/footer.test.tsx
describe('フッター法的リンク', () => {
  test('フッターに法的表記リンクが表示される', () => {
    const { getByRole } = render(<Footer />);
    
    expect(getByRole('link', { name: '特定商取引法に基づく表記' })).toBeInTheDocument();
    expect(getByRole('link', { name: '利用規約' })).toBeInTheDocument();
    expect(getByRole('link', { name: 'プライバシーポリシー' })).toBeInTheDocument();
  });

  test('法的表記リンクが正しいURLを指している', () => {
    const { getByRole } = render(<Footer />);
    
    expect(getByRole('link', { name: '特定商取引法に基づく表記' }))
      .toHaveAttribute('href', '/legal/commercial-transactions');
    expect(getByRole('link', { name: '利用規約' }))
      .toHaveAttribute('href', '/legal/terms-of-service');
    expect(getByRole('link', { name: 'プライバシーポリシー' }))
      .toHaveAttribute('href', '/legal/privacy-policy');
  });
});
```

### LC-009: モバイル対応テスト
```typescript
// __tests__/legal/mobile-responsive.test.tsx
describe('法的表記ページ モバイル対応', () => {
  test('モバイル画面で法的表記が読みやすく表示される', () => {
    // モバイル画面サイズを設定
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<TermsOfServicePage />);
    
    // テキストが画面幅に収まることを確認
    const textElements = container.querySelectorAll('p, li');
    textElements.forEach((element) => {
      expect(element).toHaveStyle('word-wrap: break-word');
    });
  });

  test('タッチ操作でガチャ確率表示が動作する', async () => {
    const { getByRole } = render(<GachaProbabilityDisplay />);
    
    const probabilityButton = getByRole('button', { name: '確率を表示' });
    
    // タッチイベントをシミュレート
    fireEvent.touchStart(probabilityButton);
    fireEvent.touchEnd(probabilityButton);
    
    await waitFor(() => {
      expect(getByRole('dialog', { name: 'ガチャ確率詳細' })).toBeVisible();
    });
  });
});
```

## 6. データ整合性テスト

### LC-010: ガチャ確率動的管理テスト
```typescript
// __tests__/admin/gacha-probability-management.test.tsx
describe('ガチャ確率動的管理', () => {
  test('管理者がガチャ確率を設定できる', async () => {
    const { getByLabelText, getByRole } = render(
      <AdminProvider user={{ role: 'admin' }}>
        <GachaProbabilityEditor gachaId="test-gacha-001" />
      </AdminProvider>
    );

    // アイテムと確率を設定
    await userEvent.type(getByLabelText('アイテム名'), 'テストボイス');
    await userEvent.selectOptions(getByLabelText('レアリティ'), 'Common');
    await userEvent.type(getByLabelText('確率 (%)'), '75.5');
    
    await userEvent.click(getByRole('button', { name: 'アイテム追加' }));
    
    // 確率の合計チェック
    expect(getByText('合計確率: 75.5%')).toBeInTheDocument();
    expect(getByText('残り: 24.5%')).toBeInTheDocument();
  });

  test('確率の合計が100%でない場合、保存できない', async () => {
    const { getByRole } = render(
      <GachaProbabilityEditor 
        gachaId="test-gacha-001"
        items={[
          { itemName: 'Item1', probability: 50.0 },
          { itemName: 'Item2', probability: 30.0 }
        ]} 
      />
    );

    const saveButton = getByRole('button', { name: '確率を保存' });
    
    // 合計80%なので保存ボタンは無効
    expect(saveButton).toBeDisabled();
    expect(getByText('確率の合計は100%である必要があります')).toBeInTheDocument();
  });

  test('確率設定変更時に景品表示法チェックが実行される', async () => {
    const mockValidation = jest.fn().mockResolvedValue({
      isValid: false,
      issues: ['小数点以下の桁数が不正です（3桁まで）']
    });

    const { getByLabelText, getByRole } = render(
      <GachaProbabilityEditor 
        gachaId="test-gacha-001"
        onValidate={mockValidation}
      />
    );

    // 不正な確率値を入力
    await userEvent.type(getByLabelText('確率 (%)'), '75.123456');
    await userEvent.click(getByRole('button', { name: '検証実行' }));

    await waitFor(() => {
      expect(mockValidation).toHaveBeenCalled();
      expect(getByText('小数点以下の桁数が不正です（3桁まで）')).toBeInTheDocument();
    });
  });
});
```

### LC-011: ガチャ確率更新履歴テスト
```typescript
// __tests__/gacha/probability-history.test.ts
describe('ガチャ確率更新履歴', () => {
  test('確率変更履歴が記録される', async () => {
    const oldProbabilities = [
      { itemId: 'item1', probability: 70.0 },
      { itemId: 'item2', probability: 30.0 }
    ];

    const newProbabilities = [
      { itemId: 'item1', probability: 60.0 },
      { itemId: 'item2', probability: 40.0 }
    ];

    await updateGachaProbabilities('gacha-001', newProbabilities, 'admin-123');

    const history = await GET('/api/admin/gacha/gacha-001/probability-history');
    const historyData = await history.json();

    expect(historyData.changes).toHaveLength(1);
    expect(historyData.changes[0]).toMatchObject({
      gachaId: 'gacha-001',
      updatedBy: 'admin-123',
      oldProbabilities,
      newProbabilities,
      updatedAt: expect.any(String)
    });
  });

  test('確率変更時に既存ガチャ表示が即座に更新される', async () => {
    const { rerender, getByText } = render(
      <GachaPage gachaId="test-gacha-001" />
    );

    // 初期確率表示
    expect(getByText('レア確率: 20.000%')).toBeInTheDocument();

    // バックエンドで確率を更新
    await updateGachaProbabilities('test-gacha-001', [
      { itemId: 'rare-item', probability: 25.0 }
    ]);

    // リアルタイム更新をシミュレート
    rerender(<GachaPage gachaId="test-gacha-001" />);

    await waitFor(() => {
      expect(getByText('レア確率: 25.000%')).toBeInTheDocument();
    });
  });
});
```

### LC-012: 法的文書バージョン管理テスト
```typescript
// __tests__/admin/legal-document-management.test.ts
describe('法的文書バージョン管理', () => {
  test('新バージョンの法的文書を作成できる', async () => {
    const newDocument = {
      type: 'terms_of_service',
      version: 'v2.0',
      title: '利用規約',
      content: '更新された利用規約内容...',
      effectiveDate: new Date('2024-02-01')
    };
    
    const response = await POST('/api/admin/legal/documents', newDocument);
    
    expect(response.status).toBe(201);
    
    const createdDocument = await response.json();
    expect(createdDocument.version).toBe('v2.0');
    expect(createdDocument.isActive).toBe(false); // 承認待ち状態
  });

  test('文書更新時に既存ユーザーの再同意が必要になる', async () => {
    // 文書をアクティブ化
    await PUT('/api/admin/legal/documents/123/activate');
    
    // 既存ユーザーの同意状態を確認
    const response = await GET('/api/users/user-123/consent-status');
    const consentStatus = await response.json();
    
    expect(consentStatus.requiresReConsent).toBe(true);
    expect(consentStatus.outdatedConsents).toContain('terms_of_service');
  });
});
```

## テスト実行環境

### Jest設定
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### テストセットアップ
```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW server setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Supabase mock
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn()
    }
  }))
}));
```

## 成功基準

### テスト通過基準
- ✅ すべてのユニットテスト通過 (80件)
- ✅ カバレッジ80%以上達成
- ✅ E2Eテスト通過
- ✅ アクセシビリティテスト通過

### 法的要件充足基準
- ✅ 特定商取引法表記の完全性
- ✅ 利用規約の法的有効性
- ✅ プライバシーポリシーの個人情報保護法準拠
- ✅ ガチャ確率表示の景品表示法準拠

次のステップ: Red Phase（失敗テスト実装）へ進みます。