import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  RawBody,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { RefundService } from './services/refund.service';
import { WebhookService } from './services/webhook.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RefundRequestDto } from './dto/refund-request.dto';
import { PaymentHistoryQueryDto } from './dto/payment-history-query.dto';
import { PaymentNotFoundException } from './exceptions/payment.exceptions';

@ApiTags('Payment')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
    private readonly webhookService: WebhookService
  ) {}

  @Get('gachas')
  @ApiOperation({ summary: 'Get available gachas' })
  @ApiResponse({ status: 200, description: 'Gachas retrieved successfully' })
  async getGachas() {
    return this.paymentService.getGachas();
  }

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for gacha purchase' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntent(
    @Request() req,
    @Body(ValidationPipe) createPaymentIntentDto: CreatePaymentIntentDto
  ) {
    return this.paymentService.createPaymentIntent(
      req.user.sub,
      createPaymentIntentDto
    );
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment completion' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async confirmPayment(
    @Request() req,
    @Body(ValidationPipe) confirmPaymentDto: ConfirmPaymentDto
  ) {
    return this.paymentService.confirmPayment(
      req.user.sub,
      confirmPaymentDto
    );
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'] })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO format)' })
  async getPaymentHistory(
    @Request() req,
    @Query(ValidationPipe) query: PaymentHistoryQueryDto
  ) {
    return this.paymentService.getPaymentHistory(
      req.user.sub,
      query
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentDetails(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const payment = await this.paymentService.getPaymentById(id);
    if (!payment || payment.userId !== req.user.sub) {
      throw new PaymentNotFoundException('Payment not found');
    }
    return payment;
  }

  @Post('refunds/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request refund for payment' })
  @ApiResponse({ status: 201, description: 'Refund request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async requestRefund(
    @Request() req,
    @Body(ValidationPipe) refundRequestDto: RefundRequestDto
  ) {
    return this.paymentService.requestRefund(
      req.user.sub,
      refundRequestDto
    );
  }

  @Get('refunds/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get refund details by ID' })
  @ApiResponse({ status: 200, description: 'Refund details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRefundDetails(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const refund = await this.refundService.getRefundById(id);
    if (!refund || refund.userId !== req.user.sub) {
      throw new PaymentNotFoundException('Refund not found');
    }
    return refund;
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 403, description: 'Invalid webhook signature' })
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer
  ) {
    return this.webhookService.handleWebhookEvent(
      rawBody.toString(),
      signature
    );
  }
}