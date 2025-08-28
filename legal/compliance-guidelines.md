# 法的コンプライアンスガイドライン

## 🎯 景品表示法対応

### 1. ガチャシステムの確率表示義務

#### 1.1 表示必須項目
```yaml
ガチャ画面での必須表示項目:
  基本情報:
    - ガチャ名称
    - 1回あたりの料金（円表記必須）
    - 利用可能期間
    
  確率情報:
    - 各レアリティの提供割合（%表記）
    - 個別アイテムの提供割合
    - 最高レア確率の明記
    
  景品価値:
    - 景品の種類・内容
    - 景品総額の上限
    - 最高価格景品の価格
```

#### 1.2 実装例
```typescript
// client/components/gacha/GachaRateDisplay.tsx
interface GachaRateInfo {
  itemName: string
  rarity: 'SSR' | 'SR' | 'R' | 'N'
  probability: number // %表記
  value: number // 円換算価値
}

export const GachaRateDisplay: React.FC<{
  gachaId: string
  cost: number
}> = ({ gachaId, cost }) => {
  return (
    <div className="gacha-rate-display">
      <h3>排出確率・景品内容</h3>
      
      {/* 基本情報 */}
      <div className="basic-info">
        <p>利用料金: {cost}円（税込）</p>
        <p>提供期間: 2024年1月15日 〜 2024年2月15日</p>
      </div>

      {/* 確率表示 */}
      <div className="probability-table">
        <table>
          <thead>
            <tr>
              <th>レアリティ</th>
              <th>確率</th>
              <th>景品価値</th>
              <th>アイテム名</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SSR</td>
              <td>3.0%</td>
              <td>500円相当</td>
              <td>限定推しメダル</td>
            </tr>
            <tr>
              <td>SR</td>
              <td>12.0%</td>
              <td>100円相当</td>
              <td>レア推しメダル</td>
            </tr>
            <tr>
              <td>R</td>
              <td>35.0%</td>
              <td>20円相当</td>
              <td>通常推しメダル</td>
            </tr>
            <tr>
              <td>N</td>
              <td>50.0%</td>
              <td>5円相当</td>
              <td>コモン推しメダル</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 注意事項 */}
      <div className="legal-notice">
        <h4>景品表示法に関する重要事項</h4>
        <ul>
          <li>上記確率は統計的なものであり、個別の結果を保証するものではありません</li>
          <li>景品の価値は当社基準による算定です</li>
          <li>本ガチャは景品表示法第5条第3号（ギャンブル等関係行為）に該当しません</li>
        </ul>
      </div>
    </div>
  )
}
```

### 2. 「コンプリートガチャ」規制対応

#### 2.1 禁止される仕組み
```yaml
禁止事項:
  - 複数種類アイテムを全て集めた場合の特別景品提供
  - 特定の組み合わせを揃えることを条件とする景品提供
  - 段階的に景品のレア度が上がる仕組み

許可される仕組み:
  - 単発ガチャでの確率的景品提供
  - 一定回数利用による固定景品提供（天井システム）
  - 重複アイテムの別アイテムへの変換
```

#### 2.2 安全な実装例
```typescript
// 天井システム（合法）
export const PitySystem = {
  // 100回で確実にSSRを提供（コンプガチャではない）
  checkPityCounter: async (userId: string, gachaId: string) => {
    const counter = await getPityCounter(userId, gachaId)
    if (counter >= 100) {
      return {
        guaranteed: true,
        rarity: 'SSR',
        reason: '天井到達による確定排出'
      }
    }
    return { guaranteed: false }
  }
}

// 重複アイテム交換（合法）
export const DuplicateExchange = {
  exchangeRate: {
    'SSR': 100, // SSR重複 → 100ポイント
    'SR': 20,   // SR重複 → 20ポイント
    'R': 5,     // R重複 → 5ポイント
    'N': 1      // N重複 → 1ポイント
  }
}
```

### 3. 景品価値の上限規制

#### 3.1 景品類の価値制限
```yaml
一般懸賞の場合:
  最高額景品: 取引価額の20倍または10万円のいずれか低い額
  景品類総額: 懸賞参加者総数 × 取引価額の2%

ガチャの場合（購入を条件としない懸賞）:
  最高額景品: 5,000円
  景品類総額: 懸賞参加者 × 100円 または 500万円のいずれか低い額
```

