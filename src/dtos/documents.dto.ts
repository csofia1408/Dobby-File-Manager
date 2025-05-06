/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class UploadFileDTO {
  @IsString()
  @ApiProperty({ description: 'Operator ID' })
  operatorId?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'File name' })
  fileName: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'File MIME type' })
  mimetype: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @IsNotEmpty()
  @ApiProperty({ description: 'Citizen ID associated with the file' })
  idCitizen: number;
}

export class IdCitizenDTO {
  @IsNotEmpty()
  @IsNumberString()
  idCitizen: string;
}
