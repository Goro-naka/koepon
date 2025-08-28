import { HttpException, HttpStatus } from '@nestjs/common';

export class RewardNotFoundException extends HttpException {
  constructor(rewardId: string) {
    super(`Reward with ID ${rewardId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidFileFormatException extends HttpException {
  constructor(mimeType: string) {
    super(`File format ${mimeType} is not supported`, HttpStatus.BAD_REQUEST);
  }
}

export class FileSizeExceededException extends HttpException {
  constructor(actualSize: number, maxSize: number) {
    super(
      `File size ${actualSize} bytes exceeds maximum allowed size ${maxSize} bytes`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class DownloadLimitExceededException extends HttpException {
  constructor(rewardId: string, dailyLimit: number) {
    super(
      `Daily download limit (${dailyLimit}) exceeded for reward ${rewardId}`,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

export class RewardAccessDeniedException extends HttpException {
  constructor(rewardId: string) {
    super(`Access denied to reward ${rewardId}`, HttpStatus.FORBIDDEN);
  }
}

export class VirusScanFailedException extends HttpException {
  constructor(threats: string[]) {
    super(
      `File failed virus scan. Threats detected: ${threats.join(', ')}`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class StorageServiceException extends HttpException {
  constructor(message: string) {
    super(`Storage service error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ExpiredDownloadUrlException extends HttpException {
  constructor() {
    super('Download URL has expired', HttpStatus.GONE);
  }
}