#### 3.2 価値算定基準
```typescript
// legal/prize-value-calculator.ts
export class PrizeValueCalculator {
  // 景品価値の適正性チェック
  validatePrizeValue(
    transactionAmount: number, // 取引価額（ガチャ1回分）
    prizeValue: number, // 景品価値
    prizeType: 'normal' | 'special' // 一般懸賞 or 特別懸賞
  ): {
    isValid: boolean
    maxAllowedValue: number
    reason?: string
  } {
    if (prizeType === 'normal') {
      // 一般懸賞の場合
      const maxValue = Math.min(transactionAmount * 20, 100000)
      return {
        isValid: prizeValue <= maxValue,
        maxAllowedValue: maxValue,
        reason: prizeValue > maxValue ? 
          `景品価値${prizeValue}円が上限${maxValue}円を超過` : undefined
      }
    } else {
      // 特別懸賞（ガチャ等）の場合
      const maxValue = 5000
      return {
        isValid: prizeValue <= maxValue,
        maxAllowedValue: maxValue,
        reason: prizeValue > maxValue ? 
          `景品価値${prizeValue}円が上限5,000円を超過` : undefined
      }
    }
  }
}
```

## 🔒 年齢制限機能実装

### 1. 年齢確認システム

#### 1.1 登録時年齢確認
```typescript
// api/auth/age-verification.ts
interface AgeVerificationRequest {
  birthDate: string // YYYY-MM-DD
  parentalConsent?: boolean
  parentEmail?: string
}

export class AgeVerificationService {
  async verifyAge(request: AgeVerificationRequest) {
    const age = this.calculateAge(request.birthDate)
    
    if (age < 13) {
      return {
        allowed: false,
        reason: '13歳未満のため利用不可',
        requiredAction: 'age_restriction'
      }
    }
    
    if (age < 18) {
      if (!request.parentalConsent || !request.parentEmail) {
        return {
          allowed: false,
          reason: '親権者の同意が必要',
          requiredAction: 'parental_consent'
        }
      }
      
      // 親権者同意メール送信
      await this.sendParentalConsentEmail(request.parentEmail!)
      
      return {
        allowed: true,
        restrictions: this.getMinorRestrictions(age),
        requiresParentalConsent: true
      }
    }
    
    return {
      allowed: true,
      restrictions: null,
      requiresParentalConsent: false
    }
  }

  private calculateAge(birthDate: string): number {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) {
      age--
    }
    
    return age
  }

  private getMinorRestrictions(age: number) {
    if (age < 18) {
      return {
        monthlySpendingLimit: age < 16 ? 5000 : 10000, // 円
        dailySpendingLimit: age < 16 ? 1000 : 2000, // 円
        timeRestrictions: {
          weekdays: { start: '06:00', end: '22:00' },
          weekends: { start: '06:00', end: '23:00' }
        },
        requiredBreaks: {
          continuous: 60, // 60分連続使用で休憩必要
          daily: 180 // 1日最大3時間
        }
      }
    }
    return null
  }
}
```

#### 1.2 親権者同意システム
```typescript
// api/parental-consent.ts
export class ParentalConsentService {
  async sendConsentEmail(parentEmail: string, childInfo: {
    name: string
    age: number
    requestedServices: string[]
  }) {
    const consentToken = this.generateConsentToken()
    
    const emailContent = {
      to: parentEmail,
      subject: '【こえポン！】お子様のサービス利用に関する同意確認',
      html: `
        <h2>お子様のサービス利用同意について</h2>
        <p>お子様（${childInfo.name}様、${childInfo.age}歳）が「こえポン！」のサービス利用を希望されています。</p>
        
        <h3>利用予定サービス</h3>
        <ul>
          ${childInfo.requestedServices.map(service => `<li>${service}</li>`).join('')}
        </ul>
        
        <h3>年齢に応じた制限</h3>
        <ul>
          <li>月額利用上限: ${childInfo.age < 16 ? '5,000円' : '10,000円'}</li>
          <li>1日利用上限: ${childInfo.age < 16 ? '1,000円' : '2,000円'}</li>
          <li>利用時間制限: 平日6:00-22:00、休日6:00-23:00</li>
          <li>連続利用制限: 60分で休憩必要</li>
        </ul>
        
        <p>同意される場合は、以下のリンクをクリックしてください：</p>
        <a href="https://koepon.app/parental-consent?token=${consentToken}">
          同意する
        </a>
        
        <p>同意の有効期限: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
      `
    }
    
    await this.sendEmail(emailContent)
    
    // 同意トークンをDBに保存
    await this.saveConsentToken(consentToken, parentEmail, childInfo)
  }

  async processConsent(token: string, consentData: {
    agrees: boolean
    restrictions?: {
      customSpendingLimit?: number
      customTimeRestrictions?: any
    }
  }) {
    const tokenData = await this.getConsentToken(token)
    
    if (!tokenData || this.isTokenExpired(tokenData)) {
      throw new Error('Invalid or expired consent token')
    }
    
    if (consentData.agrees) {
      // 子アカウントの制限設定更新
      await this.updateChildAccountRestrictions(
        tokenData.childUserId,
        consentData.restrictions
      )
      
      // アカウント有効化
      await this.activateChildAccount(tokenData.childUserId)
    } else {
      // アカウント無効化
      await this.deactivateChildAccount(tokenData.childUserId)
    }
    
    // 処理完了をメール通知
    await this.sendConsentProcessedEmail(tokenData.parentEmail, consentData.agrees)
  }
}
```

