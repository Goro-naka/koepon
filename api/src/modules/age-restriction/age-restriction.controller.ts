import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpStatus,
  HttpException
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AgeRestrictionService } from './age-restriction.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GetUser } from '../auth/get-user.decorator'

@ApiTags('Age Restrictions')
@Controller('age-restrictions')
export class AgeRestrictionController {
  constructor(private readonly ageRestrictionService: AgeRestrictionService) {}

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check all age restrictions for current user' })
  @ApiResponse({ status: 200, description: 'Restrictions checked successfully' })
  async checkRestrictions(
    @GetUser() user: any,
    @Query('amount') amount?: number
  ) {
    try {
      const result = await this.ageRestrictionService.checkAllRestrictions(
        user.id,
        amount ? parseInt(amount.toString()) : undefined
      )

      return {
        success: true,
        data: result
      }
    } catch (error) {
      throw new HttpException(
        `Failed to check restrictions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('spending-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check spending limits for requested amount' })
  @ApiResponse({ status: 200, description: 'Spending limit checked' })
  async checkSpendingLimit(
    @GetUser() user: any,
    @Query('amount') amount: number
  ) {
    try {
      const result = await this.ageRestrictionService.checkSpendingLimit(
        user.id,
        parseInt(amount.toString())
      )

      return {
        success: true,
        data: result
      }
    } catch (error) {
      throw new HttpException(
        `Failed to check spending limit: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('time-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check current time restrictions' })
  @ApiResponse({ status: 200, description: 'Time restrictions checked' })
  async checkTimeRestriction(@GetUser() user: any) {
    try {
      const result = await this.ageRestrictionService.checkTimeRestriction(user.id)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      throw new HttpException(
        `Failed to check time restrictions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('usage-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check continuous usage restrictions' })
  @ApiResponse({ status: 200, description: 'Usage restrictions checked' })
  async checkContinuousUsage(@GetUser() user: any) {
    try {
      const result = await this.ageRestrictionService.checkContinuousUsage(user.id)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      throw new HttpException(
        `Failed to check usage restrictions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('my-restrictions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user age restrictions' })
  @ApiResponse({ status: 200, description: 'Age restrictions retrieved' })
  async getMyRestrictions(@GetUser() user: any) {
    try {
      const restrictions = await this.ageRestrictionService.getUserAgeRestrictions(user.id)

      return {
        success: true,
        data: restrictions
      }
    } catch (error) {
      throw new HttpException(
        `Failed to get age restrictions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('record-spending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record spending transaction' })
  @ApiResponse({ status: 201, description: 'Spending recorded successfully' })
  async recordSpending(
    @GetUser() user: any,
    @Body() body: { amount: number; description: string }
  ) {
    try {
      // まず制限チェック
      const restrictionCheck = await this.ageRestrictionService.checkSpendingLimit(
        user.id,
        body.amount
      )

      if (!restrictionCheck.allowed) {
        return {
          success: false,
          error: 'SPENDING_LIMIT_EXCEEDED',
          message: restrictionCheck.reason,
          currentUsage: restrictionCheck.currentUsage
        }
      }

      // 制限クリアの場合、支出を記録
      await this.ageRestrictionService.recordSpending(
        user.id,
        body.amount,
        body.description
      )

      return {
        success: true,
        message: 'Spending recorded successfully',
        currentUsage: restrictionCheck.currentUsage
      }
    } catch (error) {
      throw new HttpException(
        `Failed to record spending: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('start-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start user session' })
  @ApiResponse({ status: 201, description: 'Session started successfully' })
  async startSession(@GetUser() user: any) {
    try {
      // 時間制限チェック
      const timeCheck = await this.ageRestrictionService.checkTimeRestriction(user.id)
      if (!timeCheck.allowed) {
        return {
          success: false,
          error: 'TIME_RESTRICTION',
          message: timeCheck.reason,
          allowedHours: timeCheck.allowedHours
        }
      }

      const sessionId = await this.ageRestrictionService.startSession(user.id)

      return {
        success: true,
        sessionId,
        message: 'Session started successfully'
      }
    } catch (error) {
      throw new HttpException(
        `Failed to start session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('end-session/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End user session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async endSession(@Param('sessionId') sessionId: string) {
    try {
      await this.ageRestrictionService.endSession(sessionId)

      return {
        success: true,
        message: 'Session ended successfully'
      }
    } catch (error) {
      throw new HttpException(
        `Failed to end session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('request-parental-consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request parental consent for minor user' })
  @ApiResponse({ status: 201, description: 'Parental consent request sent' })
  async requestParentalConsent(
    @GetUser() user: any,
    @Body() body: { 
      parentEmail: string
      childName: string
      childAge: number
    }
  ) {
    try {
      await this.ageRestrictionService.sendParentalConsentRequest(
        body.parentEmail,
        {
          userId: user.id,
          name: body.childName,
          age: body.childAge
        }
      )

      return {
        success: true,
        message: 'Parental consent request sent successfully'
      }
    } catch (error) {
      throw new HttpException(
        `Failed to send parental consent request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('process-parental-consent')
  @ApiOperation({ summary: 'Process parental consent response' })
  @ApiResponse({ status: 200, description: 'Parental consent processed' })
  async processParentalConsent(
    @Body() body: {
      token: string
      agrees: boolean
      customRestrictions?: {
        monthlySpendingLimit?: number
        dailySpendingLimit?: number
        timeRestrictions?: {
          weekdays?: { start: string; end: string }
          weekends?: { start: string; end: string }
        }
        requiredBreaks?: {
          continuous?: number
          daily?: number
        }
      }
    }
  ) {
    try {
      await this.ageRestrictionService.processParentalConsent(
        body.token,
        {
          agrees: body.agrees,
          customRestrictions: body.customRestrictions
        }
      )

      return {
        success: true,
        message: body.agrees 
          ? 'Parental consent granted successfully'
          : 'Parental consent denied'
      }
    } catch (error) {
      throw new HttpException(
        `Failed to process parental consent: ${error.message}`,
        HttpStatus.BAD_REQUEST
      )
    }
  }

  @Get('parental-consent-form/:token')
  @ApiOperation({ summary: 'Get parental consent form data' })
  @ApiResponse({ status: 200, description: 'Consent form data retrieved' })
  async getConsentFormData(@Param('token') token: string) {
    try {
      // トークンからコンセントデータを取得（実装省略）
      // 実際の実装では、Supabaseから該当するコンセントトークンの情報を取得

      return {
        success: true,
        data: {
          childName: 'Sample Child',
          childAge: 15,
          requestedServices: [
            'ガチャシステム利用',
            '推しメダル交換',
            'ユーザー間コミュニケーション'
          ],
          defaultRestrictions: {
            monthlySpendingLimit: 5000,
            dailySpendingLimit: 1000,
            timeRestrictions: {
              weekdays: { start: '06:00', end: '22:00' },
              weekends: { start: '06:00', end: '23:00' }
            }
          }
        }
      }
    } catch (error) {
      throw new HttpException(
        `Failed to get consent form data: ${error.message}`,
        HttpStatus.BAD_REQUEST
      )
    }
  }

  @Get('calculate-age')
  @ApiOperation({ summary: 'Calculate age from birth date' })
  @ApiResponse({ status: 200, description: 'Age calculated successfully' })
  async calculateAge(@Query('birthDate') birthDate: string) {
    try {
      const age = this.ageRestrictionService.calculateAge(birthDate)
      const restrictions = this.ageRestrictionService.getAgeRestrictions(age)

      return {
        success: true,
        data: {
          age,
          restrictions,
          requiresParentalConsent: age < 18,
          isMinor: age < 20
        }
      }
    } catch (error) {
      throw new HttpException(
        `Failed to calculate age: ${error.message}`,
        HttpStatus.BAD_REQUEST
      )
    }
  }
}