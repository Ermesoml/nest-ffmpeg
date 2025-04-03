import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from '../services/app.service';
import { Response } from 'express';
import * as path from 'path';
import { FileMinSizeValidationPipe } from '../pipes/fileMinSizeValidationPipe';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException } from '@nestjs/common';

const mockAppService = {
  resize: jest.fn(),
};

const mockResponse = {
  sendFile: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  headers: {},
};

const mockFile: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'test.mp4',
  encoding: '7bit',
  mimetype: 'video/mp4',
  destination: '/tmp',
  filename: 'abc',
  path: '/tmp/abc',
  size: 100000,
  stream: null,
  buffer: null,
};

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    const resolution = '1280x720';
    const resizedFileInfo = {
      path: 'resized-videos/test_1280x720.mp4',
      mimetype: 'video/mp4',
      originalname: 'test_1280x720.mp4',
    };
    const expectedFilePath = path.join(process.cwd(), resizedFileInfo.path);

    it('should call AppService.resize with the file and resolution', async () => {
      mockAppService.resize.mockResolvedValue(resizedFileInfo);

      await controller.uploadFile(mockFile, resolution, mockResponse as unknown as Response);

      expect(service.resize).toHaveBeenCalledWith(mockFile, resolution);
    });

    it('should call response.sendFile with the correct path and headers', async () => {
      mockAppService.resize.mockResolvedValue(resizedFileInfo);

      await controller.uploadFile(mockFile, resolution, mockResponse as unknown as Response);

      expect(mockResponse.sendFile).toHaveBeenCalledWith(expectedFilePath, {
        headers: {
          'Content-Type': resizedFileInfo.mimetype,
          'Content-Disposition': `attachment; filename="${resizedFileInfo.originalname}"`,
        },
      });
    });

    it('should handle errors from AppService.resize', async () => {
      const error = new Error('Resize failed');
      mockAppService.resize.mockRejectedValue(error);

      await expect(
        controller.uploadFile(mockFile, resolution, mockResponse as unknown as Response)
      ).rejects.toThrow(error);

      expect(mockResponse.sendFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if resolution format is invalid', async () => {
      const invalidResolution = 'invalid-format';
      mockAppService.resize.mockResolvedValue(resizedFileInfo);

      await expect(
        controller.uploadFile(mockFile, invalidResolution, mockResponse as unknown as Response)
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.uploadFile(mockFile, invalidResolution, mockResponse as unknown as Response)
      ).rejects.toThrow('Invalid resolution format. Use format like 640x480');

      expect(service.resize).not.toHaveBeenCalled();
      expect(mockResponse.sendFile).not.toHaveBeenCalled();
    });

    it('should proceed if resolution format is valid', async () => {
       const validResolution = '1920x1080';
       mockAppService.resize.mockResolvedValue({
         ...resizedFileInfo,
         path: `resized-videos/test_${validResolution}.mp4`,
         originalname: `test_${validResolution}.mp4`,
       });
       const expectedValidPath = path.join(process.cwd(), `resized-videos/test_${validResolution}.mp4`);


       await controller.uploadFile(mockFile, validResolution, mockResponse as unknown as Response);

       expect(service.resize).toHaveBeenCalledWith(mockFile, validResolution);
       expect(mockResponse.sendFile).toHaveBeenCalledWith(expectedValidPath, {
         headers: {
           'Content-Type': resizedFileInfo.mimetype,
           'Content-Disposition': `attachment; filename="test_${validResolution}.mp4"`,
         },
       });
    });
  });
});
