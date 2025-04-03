
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileMinSizeValidationPipe implements PipeTransform {
  constructor(private readonly minSize: number = 1024) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    if (value.size < this.minSize) {
      throw new BadRequestException(`Validation failed: File size should be more than ${this.minSize / 1024} KB`);
    }

    return value;
  }
}