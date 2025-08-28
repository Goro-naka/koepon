import { IsNumber, Max, Min } from 'class-validator';

export class ExecuteExchangeDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number;
}