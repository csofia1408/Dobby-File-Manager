/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class saveDocumentDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: "GovCarpeta's Operator ID" })
  operatorId?: string;

  @IsOptional()
  @IsArray()
  @ApiProperty({ description: 'Document metadata' })
  metadata?: Record<string, string>;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Document title' })
  documentTitle: string;
}

export class DocumentPackageDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: "GovCarpeta's Operator ID" })
  operatorId: string;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    description: 'List of document key that should be in the package',
  })
  keys: Array<string>;
}

export class ValidateDocumentDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: "Document's url to validate" })
  fileUrl: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Document title' })
  documentTitle: string;
}
