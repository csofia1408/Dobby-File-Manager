import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumberString,
  IsOptional,
  IsBoolean,
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

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indicates if the file is signed',
    default: false,
  })
  isSign?: boolean;
}

export class IdCitizenDTO {
  @IsNotEmpty()
  @IsNumberString()
  idCitizen: string;
}
