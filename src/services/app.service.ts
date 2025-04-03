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

    try {
      await this.fibonacciWorkerPiscina.run({
        filePath,
        outputPath,
        resolution
      });

      const resizedFile = {
        fieldname,
        originalname: outputFileName,
        encoding,
        mimetype,
        destination: outputDir,
        filename: outputFileName,
        path: outputPath,
        size: fs.statSync(outputPath).size,
      }
      await this.deleteOriginalFile(filePath);

      return resizedFile;
    } catch (error) {
      try {
        await this.deleteOriginalFile(filePath);
      } catch (deleteError) {
        console.error(`Error deleting original file after resize failure: ${filePath}`, deleteError);
      }
      throw error;
    }
  }

  async deleteOriginalFile(filePath: string): Promise<void> {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Error deleting original file: ${filePath}`, error);
    }
  }
}
