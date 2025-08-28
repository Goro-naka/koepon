import { Injectable } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'

interface AgeRestrictions {
  monthlySpendingLimit: number
  dailySpendingLimit: number
  timeRestrictions: {
    weekdays: { start: string, end: string }
    weekends: { start: string, end: string }
  }
  requiredBreaks: {
    continuous: number // minutes
    daily: number // minutes
  }
}

interface SpendingUsage {
  daily: number
  monthly: number
  lastUpdated: Date
}

@Injectable()
export class AgeRestrictionService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  /**
   * ユーザーの年齢を計算
   */
  calculateAge(birthDate: string): number {
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

  /**
   * 年齢に基づく制限設定を取得
   */
  getAgeRestrictions(age: number): AgeRestrictions | null {
    if (age >= 18) {
      return null // 成人は制限なし
    }

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

  /**
   * 年齢制限をデータベースに保存
   */
  async saveAgeRestrictions(userId: string, restrictions: AgeRestrictions): Promise<void> {
    const { error } = await this.supabase
      .from('user_age_restrictions')
      .upsert({
        user_id: userId,
        monthly_spending_limit: restrictions.monthlySpendingLimit,
        daily_spending_limit: restrictions.dailySpendingLimit,
        time_restrictions: restrictions.timeRestrictions,
        required_breaks: restrictions.requiredBreaks,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to save age restrictions: ${error.message}`)
    }
  }

  /**
   * ユーザーの年齢制限を取得
   */
  async getUserAgeRestrictions(userId: string): Promise<AgeRestrictions | null> {
    const { data, error } = await this.supabase
      .from('user_age_restrictions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw new Error(`Failed to get age restrictions: ${error.message}`)
    }

    if (!data) {
      return null
    }

    return {
      monthlySpendingLimit: data.monthly_spending_limit,
      dailySpendingLimit: data.daily_spending_limit,
      timeRestrictions: data.time_restrictions,
      requiredBreaks: data.required_breaks
    }
  }

  /**
   * 利用制限チェック: 支出制限
   */
  async checkSpendingLimit(
    userId: string,
    requestedAmount: number
  ): Promise<{
    allowed: boolean
    reason?: string
    currentUsage?: SpendingUsage
  }> {
    const restrictions = await this.getUserAgeRestrictions(userId)
    
    if (!restrictions) {
      return { allowed: true } // 制限なし
    }

    const currentUsage = await this.getSpendingUsage(userId)

    // 日次制限チェック
    if (currentUsage.daily + requestedAmount > restrictions.dailySpendingLimit) {
      return {
        allowed: false,
        reason: `1日の利用上限（${restrictions.dailySpendingLimit.toLocaleString()}円）を超過します`,
        currentUsage
      }
    }

    // 月次制限チェック
    if (currentUsage.monthly + requestedAmount > restrictions.monthlySpendingLimit) {
      return {
        allowed: false,
        reason: `1ヶ月の利用上限（${restrictions.monthlySpendingLimit.toLocaleString()}円）を超過します`,
        currentUsage
      }
    }

    return { allowed: true, currentUsage }
  }

  /**
   * 利用制限チェック: 時間制限
   */
  async checkTimeRestriction(userId: string): Promise<{
    allowed: boolean
    reason?: string
    allowedHours?: { start: string, end: string }
  }> {
    const restrictions = await this.getUserAgeRestrictions(userId)
    
    if (!restrictions) {
      return { allowed: true }
    }

    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const isWeekend = now.getDay() === 0 || now.getDay() === 6

    const timeRestrictions = isWeekend 
      ? restrictions.timeRestrictions.weekends
      : restrictions.timeRestrictions.weekdays

    const startTime = this.parseTime(timeRestrictions.start)
    const endTime = this.parseTime(timeRestrictions.end)

    if (currentTime < startTime || currentTime > endTime) {
      return {
        allowed: false,
        reason: `利用時間外です。利用可能時間: ${timeRestrictions.start}-${timeRestrictions.end}`,
        allowedHours: timeRestrictions
      }
    }

    return { allowed: true }
  }

  /**
   * 利用制限チェック: 連続使用制限
   */
  async checkContinuousUsage(userId: string): Promise<{
    allowed: boolean
    reason?: string
    suggestedBreak?: number
  }> {
    const restrictions = await this.getUserAgeRestrictions(userId)
    
    if (!restrictions) {
      return { allowed: true }
    }

    const session = await this.getCurrentSession(userId)
    
    if (!session) {
      return { allowed: true }
    }

    const continuousMinutes = Math.floor(
      (Date.now() - new Date(session.start_time).getTime()) / (1000 * 60)
    )

    if (continuousMinutes >= restrictions.requiredBreaks.continuous) {
      return {
        allowed: false,
        reason: `連続利用時間上限（${restrictions.requiredBreaks.continuous}分）に達しました`,
        suggestedBreak: 15 // 15分休憩を推奨
      }
    }

    return { allowed: true }
  }

  /**
   * 包括的な制限チェック
   */
  async checkAllRestrictions(
    userId: string,
    requestedAmount?: number
  ): Promise<{
    allowed: boolean
    violations: string[]
    currentUsage?: SpendingUsage
  }> {
    const violations: string[] = []

    // 時間制限チェック
    const timeCheck = await this.checkTimeRestriction(userId)
    if (!timeCheck.allowed && timeCheck.reason) {
      violations.push(timeCheck.reason)
    }

    // 連続使用制限チェック
    const continuousCheck = await this.checkContinuousUsage(userId)
    if (!continuousCheck.allowed && continuousCheck.reason) {
      violations.push(continuousCheck.reason)
    }

    let currentUsage: SpendingUsage | undefined

    // 支出制限チェック（金額が指定されている場合）
    if (requestedAmount !== undefined) {
      const spendingCheck = await this.checkSpendingLimit(userId, requestedAmount)
      if (!spendingCheck.allowed && spendingCheck.reason) {
        violations.push(spendingCheck.reason)
      }
      currentUsage = spendingCheck.currentUsage
    }

    return {
      allowed: violations.length === 0,
      violations,
      currentUsage
    }
  }

  /**
   * 支出記録の追加
   */
  async recordSpending(
    userId: string,
    amount: number,
    description: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('user_spending_history')
      .insert({
        user_id: userId,
        amount,
        description,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to record spending: ${error.message}`)
    }
  }

  /**
   * セッション開始記録
   */
  async startSession(userId: string): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}`

    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        start_time: new Date().toISOString(),
        is_active: true
      })

    if (error) {
      throw new Error(`Failed to start session: ${error.message}`)
    }

    return sessionId
  }

  /**
   * セッション終了
   */
  async endSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        end_time: new Date().toISOString(),
        is_active: false
      })
      .eq('id', sessionId)

    if (error) {
      throw new Error(`Failed to end session: ${error.message}`)
    }
  }

  /**
   * 親権者同意の送信
   */
  async sendParentalConsentRequest(
    parentEmail: string,
    childInfo: {
      userId: string
      name: string
      age: number
    }
  ): Promise<void> {
    const consentToken = this.generateConsentToken()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7) // 7日間有効

    // 同意トークンをDBに保存
    const { error: tokenError } = await this.supabase
      .from('parental_consent_tokens')
      .insert({
        token: consentToken,
        parent_email: parentEmail,
        child_user_id: childInfo.userId,
        child_name: childInfo.name,
        child_age: childInfo.age,
        expires_at: expiryDate.toISOString(),
        created_at: new Date().toISOString()
      })

    if (tokenError) {
      throw new Error(`Failed to save consent token: ${tokenError.message}`)
    }

    // メール送信（実装は省略、SendGrid等を使用）
    await this.sendConsentEmail(parentEmail, childInfo, consentToken)
  }

  /**
   * 親権者同意の処理
   */
  async processParentalConsent(
    token: string,
    consentData: {
      agrees: boolean
      customRestrictions?: Partial<AgeRestrictions>
    }
  ): Promise<void> {
    // トークンの確認
    const { data: tokenData, error: tokenError } = await this.supabase
      .from('parental_consent_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      throw new Error('Invalid consent token')
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Consent token has expired')
    }

    const { child_user_id: childUserId, child_age: childAge } = tokenData

    if (consentData.agrees) {
      // デフォルトの年齢制限を取得
      const defaultRestrictions = this.getAgeRestrictions(childAge)
      
      // カスタム制限がある場合は適用
      const finalRestrictions = {
        ...defaultRestrictions!,
        ...consentData.customRestrictions
      }

      // 制限を保存
      await this.saveAgeRestrictions(childUserId, finalRestrictions)

      // アカウントを有効化
      await this.activateChildAccount(childUserId)
    } else {
      // アカウントを無効化
      await this.deactivateChildAccount(childUserId)
    }

    // 同意トークンを無効化
    const { error: updateError } = await this.supabase
      .from('parental_consent_tokens')
      .update({ is_used: true, processed_at: new Date().toISOString() })
      .eq('token', token)

    if (updateError) {
      console.error('Failed to invalidate consent token:', updateError)
    }
  }

  // Private helper methods

  private async getSpendingUsage(userId: string): Promise<SpendingUsage> {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM

    // 日次利用額
    const { data: dailySpending } = await this.supabase
      .from('user_spending_history')
      .select('amount')
      .eq('user_id', userId)
      .gte('transaction_date', today)
      .lt('transaction_date', `${today}T23:59:59.999Z`)

    // 月次利用額
    const { data: monthlySpending } = await this.supabase
      .from('user_spending_history')
      .select('amount')
      .eq('user_id', userId)
      .gte('transaction_date', `${currentMonth}-01`)
      .lt('transaction_date', `${currentMonth}-31T23:59:59.999Z`)

    return {
      daily: dailySpending?.reduce((sum, record) => sum + record.amount, 0) || 0,
      monthly: monthlySpending?.reduce((sum, record) => sum + record.amount, 0) || 0,
      lastUpdated: new Date()
    }
  }

  private async getCurrentSession(userId: string): Promise<any> {
    const { data } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    return data
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 100 + minutes
  }

  private generateConsentToken(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  private async sendConsentEmail(
    parentEmail: string,
    childInfo: { name: string; age: number },
    token: string
  ): Promise<void> {
    // 実際の実装ではSendGrid、Amazon SES等を使用
    console.log(`Sending parental consent email to ${parentEmail} for child ${childInfo.name} (${childInfo.age}y) with token ${token}`)
  }

  private async activateChildAccount(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ 
        is_active: true,
        parental_consent_given: true,
        consent_received_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to activate child account: ${error.message}`)
    }
  }

  private async deactivateChildAccount(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ 
        is_active: false,
        parental_consent_given: false
      })
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to deactivate child account: ${error.message}`)
    }
  }
}