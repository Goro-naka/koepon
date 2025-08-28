# TASK-202: 決済システム実装 - テストケース

## 実装日時
- 開始日時: 2025-08-25T05:30:00Z
- テストケース作成日時: 2025-08-25T05:35:00Z
- タスクID: TASK-202

## テストケース概要

決済システムの品質を保証するため、以下の4つのテストレベルでテストケースを実装する：

1. **単体テスト (Unit Tests)** - 個別クラス・メソッドのテスト
2. **統合テスト (Integration Tests)** - システム間連携のテスト  
3. **E2Eテスト (End-to-End Tests)** - ユーザーフローのテスト
4. **パフォーマンステスト (Performance Tests)** - 性能要件の検証

## 1. 単体テスト (Unit Tests)

### 1.1 PaymentService テスト

#### createPaymentIntent()
```typescript
describe('PaymentService.createPaymentIntent', () => {
  it('should create payment intent with valid medal package', async () => {
    // Given: 有効なメダルパッケージID
    const request = {
      medalPackageId: '100-medals',
      paymentMethod: 'card'
    };

    // When: PaymentIntent作成
    const result = await paymentService.createPaymentIntent(userId, request);

    // Then: 正常に作成される
    expect(result).toHaveProperty('clientSecret');
    expect(result).toHaveProperty('paymentIntentId');
    expect(result.amount).toBe(120);
    expect(result.medalAmount).toBe(100);
  });

  it('should throw error for invalid medal package', async () => {
    // Given: 無効なメダルパッケージID
    const request = {
      medalPackageId: 'invalid-package',
      paymentMethod: 'card'
    };

    // When & Then: エラーが発生
    await expect(paymentService.createPaymentIntent(userId, request))
      .rejects.toThrow('Invalid medal package');
  });

  it('should generate unique idempotency key', async () => {
    // Given: 複数のリクエスト
    const request = {
      medalPackageId: '500-medals',
      paymentMethod: 'card'
    };

    // When: 複数回実行
    const result1 = await paymentService.createPaymentIntent(userId, request);
    const result2 = await paymentService.createPaymentIntent(userId, request);

    // Then: 異なるIdempotency Keyが生成される
    expect(result1.paymentIntentId).not.toBe(result2.paymentIntentId);
  });

  it('should handle Stripe API error', async () => {
    // Given: Stripe APIエラー
    mockStripeService.paymentIntents.create.mockRejectedValue(
      new StripeError('API connection failed')
    );

    // When & Then: 適切なエラーが発生
    await expect(paymentService.createPaymentIntent(userId, validRequest))
      .rejects.toThrow('Payment service temporarily unavailable');
  });
});
```

#### confirmPayment()
```typescript
describe('PaymentService.confirmPayment', () => {
  it('should confirm payment successfully', async () => {
    // Given: 有効なPaymentIntent
    const request = {
      paymentIntentId: 'pi_test_12345',
      idempotencyKey: 'idem_12345'
    };

    // When: 決済確認
    const result = await paymentService.confirmPayment(userId, request);

    // Then: 決済が確認される
    expect(result.success).toBe(true);
    expect(result.paymentId).toBeDefined();
    expect(result.medalBalance).toBeGreaterThan(0);
  });

  it('should handle duplicate confirmation with idempotency key', async () => {
    // Given: 同じIdempotency Key
    const request = {
      paymentIntentId: 'pi_test_12345',
      idempotencyKey: 'idem_duplicate'
    };

    // When: 重複確認実行
    const result1 = await paymentService.confirmPayment(userId, request);
    const result2 = await paymentService.confirmPayment(userId, request);

    // Then: 同じ結果が返される
    expect(result1.paymentId).toBe(result2.paymentId);
    expect(mockDatabase.insertPayment).toHaveBeenCalledTimes(1);
  });

  it('should throw error for failed payment', async () => {
    // Given: 失敗したPaymentIntent
    mockStripeService.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_test_failed',
      status: 'requires_payment_method',
      last_payment_error: { message: 'Card declined' }
    });

    // When & Then: エラーが発生
    await expect(paymentService.confirmPayment(userId, request))
      .rejects.toThrow('Payment failed: Card declined');
  });

  it('should update medal balance after successful payment', async () => {
    // Given: 成功した決済
    const initialBalance = await userService.getMedalBalance(userId);
    const medalAmount = 500;

    // When: 決済確認
    await paymentService.confirmPayment(userId, validRequest);

    // Then: メダル残高が更新される
    const updatedBalance = await userService.getMedalBalance(userId);
    expect(updatedBalance).toBe(initialBalance + medalAmount);
  });
});
```

