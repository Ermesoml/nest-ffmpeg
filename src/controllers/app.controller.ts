import { Body, Controller, Get, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }


  @Post('resize')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('resolution') resolution: string,
    @Res() res: Response,
  ) {
    try {
      const resizedFile = await this.appService.resize(file, resolution);
      res.sendFile(resizedFile.path, {
        headers: {
          'Content-Type': resizedFile.mimetype,
          'Content-Disposition': `attachment; filename="${resizedFile.originalname}"`,
        },
      });
    } catch (error) {
      console.error('Error during resizing:', error);
      return res.status(500).json({ message: 'Failed to resize video.' });
    }
  }
}
