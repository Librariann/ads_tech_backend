import { IsNotEmpty, IsString } from 'class-validator';

export class OAuthHandoffDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
