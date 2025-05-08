import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class UploadFileDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Operator ID' })
  operatorId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'File name' })
  fileName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'File MIME type' })
  mimetype: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Citizen ID associated with the file' })
  idCitizen: string;

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
  @IsString()
  idCitizen: string;
}

export class FileNameDTO {
  @IsNotEmpty()
  @IsString()
  fileName: string;
}
