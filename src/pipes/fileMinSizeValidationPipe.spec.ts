import { BadRequestException } from '@nestjs/common';
import { FileMinSizeValidationPipe } from './fileMinSizeValidationPipe';

describe('FileMinSizeValidationPipe', () => {
  let pipe: FileMinSizeValidationPipe;

  beforeEach(() => {
    pipe = new FileMinSizeValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return the value if it is not an object with size property', () => {
    const value = 'not a file object';
    expect(pipe.transform(value, {} as any)).toEqual(value);
  });

  it('should return the value if file size is greater than or equal to the minimum size', () => {
    const value = { size: 2048 };
    expect(pipe.transform(value, {} as any)).toEqual(value);
  });

  it('should throw BadRequestException if file size is less than the minimum size', () => {
    const value = { size: 512 };
    expect(() => pipe.transform(value, {} as any)).toThrow(BadRequestException);
    expect(() => pipe.transform(value, {} as any)).toThrow(
      'Validation failed: File size should be more than 1 KB',
    );
  });

  it('should use the custom minimum size if provided', () => {
    const customMinSize = 4096;
    const customPipe = new FileMinSizeValidationPipe(customMinSize);
    const valueSmall = { size: 2048 };
    const valueLarge = { size: 8192 };

    expect(() => customPipe.transform(valueSmall, {} as any)).toThrow(BadRequestException);
    expect(() => customPipe.transform(valueSmall, {} as any)).toThrow(
      `Validation failed: File size should be more than ${customMinSize / 1024} KB`,
    );
    expect(customPipe.transform(valueLarge, {} as any)).toEqual(valueLarge);
  });

  it('should return value if value is null or undefined', () => {
    expect(pipe.transform(null, {} as any)).toBeNull();
    expect(pipe.transform(undefined, {} as any)).toBeUndefined();
  });
});