### 1.2 WebhookService テスト

#### handleWebhookEvent()
```typescript
describe('WebhookService.handleWebhookEvent', () => {
  it('should verify Stripe signature', async () => {
    // Given: 有効な署名
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const signature = generateValidSignature(payload);

    // When: Webhook処理
    const result = await webhookService.handleWebhookEvent(payload, signature);

    // Then: 署名が検証される
    expect(result.verified).toBe(true);
  });

  it('should reject invalid signature', async () => {
    // Given: 無効な署名
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const invalidSignature = 'invalid_signature';

    // When & Then: エラーが発生
    await expect(webhookService.handleWebhookEvent(payload, invalidSignature))
      .rejects.toThrow('Invalid webhook signature');
  });

  it('should handle payment_intent.succeeded event', async () => {
    // Given: 成功イベント
    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_12345',
          amount: 12000,
          metadata: { user_id: userId, medal_amount: '1200' }
        }
      }
    };

    // When: イベント処理
    await webhookService.handleWebhookEvent(JSON.stringify(event), validSignature);

    // Then: 決済が完了状態に更新される
    expect(mockDatabase.updatePaymentStatus).toHaveBeenCalledWith(
      'pi_test_12345',
      'completed'
    );
  });

  it('should handle payment_intent.payment_failed event', async () => {
    // Given: 失敗イベント
    const event = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test_failed',
          last_payment_error: { message: 'Insufficient funds' }
        }
      }
    };

    // When: イベント処理
    await webhookService.handleWebhookEvent(JSON.stringify(event), validSignature);

    // Then: 決済が失敗状態に更新される
    expect(mockDatabase.updatePaymentStatus).toHaveBeenCalledWith(
      'pi_test_failed',
      'failed',
      'Insufficient funds'
    );
  });

  it('should handle duplicate webhook events idempotently', async () => {
    // Given: 重複イベント
    const eventId = 'evt_test_12345';
    const event = {
      id: eventId,
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_12345' } }
    };

    // When: 同じイベントを複数回処理
    await webhookService.handleWebhookEvent(JSON.stringify(event), validSignature);
    await webhookService.handleWebhookEvent(JSON.stringify(event), validSignature);

    // Then: 1回のみ処理される
    expect(mockDatabase.updatePaymentStatus).toHaveBeenCalledTimes(1);
  });
});
```

### 1.3 IdempotencyService テスト

#### checkIdempotency()
```typescript
describe('IdempotencyService.checkIdempotency', () => {
  it('should generate unique idempotency key', () => {
    // When: 複数のキー生成
    const key1 = idempotencyService.generateKey();
    const key2 = idempotencyService.generateKey();

    // Then: 異なるキーが生成される
    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should cache idempotency key in Redis', async () => {
    // Given: Idempotency Key
    const key = 'idem_test_12345';
    const data = { paymentId: 'pay_12345' };

    // When: キャッシュ保存
    await idempotencyService.setCache(key, data);

    // Then: Redisに保存される
    expect(mockRedis.setex).toHaveBeenCalledWith(
      key,
      24 * 60 * 60, // 24時間
      JSON.stringify(data)
    );
  });

  it('should retrieve cached data', async () => {
    // Given: キャッシュされたデータ
    const key = 'idem_test_12345';
    const cachedData = { paymentId: 'pay_12345' };
    mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

    // When: データ取得
    const result = await idempotencyService.getCache(key);

    // Then: キャッシュデータが返される
    expect(result).toEqual(cachedData);
  });

  it('should return null for non-existent key', async () => {
    // Given: 存在しないキー
    mockRedis.get.mockResolvedValue(null);

    // When: データ取得
    const result = await idempotencyService.getCache('non_existent');

    // Then: nullが返される
    expect(result).toBeNull();
  });
});
```

