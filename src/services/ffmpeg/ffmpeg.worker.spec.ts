import ffmpegResize from './ffmpeg.worker'; // Import the default export
import * as fluentffmpeg from 'fluent-ffmpeg';

const mockFfmpeg = {
  output: jest.fn().mockReturnThis(),
  size: jest.fn().mockReturnThis(),
  on: jest.fn().mockImplementation(function (event, callback) {
    if (event === 'end') {
      this._endCallback = callback;
    } else if (event === 'error') {
      this._errorCallback = callback;
    }
    return this;
  }),
  run: jest.fn().mockImplementation(function () {
    if (this._shouldError) {
        if (this._errorCallback) {
            this._errorCallback(new Error('ffmpeg error'));
        }
    } else {
        if (this._endCallback) {
            this._endCallback();
        }
    }
  }),
  _endCallback: null,
  _errorCallback: null,
  _shouldError: false,
};

jest.mock('fluent-ffmpeg', () => {
  const mockConstructor = jest.fn(() => mockFfmpeg);
  const mockSetFfmpegPath = jest.fn();

  const mock = mockConstructor;
  (mock as any).setFfmpegPath = mockSetFfmpegPath;
  return mock;
});

jest.mock('@ffmpeg-installer/ffmpeg', () => ({
  path: '/mock/ffmpeg/path',
}));


describe('ffmpegResize Worker', () => {
  const mockArgs = {
    filePath: 'input/video.mp4',
    outputPath: 'output/video_resized.mp4',
    resolution: '640x480',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFfmpeg._endCallback = null;
    mockFfmpeg._errorCallback = null;
    mockFfmpeg._shouldError = false;
    const mockedFfmpeg = fluentffmpeg as jest.Mock;
    const mockedSetPath = (fluentffmpeg as any).setFfmpegPath as jest.Mock;

    mockedFfmpeg.mockClear();
    mockedSetPath.mockClear();
    mockedFfmpeg.mockImplementation(() => mockFfmpeg);
  });

  it('should call fluent-ffmpeg with the input file path', async () => {
    await ffmpegResize(mockArgs);
    expect(fluentffmpeg).toHaveBeenCalledWith(mockArgs.filePath);
  });

  it('should set the output path and resolution', async () => {
    await ffmpegResize(mockArgs);
    expect(mockFfmpeg.output).toHaveBeenCalledWith(mockArgs.outputPath);
    expect(mockFfmpeg.size).toHaveBeenCalledWith(mockArgs.resolution);
  });

  it('should register "end" and "error" event handlers', async () => {
    await ffmpegResize(mockArgs);
    expect(mockFfmpeg.on).toHaveBeenCalledWith('end', expect.any(Function));
    expect(mockFfmpeg.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should call run()', async () => {
    await ffmpegResize(mockArgs);
    expect(mockFfmpeg.run).toHaveBeenCalled();
  });

  it('should resolve the promise on ffmpeg "end" event', async () => {
    await expect(ffmpegResize(mockArgs)).resolves.toEqual({});
  });

  it('should reject the promise on ffmpeg "error" event', async () => {
     mockFfmpeg._shouldError = true;

    await expect(ffmpegResize(mockArgs)).rejects.toThrow('ffmpeg error');
     expect(mockFfmpeg.on).toHaveBeenCalledWith('error', expect.any(Function));

  });

   it('should call setFfmpegPath on initialization', () => {
    jest.resetModules();

    const fluentffmpegFresh = require('fluent-ffmpeg');
    require('./ffmpeg.worker');

    expect((fluentffmpegFresh as any).setFfmpegPath).toHaveBeenCalledWith('/mock/ffmpeg/path');
  });
});
