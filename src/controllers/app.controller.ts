import { Body, Controller, Post, Res, UploadedFile, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import { FileMinSizeValidationPipe } from 'src/pipes/fileMinSizeValidationPipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('resize')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 1000000000 }), // 1GB
        new FileTypeValidator({ fileType: 'video/*' }),
      ],
    }), new FileMinSizeValidationPipe()) file: Express.Multer.File,
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
