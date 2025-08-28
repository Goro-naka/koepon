# TASK-507: 決済フロー修正 - テストケース仕様書

## 1. フロントエンド テストケース

### 1.1 ガチャストア (stores/gacha.ts)

#### TC-F001: executeDraw - 単発ガチャ直接決済
```typescript
describe('executeDraw - 単発ガチャ', () => {
  it('100円で単発ガチャを購入できること', async () => {
    // Given: ガチャID "gacha_001" と count 1
    const gachaId = 'gacha_001'
    const count = 1
    
    // When: executeDraw を実行
    await gachaStore.executeDraw(gachaId, count)
    
    // Then: 
    expect(mockStripePayment).toHaveBeenCalledWith({
      amount: 100,
      currency: 'jpy',
      metadata: { gachaId, count }
    })
    expect(gachaStore.drawResult.paymentAmount).toBe(100)
    expect(gachaStore.drawResult.medalsEarned).toBeGreaterThan(0)
  })
})
```

#### TC-F002: executeDraw - 10連ガチャ直接決済
```typescript
describe('executeDraw - 10連ガチャ', () => {
  it('1000円で10連ガチャを購入できること', async () => {
    // Given: ガチャID "gacha_001" と count 10
    const gachaId = 'gacha_001'
    const count = 10
    
    // When: executeDraw を実行
    await gachaStore.executeDraw(gachaId, count)
    
    // Then: 
    expect(mockStripePayment).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'jpy'
    })
    expect(gachaStore.drawResult.paymentAmount).toBe(1000)
    expect(gachaStore.drawResult.items).toHaveLength(10)
  })
})
```

#### TC-F003: executeDraw - 決済失敗時のエラーハンドリング
```typescript
describe('executeDraw - エラーハンドリング', () => {
  it('決済失敗時に適切なエラーメッセージを表示すること', async () => {
    // Given: Stripe決済が失敗する設定
    mockStripePayment.mockRejectedValue(new Error('カードが拒否されました'))
    
    // When: executeDraw を実行
    await gachaStore.executeDraw('gacha_001', 1)
    
    // Then: 
    expect(gachaStore.drawState).toBe('error')
    expect(gachaStore.drawError).toBe('決済に失敗しました')
  })
})
```

### 1.2 メダルストア (stores/medal.ts)

#### TC-F004: メダル購入機能の削除確認
```typescript
describe('MedalStore - メダル購入機能削除', () => {
  it('purchaseMedals メソッドが存在しないこと', () => {
    const medalStore = useMedalStore.getState()
    expect(medalStore.purchaseMedals).toBeUndefined()
  })
  
  it('useMedals メソッドが存在しないこと', () => {
    const medalStore = useMedalStore.getState()
    expect(medalStore.useMedals).toBeUndefined()
  })
})
```

#### TC-F005: earnMedals - ガチャ結果としてのメダル獲得
```typescript
describe('earnMedals', () => {
  it('ガチャ結果としてメダルを獲得できること', async () => {
    // Given: 初期メダル残高 1000
    medalStore.setMedalBalance({ availableMedals: 1000 })
    
    // When: ガチャ結果として100メダル獲得
    await medalStore.earnMedals(100, 'gacha')
    
    // Then: メダル残高が1100に増加
    expect(medalStore.medalBalance.availableMedals).toBe(1100)
  })
})
```

### 1.3 UI コンポーネント

#### TC-F006: GachaDetailPage - 価格表示修正
```typescript
describe('GachaDetailPage - 価格表示', () => {
  it('単発ガチャの価格を¥100で表示すること', () => {
    render(<GachaDetailPage gachaId="gacha_001" />)
    expect(screen.getByText('¥100')).toBeInTheDocument()
    expect(screen.queryByText('メダル')).not.toBeInTheDocument()
  })
  
  it('10連ガチャの価格を¥1,000で表示すること', () => {
    render(<GachaDetailPage gachaId="gacha_001" />)
    expect(screen.getByText('¥1,000')).toBeInTheDocument()
  })
})
```

