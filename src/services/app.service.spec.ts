import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'path';
import { Piscina } from 'piscina';

const mockPiscinaRun = jest.fn().mockResolvedValue({});

jest.mock('fs');
jest.mock('piscina', () => {
  return {
    Piscina: jest.fn().mockImplementation(() => ({
      run: mockPiscinaRun,
    })),
  };
});
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => jest.requireActual('path').join(...args)),
  parse: jest.fn((filePath) => jest.requireActual('path').parse(filePath)),
}));

describe('AppService', () => {
  let service: AppService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-video.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    destination: '/tmp',
    filename: 'random-hash',
    path: '/tmp/random-hash',
    size: 123456,
    stream: null,
    buffer: null,
  };
  const mockResolution = '640x480';
  const outputDir = 'resized-videos';
  const mockParsedPath = { name: 'test-video', ext: '.mp4' };
  const expectedOutputFileName = `${mockParsedPath.name}_${mockResolution}${mockParsedPath.ext}`;
  const expectedOutputPath = path.join(outputDir, expectedOutputFileName);
  const mockFileSize = 98765;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPiscinaRun.mockResolvedValue({});


    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.statSync as jest.Mock).mockReturnValue({ size: mockFileSize });
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
    (path.parse as jest.Mock).mockReturnValue(mockParsedPath);


    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resize', () => {
    it('should create output directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await service.resize(mockFile, mockResolution);
      expect(fs.existsSync).toHaveBeenCalledWith(outputDir);
      expect(fs.mkdirSync).toHaveBeenCalledWith(outputDir);
    });

    it('should not create output directory if it already exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await service.resize(mockFile, mockResolution);
      expect(fs.existsSync).toHaveBeenCalledWith(outputDir);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should call piscina worker with correct parameters', async () => {
      await service.resize(mockFile, mockResolution);
      expect(mockPiscinaRun).toHaveBeenCalledWith({
        filePath: mockFile.path,
        outputPath: expectedOutputPath,
        resolution: mockResolution,
      });
    });

    it('should return the correct file metadata after resizing', async () => {
      const result = await service.resize(mockFile, mockResolution);
    expect(fs.statSync).toHaveBeenCalledWith(expectedOutputPath);
    expect(result).toEqual({
      fieldname: mockFile.fieldname,
      originalname: expectedOutputFileName,
        encoding: mockFile.encoding,
        mimetype: mockFile.mimetype,
        destination: outputDir,
        filename: expectedOutputFileName,
        path: expectedOutputPath,
      size: mockFileSize,
    });
  });

  it('should call deleteOriginalFile with the original file path after resizing', async () => {
    const deleteSpy = jest.spyOn(service, 'deleteOriginalFile');
    await service.resize(mockFile, mockResolution);
    expect(deleteSpy).toHaveBeenCalledWith(mockFile.path);
    deleteSpy.mockRestore();
  });


  it('should handle errors from piscina worker and delete original file', async () => {
    const error = new Error('Worker failed');
    mockPiscinaRun.mockRejectedValue(error);
    const deleteSpy = jest.spyOn(service, 'deleteOriginalFile');

    await expect(service.resize(mockFile, mockResolution)).rejects.toThrow(error);
    expect(deleteSpy).toHaveBeenCalled();
    deleteSpy.mockRestore();
  });

  it('should correctly parse filename and construct output path', async () => {
    await service.resize(mockFile, mockResolution);
    expect(path.parse).toHaveBeenCalledWith(mockFile.originalname);
    expect(mockPiscinaRun).toHaveBeenCalledWith(expect.objectContaining({ outputPath: expectedOutputPath }));
    expect(fs.statSync).toHaveBeenCalledWith(expectedOutputPath);
  });
});

describe('AppService - deleteOriginalFile', () => {
  let service: AppService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();
    service = module.get<AppService>(AppService);
  });

  it('should call fs.unlinkSync with the correct file path', async () => {
    const filePath = '/tmp/some-file-to-delete';
    await service.deleteOriginalFile(filePath);
    expect(fs.unlinkSync).toHaveBeenCalledWith(filePath);
  });

  it('should log an error if fs.unlinkSync fails', async () => {
    const filePath = '/tmp/error-file';
    const error = new Error('Deletion failed');
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {
      throw error;
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await service.deleteOriginalFile(filePath);

    expect(fs.unlinkSync).toHaveBeenCalledWith(filePath);
    expect(consoleErrorSpy).toHaveBeenCalledWith(`Error deleting original file: ${filePath}`, error);

    consoleErrorSpy.mockRestore();
  });
});
});
