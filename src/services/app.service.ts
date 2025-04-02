import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import * as fluentffmpeg from 'fluent-ffmpeg';
fluentffmpeg.setFfmpegPath(ffmpegPath);


@Injectable()
export class AppService {
  async resize(file: Express.Multer.File, resolution: string): Promise<any> {
    const { originalname, path: filePath } = file;
    const outputDir = 'resized-videos';

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const { name: fileNameWithoutExtension, ext: fileExtension } = path.parse(originalname);
    const outputFileName = `${fileNameWithoutExtension}_${resolution}${fileExtension}`;
    const outputPath = path.join(outputDir, outputFileName);

    return new Promise((resolve, reject) => {
      fluentffmpeg(filePath)
        .output(outputPath)
        .size(resolution)
        .on('end', () => {
          resolve({
            fieldname: file.fieldname,
            originalname: outputFileName,
            encoding: file.encoding,
            mimetype: file.mimetype,
            destination: outputDir,
            filename: outputFileName,
            path: outputPath,
            size: fs.statSync(outputPath).size,
          });
        })
        .on('error', (err) => {
          console.error('ffmpeg error:', err);
          reject(err);
        })
        .run();
    });
  }
}