### 1.4 RefundService テスト

#### requestRefund()
```typescript
describe('RefundService.requestRefund', () => {
  it('should create refund request', async () => {
    // Given: 有効な決済ID
    const request = {
      paymentId: 'pay_12345',
      reason: 'Customer request',
      amount: 12000
    };

    // When: 返金申請
    const result = await refundService.requestRefund(userId, request);

    // Then: 返金申請が作成される
    expect(result.refundId).toBeDefined();
    expect(result.status).toBe('pending');
  });

  it('should throw error for already refunded payment', async () => {
    // Given: 既に返金済みの決済
    mockDatabase.getPayment.mockResolvedValue({
      id: 'pay_12345',
      status: 'refunded'
    });

    // When & Then: エラーが発生
    await expect(refundService.requestRefund(userId, request))
      .rejects.toThrow('Payment already refunded');
  });

  it('should validate refund amount', async () => {
    // Given: 決済金額を超える返金額
    const request = {
      paymentId: 'pay_12345',
      reason: 'Partial refund',
      amount: 15000 // 決済額12000円を超える
    };

    // When & Then: エラーが発生
    await expect(refundService.requestRefund(userId, request))
      .rejects.toThrow('Refund amount exceeds payment amount');
  });
});

describe('RefundService.processRefund', () => {
  it('should process approved refund', async () => {
    // Given: 承認された返金申請
    const refundId = 'ref_12345';
    mockDatabase.getRefund.mockResolvedValue({
      id: refundId,
      status: 'approved',
      amount: 12000,
      paymentId: 'pay_12345'
    });

    // When: 返金処理実行
    await refundService.processRefund(refundId, adminUserId);

    // Then: Stripe返金が実行される
    expect(mockStripeService.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_test_12345',
      amount: 12000
    });
  });

  it('should update medal balance after refund', async () => {
    // Given: 返金処理
    const medalAmount = 1200;
    const initialBalance = 5000;
    mockUserService.getMedalBalance.mockResolvedValue(initialBalance);

    // When: 返金処理
    await refundService.processRefund(refundId, adminUserId);

    // Then: メダル残高が減算される
    expect(mockUserService.updateMedalBalance).toHaveBeenCalledWith(
      userId,
      initialBalance - medalAmount
    );
  });
});
```

## 2. 統合テスト (Integration Tests)

### 2.1 決済フロー統合テスト