### 2. 利用制限エンフォースメント

#### 2.1 リアルタイム制限チェック
```typescript
// middleware/age-restriction.ts
export class AgeRestrictionMiddleware {
  async checkSpendingLimit(
    userId: string,
    requestedAmount: number
  ): Promise<{
    allowed: boolean
    reason?: string
    currentUsage?: {
      daily: number
      monthly: number
    }
  }> {
    const user = await this.getUserWithRestrictions(userId)
    
    if (!user.ageRestrictions) {
      return { allowed: true } // 成人ユーザー
    }
    
    const today = new Date().toDateString()
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    
    // 当日・当月の利用額を取得
    const currentUsage = await this.getSpendingUsage(userId, today, currentMonth)
    
    // 日次制限チェック
    if (currentUsage.daily + requestedAmount > user.ageRestrictions.dailySpendingLimit) {
      return {
        allowed: false,
        reason: `1日の利用上限（${user.ageRestrictions.dailySpendingLimit}円）を超過します`,
        currentUsage
      }
    }
    
    // 月次制限チェック
    if (currentUsage.monthly + requestedAmount > user.ageRestrictions.monthlySpendingLimit) {
      return {
        allowed: false,
        reason: `1ヶ月の利用上限（${user.ageRestrictions.monthlySpendingLimit}円）を超過します`,
        currentUsage
      }
    }
    
    return { allowed: true, currentUsage }
  }

  async checkTimeRestriction(userId: string): Promise<{
    allowed: boolean
    reason?: string
    allowedHours?: { start: string, end: string }
  }> {
    const user = await this.getUserWithRestrictions(userId)
    
    if (!user.ageRestrictions?.timeRestrictions) {
      return { allowed: true }
    }
    
    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    
    const restrictions = isWeekend 
      ? user.ageRestrictions.timeRestrictions.weekends
      : user.ageRestrictions.timeRestrictions.weekdays
    
    const startTime = this.parseTime(restrictions.start)
    const endTime = this.parseTime(restrictions.end)
    
    if (currentTime < startTime || currentTime > endTime) {
      return {
        allowed: false,
        reason: `利用時間外です。利用可能時間: ${restrictions.start}-${restrictions.end}`,
        allowedHours: restrictions
      }
    }
    
    return { allowed: true }
  }

  async checkContinuousUsage(userId: string): Promise<{
    allowed: boolean
    reason?: string
    suggestedBreak?: number // 推奨休憩時間（分）
  }> {
    const user = await this.getUserWithRestrictions(userId)
    
    if (!user.ageRestrictions?.requiredBreaks) {
      return { allowed: true }
    }
    
    const session = await this.getCurrentSession(userId)
    
    if (!session) {
      return { allowed: true }
    }
    
    const continuousMinutes = Math.floor((Date.now() - session.startTime) / (1000 * 60))
    
    if (continuousMinutes >= user.ageRestrictions.requiredBreaks.continuous) {
      return {
        allowed: false,
        reason: `連続利用時間上限（${user.ageRestrictions.requiredBreaks.continuous}分）に達しました`,
        suggestedBreak: 15 // 15分休憩を推奨
      }
    }
    
    return { allowed: true }
  }
}
```

#### 2.2 フロントエンド制限表示
```typescript
// client/components/restrictions/AgeRestrictionNotice.tsx
export const AgeRestrictionNotice: React.FC<{
  userId: string
}> = ({ userId }) => {
  const { data: restrictions } = useAgeRestrictions(userId)
  const { data: currentUsage } = useSpendingUsage(userId)
  
  if (!restrictions) return null
  
  return (
    <div className="age-restriction-notice">
      <h3>🛡️ 利用制限のお知らせ</h3>
      
      {/* 利用可能額 */}
      <div className="spending-limits">
        <h4>利用可能額</h4>
        <div className="usage-bars">
          <div className="daily-usage">
            <label>今日の利用額</label>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ 
                  width: `${(currentUsage.daily / restrictions.dailySpendingLimit) * 100}%` 
                }}
              />
            </div>
            <span>{currentUsage.daily}円 / {restrictions.dailySpendingLimit}円</span>
          </div>
          
          <div className="monthly-usage">
            <label>今月の利用額</label>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ 
                  width: `${(currentUsage.monthly / restrictions.monthlySpendingLimit) * 100}%` 
                }}
              />
            </div>
            <span>{currentUsage.monthly}円 / {restrictions.monthlySpendingLimit}円</span>
          </div>
        </div>
      </div>
      
      {/* 利用時間制限 */}
      <div className="time-restrictions">
        <h4>利用可能時間</h4>
        <p>平日: {restrictions.timeRestrictions.weekdays.start} - {restrictions.timeRestrictions.weekdays.end}</p>
        <p>休日: {restrictions.timeRestrictions.weekends.start} - {restrictions.timeRestrictions.weekends.end}</p>
      </div>
      
      {/* 親権者への連絡 */}
      <div className="parental-contact">
        <h4>制限の変更について</h4>
        <p>利用制限の変更をご希望の場合は、親権者の方から以下にご連絡ください。</p>
        <button onClick={() => requestParentalContact()}>
          親権者に連絡を依頼
        </button>
      </div>
    </div>
  )
}
```