#### TC-F007: 購入ボタン表示修正
```typescript
describe('GachaDetailPage - 購入ボタン', () => {
  it('単発購入ボタンに円価格が表示されること', () => {
    render(<GachaDetailPage gachaId="gacha_001" />)
    expect(screen.getByRole('button', { name: '¥100で購入' })).toBeInTheDocument()
  })
  
  it('10連購入ボタンに円価格が表示されること', () => {
    render(<GachaDetailPage gachaId="gacha_001" />)
    expect(screen.getByRole('button', { name: '¥1,000で10連購入' })).toBeInTheDocument()
  })
})
```

## 2. バックエンド テストケース

### 2.1 PaymentService

#### TC-B001: createPaymentIntent - Stripe決済作成
```typescript
describe('PaymentService.createPaymentIntent', () => {
  it('単発ガチャ用のPaymentIntentが作成されること', async () => {
    // Given: 単発ガチャの決済情報
    const paymentData = {
      amount: 100,
      currency: 'jpy',
      metadata: {
        userId: 'user_123',
        gachaId: 'gacha_001',
        drawCount: 1
      }
    }
    
    // When: PaymentIntentを作成
    const result = await paymentService.createPaymentIntent(paymentData)
    
    // Then: 適切なPaymentIntentが作成される
    expect(result.amount).toBe(100)
    expect(result.currency).toBe('jpy')
    expect(result.metadata.gachaId).toBe('gacha_001')
  })
})
```

#### TC-B002: confirmPayment - 決済確認
```typescript
describe('PaymentService.confirmPayment', () => {
  it('有効なPaymentIntentIDで決済が確認されること', async () => {
    // Given: 有効なPaymentIntentID
    const paymentIntentId = 'pi_test_123'
    
    // When: 決済確認
    const result = await paymentService.confirmPayment(paymentIntentId)
    
    // Then: 決済が成功
    expect(result).toBe(true)
  })
  
  it('無効なPaymentIntentIDで決済が失敗すること', async () => {
    // Given: 無効なPaymentIntentID
    const paymentIntentId = 'pi_invalid'
    
    // When: 決済確認
    const result = await paymentService.confirmPayment(paymentIntentId)
    
    // Then: 決済が失敗
    expect(result).toBe(false)
  })
})
```

### 2.2 GachaService修正

#### TC-B003: executeDraw - 決済確認後の抽選実行
```typescript
describe('GachaService.executeDraw', () => {
  it('決済確認後にガチャ抽選が実行されること', async () => {
    // Given: 確認済みPaymentIntent
    const gachaId = 'gacha_001'
    const count = 1
    const paymentIntentId = 'pi_confirmed_123'
    
    // When: ガチャ抽選実行
    const result = await gachaService.executeDraw(gachaId, count, paymentIntentId)
    
    // Then: 抽選結果が返される
    expect(result.id).toBeDefined()
    expect(result.items).toHaveLength(1)
    expect(result.medalsEarned).toBeGreaterThan(0)
    expect(result.paymentId).toBe(paymentIntentId)
    expect(result.paymentAmount).toBe(100)
  })
})
```

#### TC-B004: executeDraw - 未確認決済での抽選拒否
```typescript
describe('GachaService.executeDraw - 未確認決済', () => {
  it('未確認のPaymentIntentでは抽選が実行されないこと', async () => {
    // Given: 未確認PaymentIntent
    const paymentIntentId = 'pi_unconfirmed_123'
    
    // When/Then: 抽選実行が拒否される
    await expect(
      gachaService.executeDraw('gacha_001', 1, paymentIntentId)
    ).rejects.toThrow('決済が確認できません')
  })
})
```

## 3. API テストケース

### 3.1 ガチャ購入API

