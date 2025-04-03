import { Body, Controller, Get, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';

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
    const resizedFile = await this.appService.resize(file, resolution);
    const filePath = path.join(process.cwd(), resizedFile.path);
    res.sendFile(filePath, {
      headers: {
        'Content-Type': resizedFile.mimetype,
        'Content-Disposition': `attachment; filename="${resizedFile.originalname}"`,
      },
    });
  }
}