### 3. 定期的な年齢・同意状況確認

```typescript
// cron/age-verification-maintenance.ts
export class AgeVerificationMaintenance {
  // 毎月1日実行: 誕生日による年齢更新
  async updateAgesMonthly() {
    const usersWithBirthdays = await this.getUsersWithRecentBirthdays()
    
    for (const user of usersWithBirthdays) {
      const newAge = this.calculateAge(user.birthDate)
      const oldAge = user.currentAge
      
      if (newAge !== oldAge) {
        await this.updateUserAge(user.id, newAge)
        
        // 18歳になった場合は制限解除
        if (oldAge < 18 && newAge >= 18) {
          await this.removeAgeRestrictions(user.id)
          await this.notifyMajorityReached(user.id)
        }
        
        // 年齢に応じた制限更新
        if (newAge < 18) {
          await this.updateAgeRestrictions(user.id, newAge)
        }
      }
    }
  }
  
  // 毎年1月1日実行: 親権者同意の再確認
  async renewParentalConsents() {
    const minorsRequiringRenewal = await this.getMinorsRequiringConsentRenewal()
    
    for (const user of minorsRequiringRenewal) {
      await this.sendConsentRenewalRequest(user)
    }
  }
}
```

## ⚖️ その他法的コンプライアンス

### 1. 資金決済法対応（前払式支払手段）

#### 1.1 供託義務の管理
```typescript
// compliance/prepaid-fund-management.ts
export class PrepaidFundCompliance {
  // 前払式支払手段発行残高の監視
  async monitorIssuedBalance() {
    const totalIssued = await this.getTotalIssuedPoints()
    const DEPOSIT_THRESHOLD = 10000000 // 1,000万円
    
    if (totalIssued >= DEPOSIT_THRESHOLD) {
      // 供託義務発生
      const requiredDeposit = Math.floor(totalIssued * 0.5) // 発行残高の1/2
      
      await this.notifyDepositRequirement({
        totalIssued,
        requiredDeposit,
        deadline: this.calculateDepositDeadline()
      })
    }
  }
  
  // 未利用期間の管理
  async handleDormantPoints() {
    const dormantThreshold = new Date()
    dormantThreshold.setFullYear(dormantThreshold.getFullYear() - 1) // 1年未使用
    
    const dormantPoints = await this.getDormantPoints(dormantThreshold)
    
    for (const userPoints of dormantPoints) {
      // 利用促進の通知
      await this.sendUsageReminderEmail(userPoints.userId)
      
      // 2年未使用の場合は没収
      const forfeitThreshold = new Date()
      forfeitThreshold.setFullYear(forfeitThreshold.getFullYear() - 2)
      
      if (userPoints.lastUsed < forfeitThreshold) {
        await this.forfeitDormantPoints(userPoints)
      }
    }
  }
}
```

### 2. 特定電子メール法対応

```typescript
// compliance/email-marketing-compliance.ts
export class EmailMarketingCompliance {
  // オプトイン同意の確認
  async sendMarketingEmail(userId: string, emailContent: any) {
    const consent = await this.getMarketingConsent(userId)
    
    if (!consent.hasOptedIn) {
      throw new Error('マーケティングメール配信の同意が得られていません')
    }
    
    // 配信停止リンクの追加
    emailContent.html += this.generateUnsubscribeLink(userId)
    
    await this.sendEmail(emailContent)
    await this.logMarketingEmail(userId, emailContent.subject)
  }
  
  private generateUnsubscribeLink(userId: string): string {
    const unsubscribeToken = this.generateUnsubscribeToken(userId)
    return `
      <hr>
      <p style="font-size: 12px; color: #666;">
        配信停止をご希望の場合は
        <a href="https://koepon.app/unsubscribe?token=${unsubscribeToken}">こちら</a>
        をクリックしてください。
      </p>
    `
  }
}
```

---

**このガイドラインの更新履歴:**
- 2024年1月15日: 初版作成（TASK-506実装）