```typescript
describe('Payment Flow Integration', () => {
  it('should complete full payment flow', async () => {
    // Given: ユーザーログイン状態
    const authToken = await testHelper.getAuthToken(testUser);

    // Step 1: PaymentIntent作成
    const createResponse = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        medalPackageId: '1200-medals',
        paymentMethod: 'card'
      })
      .expect(201);

    expect(createResponse.body.data).toHaveProperty('clientSecret');
    expect(createResponse.body.data.medalAmount).toBe(1200);

    // Step 2: Stripeでの決済実行 (テスト環境)
    const paymentIntentId = createResponse.body.data.paymentIntentId;
    await testHelper.simulateStripePayment(paymentIntentId, 'succeeded');

    // Step 3: Webhook受信シミュレーション
    const webhookPayload = testHelper.createWebhookPayload(
      'payment_intent.succeeded',
      paymentIntentId
    );
    const webhookSignature = testHelper.generateWebhookSignature(webhookPayload);

    await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', webhookSignature)
      .send(webhookPayload)
      .expect(200);

    // Step 4: 決済確認
    const confirmResponse = await request(app)
      .post('/api/v1/payments/confirm')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentIntentId,
        idempotencyKey: createResponse.body.data.idempotencyKey
      })
      .expect(200);

    // Then: メダル残高が更新される
    expect(confirmResponse.body.data.success).toBe(true);
    expect(confirmResponse.body.data.medalBalance).toBeGreaterThan(0);

    // Verify: データベース状態確認
    const payment = await testHelper.getPayment(paymentIntentId);
    expect(payment.status).toBe('completed');
    expect(payment.medal_amount).toBe(1200);
  });

  it('should handle payment failure flow', async () => {
    // Given: 決済失敗シナリオ
    const authToken = await testHelper.getAuthToken(testUser);

    // Step 1: PaymentIntent作成
    const createResponse = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ medalPackageId: '500-medals' })
      .expect(201);

    // Step 2: 決済失敗シミュレーション
    const paymentIntentId = createResponse.body.data.paymentIntentId;
    await testHelper.simulateStripePayment(paymentIntentId, 'failed');

    // Step 3: 失敗Webhook受信
    const webhookPayload = testHelper.createWebhookPayload(
      'payment_intent.payment_failed',
      paymentIntentId,
      { error: 'card_declined' }
    );

    await request(app)
      .post('/api/v1/payments/webhook')
      .send(webhookPayload)
      .expect(200);

    // Then: 決済が失敗状態になる
    const payment = await testHelper.getPayment(paymentIntentId);
    expect(payment.status).toBe('failed');
    expect(payment.failure_reason).toContain('card_declined');
  });

  it('should prevent duplicate payments with idempotency key', async () => {
    // Given: 同じIdempotency Key
    const authToken = await testHelper.getAuthToken(testUser);
    const idempotencyKey = 'test-duplicate-key';

    // When: 同じキーで複数回決済実行
    const response1 = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ medalPackageId: '100-medals' });

    const response2 = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ medalPackageId: '100-medals' });

    // Then: 同じレスポンスが返される
    expect(response1.body.data.paymentIntentId)
      .toBe(response2.body.data.paymentIntentId);

    // Verify: データベースに1件のみ作成
    const payments = await testHelper.getPaymentsByUser(testUser.id);
    const duplicatePayments = payments.filter(p => 
      p.idempotency_key === idempotencyKey
    );
    expect(duplicatePayments.length).toBe(1);
  });
});
```

### 2.2 返金フロー統合テスト