#### TC-A001: POST /api/gacha/purchase - 成功ケース
```typescript
describe('POST /api/gacha/purchase', () => {
  it('有効なリクエストでPaymentIntentが作成されること', async () => {
    // Given: 有効なリクエスト
    const requestBody = {
      gachaId: 'gacha_001',
      drawCount: 1,
      paymentMethodId: 'pm_test_123'
    }
    
    // When: API呼び出し
    const response = await request(app)
      .post('/api/gacha/purchase')
      .send(requestBody)
      .expect(200)
    
    // Then: PaymentIntentが返される
    expect(response.body.paymentIntentId).toBeDefined()
    expect(response.body.clientSecret).toBeDefined()
    expect(response.body.amount).toBe(100)
    expect(response.body.currency).toBe('jpy')
  })
})
```

#### TC-A002: POST /api/gacha/purchase - 無効なdrawCount
```typescript
describe('POST /api/gacha/purchase - バリデーション', () => {
  it('無効なdrawCountでエラーが返されること', async () => {
    // Given: 無効なdrawCount
    const requestBody = {
      gachaId: 'gacha_001',
      drawCount: 5, // 1または10のみ有効
      paymentMethodId: 'pm_test_123'
    }
    
    // When/Then: バリデーションエラー
    const response = await request(app)
      .post('/api/gacha/purchase')
      .send(requestBody)
      .expect(400)
    
    expect(response.body.error).toBe('drawCountは1または10である必要があります')
  })
})
```

### 3.2 ガチャ抽選API修正

#### TC-A003: POST /api/gacha/draw - PaymentIntentID必須
```typescript
describe('POST /api/gacha/draw', () => {
  it('paymentIntentIdが必須であること', async () => {
    // Given: paymentIntentIdなしのリクエスト
    const requestBody = {
      gachaId: 'gacha_001',
      drawCount: 1
      // paymentIntentId: 不足
    }
    
    // When/Then: バリデーションエラー
    const response = await request(app)
      .post('/api/gacha/draw')
      .send(requestBody)
      .expect(400)
    
    expect(response.body.error).toBe('paymentIntentIdは必須です')
  })
})
```

#### TC-A004: POST /api/gacha/draw - メダル獲得情報含む
```typescript
describe('POST /api/gacha/draw - レスポンス', () => {
  it('レスポンスにメダル獲得情報が含まれること', async () => {
    // Given: 有効なリクエスト
    const requestBody = {
      gachaId: 'gacha_001',
      drawCount: 1,
      paymentIntentId: 'pi_confirmed_123'
    }
    
    // When: API呼び出し
    const response = await request(app)
      .post('/api/gacha/draw')
      .send(requestBody)
      .expect(200)
    
    // Then: メダル獲得情報が含まれる
    expect(response.body.medalsEarned).toBeDefined()
    expect(response.body.paymentAmount).toBe(100)
    expect(response.body.drawId).toBeDefined()
    expect(response.body.items).toHaveLength(1)
  })
})
```

## 4. 統合テストケース

### 4.1 決済→抽選→メダル付与フロー

#### TC-I001: 完全な購入フロー
```typescript
describe('完全な購入フロー', () => {
  it('決済から抽選、メダル付与まで正常に完了すること', async () => {
    // Phase 1: PaymentIntent作成
    const purchaseResponse = await request(app)
      .post('/api/gacha/purchase')
      .send({
        gachaId: 'gacha_001',
        drawCount: 1,
        paymentMethodId: 'pm_test_123'
      })
      .expect(200)
    
    const paymentIntentId = purchaseResponse.body.paymentIntentId
    
    // Phase 2: 決済確認（Stripeシミュレーション）
    await paymentService.confirmPayment(paymentIntentId)
    
    // Phase 3: ガチャ抽選
    const drawResponse = await request(app)
      .post('/api/gacha/draw')
      .send({
        gachaId: 'gacha_001',
        drawCount: 1,
        paymentIntentId
      })
      .expect(200)
    
    // Phase 4: メダル残高確認
    const medalResponse = await request(app)
      .get('/api/medals/balance')
      .expect(200)
    
    // Then: 全フローが正常に完了
    expect(drawResponse.body.medalsEarned).toBeGreaterThan(0)
    expect(medalResponse.body.availableMedals).toBeGreaterThan(0)
  })
})
```

### 4.2 エラーハンドリング統合テスト

