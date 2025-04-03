import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { Piscina } from 'piscina';


@Injectable()
export class AppService {
  private fibonacciWorkerPiscina = new Piscina({
    filename: path.join(__dirname, '/ffmpeg/ffmpeg.worker.js'),
  });

  async resize(file: Express.Multer.File, resolution: string): Promise<any> {
    const { originalname, path: filePath } = file;
    const outputDir = 'resized-videos';

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const { name: fileNameWithoutExtension, ext: fileExtension } = path.parse(originalname);
    const outputFileName = `${fileNameWithoutExtension}_${resolution}${fileExtension}`;
    const outputPath = path.join(outputDir, outputFileName);

    const { fieldname, encoding, mimetype } = file

    await this.fibonacciWorkerPiscina.run({
      filePath,
      outputPath,
      resolution
    })

    return {
      fieldname,
      originalname: outputFileName,
      encoding,
      mimetype,
      destination: outputDir,
      filename: outputFileName,
      path: outputPath,
      size: fs.statSync(outputPath).size,
    }
  }
}
