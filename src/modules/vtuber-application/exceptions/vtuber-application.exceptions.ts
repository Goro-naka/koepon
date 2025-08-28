import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export class DuplicateApplicationException extends ConflictException {
  constructor(userId: string) {
    super(`User ${userId} already has an active application`, 'DUPLICATE_APPLICATION');
  }
}

export class ApplicationNotFoundException extends NotFoundException {
  constructor(applicationId: string) {
    super(`Application with ID ${applicationId} not found`, 'APPLICATION_NOT_FOUND');
  }
}

export class InvalidApplicationDataException extends BadRequestException {
  constructor(reason: string) {
    super(`Invalid application data: ${reason}`, 'INVALID_APPLICATION_DATA');
  }
}

export class ApplicationDeadlineExceededException extends BadRequestException {
  constructor(applicationId: string) {
    super(`Application ${applicationId} deadline exceeded`, 'APPLICATION_DEADLINE_EXCEEDED');
  }
}

export class InsufficientApplicationDataException extends BadRequestException {
  constructor(missingFields: string[]) {
    super(`Missing required fields: ${missingFields.join(', ')}`, 'INSUFFICIENT_APPLICATION_DATA');
  }
}

export class ReviewNotFoundException extends NotFoundException {
  constructor(reviewId: string) {
    super(`Review with ID ${reviewId} not found`, 'REVIEW_NOT_FOUND');
  }
}

export class ReviewerNotAssignedException extends BadRequestException {
  constructor(applicationId: string) {
    super(`No reviewer assigned to application ${applicationId}`, 'REVIEWER_NOT_ASSIGNED');
  }
}

export class ReviewDeadlineExceededException extends BadRequestException {
  constructor(reviewId: string) {
    super(`Review ${reviewId} deadline exceeded`, 'REVIEW_DEADLINE_EXCEEDED');
  }
}

export class InvalidReviewDecisionException extends BadRequestException {
  constructor(decision: string) {
    super(`Invalid review decision: ${decision}`, 'INVALID_REVIEW_DECISION');
  }
}

export class ReviewConflictException extends ConflictException {
  constructor(reviewId: string) {
    super(`Review ${reviewId} has conflicts`, 'REVIEW_CONFLICT');
  }
}

export class NotificationSendFailedException extends BadRequestException {
  constructor(reason: string) {
    super(`Notification send failed: ${reason}`, 'NOTIFICATION_SEND_FAILED');
  }
}

export class DocumentUploadFailedException extends BadRequestException {
  constructor(reason: string) {
    super(`Document upload failed: ${reason}`, 'DOCUMENT_UPLOAD_FAILED');
  }
}

export class ReviewAssignmentFailedException extends BadRequestException {
  constructor(reason: string) {
    super(`Review assignment failed: ${reason}`, 'REVIEW_ASSIGNMENT_FAILED');
  }
}