#### TC-I002: 決済失敗時のロールバック
```typescript
describe('決済失敗時のロールバック', () => {
  it('決済失敗時にガチャが実行されないこと', async () => {
    // Given: 決済が失敗する設定
    mockStripe.paymentIntents.confirm.mockRejectedValue(
      new Error('カードが拒否されました')
    )
    
    // When: ガチャ購入を試行
    const drawPromise = gachaService.executeDraw('gacha_001', 1, 'pi_failed')
    
    // Then: 抽選が実行されない
    await expect(drawPromise).rejects.toThrow('決済が確認できません')
    
    // データベースにdraw記録が作成されないこと
    const drawRecord = await db.gacha_draws.findOne({ payment_intent_id: 'pi_failed' })
    expect(drawRecord).toBeNull()
  })
})
```

## 5. E2Eテストケース

### 5.1 ユーザー視点での購入フロー

#### TC-E001: 単発ガチャ購入フロー
```typescript
describe('E2E: 単発ガチャ購入', () => {
  it('ユーザーが単発ガチャを購入できること', async () => {
    // Given: ガチャ詳細ページにアクセス
    await page.goto('/gacha/gacha_001')
    
    // When: 単発購入ボタンをクリック
    await page.click('button:has-text("¥100で購入")')
    
    // Stripe決済画面で決済情報入力
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')
    await page.click('button:has-text("決済する")')
    
    // 抽選アニメーション待機
    await page.waitForSelector('[data-testid="gacha-result"]')
    
    // Then: 結果が表示される
    const result = await page.textContent('[data-testid="gacha-result"]')
    expect(result).toContain('獲得メダル')
    
    // メダル残高が増加していること
    const medalBalance = await page.textContent('[data-testid="medal-balance"]')
    expect(parseInt(medalBalance)).toBeGreaterThan(0)
  })
})
```

#### TC-E002: 10連ガチャ購入フロー
```typescript
describe('E2E: 10連ガチャ購入', () => {
  it('ユーザーが10連ガチャを購入できること', async () => {
    await page.goto('/gacha/gacha_001')
    
    await page.click('button:has-text("¥1,000で10連購入")')
    
    // 決済処理（省略）
    
    await page.waitForSelector('[data-testid="gacha-results"]')
    
    const items = await page.$$('[data-testid="gacha-item"]')
    expect(items).toHaveLength(10)
  })
})
```

## 6. パフォーマンステスト

### 6.1 決済処理性能

#### TC-P001: 決済処理時間
```typescript
describe('決済処理性能', () => {
  it('決済処理が3秒以内に完了すること', async () => {
    const startTime = Date.now()
    
    await gachaService.executeDraw('gacha_001', 1, 'pi_test_123')
    
    const elapsedTime = Date.now() - startTime
    expect(elapsedTime).toBeLessThan(3000)
  })
})
```

## 7. セキュリティテスト

### 7.1 重複決済防止

#### TC-S001: 冪等性確認
```typescript
describe('重複決済防止', () => {
  it('同一PaymentIntentで重複抽選が防止されること', async () => {
    const paymentIntentId = 'pi_test_123'
    
    // 1回目の抽選実行
    await gachaService.executeDraw('gacha_001', 1, paymentIntentId)
    
    // 2回目の抽選試行
    await expect(
      gachaService.executeDraw('gacha_001', 1, paymentIntentId)
    ).rejects.toThrow('この決済は既に使用済みです')
  })
})
```

## 8. 受け入れテスト条件

### 8.1 必須機能
- [ ] ガチャが100円/1000円で直接購入できる
- [ ] 決済完了後に自動で抽選が実行される  
- [ ] 抽選結果としてメダルが付与される
- [ ] メダルは購入できない（ガチャ結果のみ）
- [ ] 獲得メダルは交換所で使用できる

### 8.2 非機能要件
- [ ] 決済処理は3秒以内に完了
- [ ] 重複決済が防止される
- [ ] エラー時に適切なメッセージが表示される

### 8.3 UI/UX要件
- [ ] 価格が円で表示される
- [ ] 購入ボタンに円価格が表示される
- [ ] 決済フローが直感的に理解できる