```typescript
describe('Refund Flow Integration', () => {
  it('should complete full refund flow', async () => {
    // Setup: 完了済み決済を作成
    const payment = await testHelper.createCompletedPayment(testUser, {
      amount: 12000,
      medal_amount: 1200
    });

    const authToken = await testHelper.getAuthToken(testUser);

    // Step 1: 返金申請
    const refundResponse = await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentId: payment.id,
        reason: 'Product not as described',
        amount: 12000
      })
      .expect(201);

    const refundId = refundResponse.body.data.refundId;

    // Step 2: 管理者承認
    const adminToken = await testHelper.getAuthToken(testAdmin);
    await request(app)
      .post(`/api/v1/admin/refunds/${refundId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Step 3: 返金処理実行
    await request(app)
      .post(`/api/v1/admin/refunds/${refundId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Then: 返金が完了する
    const refund = await testHelper.getRefund(refundId);
    expect(refund.status).toBe('completed');

    // Verify: メダル残高から減算
    const updatedUser = await testHelper.getUser(testUser.id);
    expect(updatedUser.medal_balance).toBe(
      testUser.medal_balance - payment.medal_amount
    );
  });

  it('should handle partial refund', async () => {
    // Given: 部分返金申請
    const payment = await testHelper.createCompletedPayment(testUser, {
      amount: 12000,
      medal_amount: 1200
    });

    const partialAmount = 6000;
    const partialMedals = 600;

    // When: 部分返金実行
    const refundResponse = await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${await testHelper.getAuthToken(testUser)}`)
      .send({
        paymentId: payment.id,
        reason: 'Partial refund request',
        amount: partialAmount
      })
      .expect(201);

    // Process refund
    await testHelper.approveAndProcessRefund(refundResponse.body.data.refundId);

    // Then: 部分的にメダルが減算される
    const updatedUser = await testHelper.getUser(testUser.id);
    expect(updatedUser.medal_balance).toBe(
      testUser.medal_balance - partialMedals
    );

    // Payment remains partially refunded
    const updatedPayment = await testHelper.getPayment(payment.id);
    expect(updatedPayment.status).toBe('partially_refunded');
  });
});
```

## 3. E2Eテスト (End-to-End Tests)

### 3.1 決済フロー E2E

```typescript
describe('Payment E2E Tests', () => {
  it('should complete medal purchase flow', async () => {
    // Given: ログイン済みユーザー
    await page.goto('/login');
    await testHelper.loginUser(page, testUser);

    // Step 1: ガチャページへ移動
    await page.goto('/gacha');
    await page.waitForSelector('[data-testid="gacha-list"]');

    // Step 2: メダル不足でガチャ実行失敗
    await page.click('[data-testid="gacha-item"]:first-child [data-testid="draw-button"]');
    await page.waitForSelector('[data-testid="insufficient-medals-modal"]');
    
    // Step 3: メダル購入ページへ
    await page.click('[data-testid="buy-medals-button"]');
    await page.waitForURL('/payments/medals');

    // Step 4: メダルパッケージ選択
    await page.click('[data-testid="medal-package-1200"]');
    await page.waitForSelector('[data-testid="stripe-payment-element"]');

    // Step 5: 決済情報入力
    const stripeFrame = page.frameLocator('[data-testid="stripe-payment-element"] iframe');
    await stripeFrame.fill('[data-elements-stable-field-name="cardNumber"]', '4242424242424242');
    await stripeFrame.fill('[data-elements-stable-field-name="cardExpiry"]', '12/30');
    await stripeFrame.fill('[data-elements-stable-field-name="cardCvc"]', '123');

    // Step 6: 決済実行
    await page.click('[data-testid="pay-button"]');

    // Step 7: 決済完了確認
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 10000 });
    
    const successMessage = await page.textContent('[data-testid="payment-success-message"]');
    expect(successMessage).toContain('1,200メダルを獲得しました');

    // Step 8: メダル残高確認
    const medalBalance = await page.textContent('[data-testid="medal-balance"]');
    expect(medalBalance).toContain('1,200');

    // Step 9: ガチャページに戻って抽選実行
    await page.goto('/gacha');
    await page.click('[data-testid="gacha-item"]:first-child [data-testid="draw-button"]');
    
    // 今度は正常に抽選が実行される
    await page.waitForSelector('[data-testid="gacha-result"]', { timeout: 5000 });
    const result = await page.textContent('[data-testid="gacha-result-item"]');
    expect(result).toBeTruthy();
  });

  it('should handle payment failure gracefully', async () => {
    // Given: ログイン済みユーザー
    await testHelper.loginUser(page, testUser);
    await page.goto('/payments/medals');

    // Step 1: メダルパッケージ選択
    await page.click('[data-testid="medal-package-500"]');

    // Step 2: 決済失敗カード番号入力
    const stripeFrame = page.frameLocator('[data-testid="stripe-payment-element"] iframe');
    await stripeFrame.fill('[data-elements-stable-field-name="cardNumber"]', '4000000000000002'); // declined card
    await stripeFrame.fill('[data-elements-stable-field-name="cardExpiry"]', '12/30');
    await stripeFrame.fill('[data-elements-stable-field-name="cardCvc"]', '123');

    // Step 3: 決済実行
    await page.click('[data-testid="pay-button"]');

    // Step 4: エラーメッセージ確認
    await page.waitForSelector('[data-testid="payment-error"]');
    const errorMessage = await page.textContent('[data-testid="payment-error-message"]');
    expect(errorMessage).toContain('カードが拒否されました');

    // Step 5: メダル残高が変更されていないことを確認
    const medalBalance = await page.textContent('[data-testid="medal-balance"]');
    expect(medalBalance).toBe('0'); // 初期残高のまま
  });

  it('should prevent double payment on rapid clicks', async () => {
    // Given: 決済準備完了状態
    await testHelper.loginUser(page, testUser);
    await page.goto('/payments/medals');
    await page.click('[data-testid="medal-package-100"]');
    
    // 決済情報入力
    const stripeFrame = page.frameLocator('[data-testid="stripe-payment-element"] iframe');
    await stripeFrame.fill('[data-elements-stable-field-name="cardNumber"]', '4242424242424242');
    await stripeFrame.fill('[data-elements-stable-field-name="cardExpiry"]', '12/30');
    await stripeFrame.fill('[data-elements-stable-field-name="cardCvc"]', '123');

    // When: 連続クリック
    const payButton = page.locator('[data-testid="pay-button"]');
    await Promise.all([
      payButton.click(),
      payButton.click(),
      payButton.click()
    ]);

    // Then: ボタンが無効化される
    await expect(payButton).toBeDisabled();
    
    // 決済は1回のみ実行される
    await page.waitForSelector('[data-testid="payment-success"]');
    
    // データベース確認: 決済レコードが1件のみ
    const payments = await testHelper.getPaymentsByUser(testUser.id);
    expect(payments.length).toBe(1);
  });
});
```

### 3.2 返金フロー E2E

```typescript
describe('Refund E2E Tests', () => {
  it('should complete refund request flow', async () => {
    // Setup: 完了済み決済を作成
    const payment = await testHelper.createCompletedPayment(testUser);

    // Given: ユーザーログイン
    await testHelper.loginUser(page, testUser);
    
    // Step 1: 決済履歴ページ
    await page.goto('/payments/history');
    await page.waitForSelector('[data-testid="payment-history"]');

    // Step 2: 返金申請
    await page.click(`[data-testid="payment-${payment.id}"] [data-testid="refund-button"]`);
    await page.waitForSelector('[data-testid="refund-request-modal"]');

    await page.fill('[data-testid="refund-reason"]', 'Changed my mind');
    await page.click('[data-testid="submit-refund-request"]');

    // Step 3: 申請完了確認
    await page.waitForSelector('[data-testid="refund-request-success"]');
    const message = await page.textContent('[data-testid="success-message"]');
    expect(message).toContain('返金申請を受け付けました');

    // Step 4: 申請状態確認
    await page.reload();
    const status = await page.textContent(`[data-testid="payment-${payment.id}"] [data-testid="status"]`);
    expect(status).toContain('返金申請中');
  });

  it('should show admin refund approval interface', async () => {
    // Setup: 返金申請を作成
    const refund = await testHelper.createRefundRequest(testUser);

    // Given: 管理者ログイン
    await testHelper.loginUser(page, testAdmin);

    // Step 1: 管理者ページ
    await page.goto('/admin/refunds');
    await page.waitForSelector('[data-testid="refund-list"]');

    // Step 2: 返金申請確認
    const refundRow = page.locator(`[data-testid="refund-${refund.id}"]`);
    await expect(refundRow).toContainText(refund.reason);
    await expect(refundRow).toContainText('¥12,000');

    // Step 3: 承認処理
    await page.click(`[data-testid="refund-${refund.id}"] [data-testid="approve-button"]`);
    await page.waitForSelector('[data-testid="confirm-approval-modal"]');
    
    await page.click('[data-testid="confirm-approve"]');
    await page.waitForSelector('[data-testid="approval-success"]');

    // Step 4: ステータス更新確認
    await page.reload();
    const status = await page.textContent(`[data-testid="refund-${refund.id}"] [data-testid="status"]`);
    expect(status).toContain('承認済み');
  });
});
```

## 4. パフォーマンステスト (Performance Tests)

### 4.1 レスポンス時間テスト

```typescript
describe('Payment Performance Tests', () => {
  it('should create payment intent within 2 seconds', async () => {
    // Given: パフォーマンス測定設定
    const authToken = await testHelper.getAuthToken(testUser);
    const startTime = Date.now();

    // When: PaymentIntent作成
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ medalPackageId: '1200-medals' })
      .expect(201);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Then: 2秒以内で完了
    expect(responseTime).toBeLessThan(2000);
    expect(response.body.data).toHaveProperty('clientSecret');
  });

  it('should confirm payment within 3 seconds', async () => {
    // Given: PaymentIntent作成済み
    const paymentIntent = await testHelper.createPaymentIntent(testUser);
    await testHelper.simulateStripePayment(paymentIntent.id, 'succeeded');

    const authToken = await testHelper.getAuthToken(testUser);
    const startTime = Date.now();

    // When: 決済確認
    await request(app)
      .post('/api/v1/payments/confirm')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentIntentId: paymentIntent.id,
        idempotencyKey: 'perf-test-key'
      })
      .expect(200);

    const responseTime = Date.now() - startTime;

    // Then: 3秒以内で完了
    expect(responseTime).toBeLessThan(3000);
  });

  it('should process webhook within 1 second', async () => {
    // Given: Webhookペイロード
    const webhookPayload = testHelper.createWebhookPayload(
      'payment_intent.succeeded',
      'pi_test_perf'
    );
    const signature = testHelper.generateWebhookSignature(webhookPayload);

    const startTime = Date.now();

    // When: Webhook処理
    await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', signature)
      .send(webhookPayload)
      .expect(200);

    const responseTime = Date.now() - startTime;

    // Then: 1秒以内で完了
    expect(responseTime).toBeLessThan(1000);
  });
});
```

### 4.2 負荷テスト

```typescript
describe('Payment Load Tests', () => {
  it('should handle 100 concurrent payment requests', async () => {
    // Given: 100件の同時リクエスト準備
    const concurrency = 100;
    const promises = [];

    for (let i = 0; i < concurrency; i++) {
      const authToken = await testHelper.getAuthToken(testUsers[i]);
      const promise = request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ medalPackageId: '100-medals' });
      
      promises.push(promise);
    }

    const startTime = Date.now();

    // When: 同時実行
    const responses = await Promise.allSettled(promises);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Then: 全て成功し、合理的な時間内で完了
    const successfulResponses = responses.filter(r => 
      r.status === 'fulfilled' && r.value.status === 201
    );

    expect(successfulResponses.length).toBe(concurrency);
    expect(totalTime).toBeLessThan(10000); // 10秒以内
  });

  it('should handle 1000 webhook events per second', async () => {
    // Given: 1000件のWebhookイベント
    const eventCount = 1000;
    const events = [];

    for (let i = 0; i < eventCount; i++) {
      const payload = testHelper.createWebhookPayload(
        'payment_intent.succeeded',
        `pi_load_test_${i}`
      );
      events.push({
        payload,
        signature: testHelper.generateWebhookSignature(payload)
      });
    }

    const startTime = Date.now();

    // When: 並列処理
    const promises = events.map(event =>
      request(app)
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', event.signature)
        .send(event.payload)
    );

    const responses = await Promise.allSettled(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Then: 1秒あたり1000件処理
    const successCount = responses.filter(r => 
      r.status === 'fulfilled' && r.value.status === 200
    ).length;

    expect(successCount).toBe(eventCount);
    expect(totalTime).toBeLessThan(5000); // 5秒以内（1000件/秒の性能）
  });
});
```

## 5. セキュリティテスト

### 5.1 認証・認可テスト

```typescript
describe('Payment Security Tests', () => {
  it('should reject unauthenticated payment requests', async () => {
    // When: 認証なしでリクエスト
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .send({ medalPackageId: '100-medals' })
      .expect(401);

    // Then: 認証エラー
    expect(response.body.error).toContain('Unauthorized');
  });

  it('should reject payment requests with invalid token', async () => {
    // When: 無効なトークンでリクエスト
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', 'Bearer invalid_token')
      .send({ medalPackageId: '100-medals' })
      .expect(401);

    // Then: 認証エラー
    expect(response.body.error).toContain('Invalid token');
  });

  it('should validate webhook signature', async () => {
    // When: 無効な署名でWebhook送信
    const response = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', 'invalid_signature')
      .send({ type: 'payment_intent.succeeded' })
      .expect(403);

    // Then: 署名検証エラー
    expect(response.body.error).toContain('Invalid signature');
  });

  it('should prevent payment amount manipulation', async () => {
    // Given: 有効なトークン
    const authToken = await testHelper.getAuthToken(testUser);

    // When: 不正な金額でリクエスト
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        medalPackageId: '100-medals',
        amount: 1 // サーバーサイドで決まる金額を操作しようとする
      })
      .expect(400);

    // Then: バリデーションエラー
    expect(response.body.error).toContain('Invalid request');
  });
});
```

### 5.2 インジェクション攻撃テスト

```typescript
describe('Payment Injection Tests', () => {
  it('should prevent SQL injection in payment queries', async () => {
    // Given: SQLインジェクション攻撃文字列
    const maliciousInput = "'; DROP TABLE payments; --";
    const authToken = await testHelper.getAuthToken(testUser);

    // When: 悪意のある入力でリクエスト
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        medalPackageId: maliciousInput
      });

    // Then: エラーが返されるがDBは破損しない
    expect(response.status).toBe(400);
    
    // Verify: テーブルが存在することを確認
    const tableExists = await testHelper.checkTableExists('payments');
    expect(tableExists).toBe(true);
  });

  it('should sanitize refund reason input', async () => {
    // Given: XSS攻撃文字列
    const xssInput = '<script>alert("xss")</script>';
    const authToken = await testHelper.getAuthToken(testUser);
    const payment = await testHelper.createCompletedPayment(testUser);

    // When: XSS攻撃文字列を送信
    await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentId: payment.id,
        reason: xssInput
      })
      .expect(201);

    // Then: 保存されたデータがサニタイズされている
    const refund = await testHelper.getLatestRefund(payment.id);
    expect(refund.reason).not.toContain('<script>');
    expect(refund.reason).toContain('&lt;script&gt;'); // HTMLエスケープされている
  });
});
```

## 6. エラーシナリオテスト

### 6.1 ネットワークエラーテスト

```typescript
describe('Payment Network Error Tests', () => {
  it('should handle Stripe API timeout', async () => {
    // Given: Stripe APIタイムアウト設定
    mockStripeService.paymentIntents.create.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 5000)) // 5秒タイムアウト
    );

    const authToken = await testHelper.getAuthToken(testUser);

    // When: タイムアウト発生
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ medalPackageId: '100-medals' })
      .expect(503);

    // Then: 適切なエラーレスポンス
    expect(response.body.error).toContain('Service temporarily unavailable');
  });

  it('should handle database connection failure', async () => {
    // Given: DB接続失敗
    mockDatabase.connection.mockRejectedValue(new Error('Connection failed'));

    const authToken = await testHelper.getAuthToken(testUser);

    // When: DB接続エラー発生
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ medalPackageId: '100-medals' })
      .expect(500);

    // Then: 内部サーバーエラー
    expect(response.body.error).toContain('Internal server error');
  });

  it('should handle Redis connection failure gracefully', async () => {
    // Given: Redis接続失敗
    mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
    mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

    const authToken = await testHelper.getAuthToken(testUser);

    // When: Redis接続エラーでも決済処理継続
    const response = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ medalPackageId: '100-medals' })
      .expect(201);

    // Then: 冪等性チェックなしでも処理が成功
    expect(response.body.data).toHaveProperty('clientSecret');
    
    // Warning: ログに警告が出力される
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Redis unavailable')
    );
  });
});
```

## テスト実行計画

### 実行順序
1. **単体テスト** - 個別機能の動作確認
2. **統合テスト** - システム間連携の確認
3. **E2Eテスト** - ユーザーフローの確認
4. **パフォーマンステスト** - 性能要件の確認
5. **セキュリティテスト** - セキュリティ要件の確認

### カバレッジ目標
- **単体テスト**: 90%以上
- **統合テスト**: 主要フロー100%カバー
- **E2Eテスト**: ユーザーフロー100%カバー

### 実行環境
- **単体・統合テスト**: Jest + TestContainers
- **E2Eテスト**: Playwright + テスト専用環境
- **パフォーマンステスト**: k6 + 負荷テスト環境

これらのテストケースにより、決済システムの品質と信頼性を保証する。