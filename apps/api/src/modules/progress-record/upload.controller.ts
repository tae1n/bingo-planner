import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ErrorMessages } from '../../common/constants/error-messages';
import { diskStorage } from 'multer';
import { extname } from 'path';
const imageFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.startsWith('image/')) {
    return callback(new BadRequestException(ErrorMessages.IMAGE_FILES_ONLY), false);
  }
  callback(null, true);
};

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadController {
  @Post('images')
  @ApiOperation({ summary: '이미지 업로드' })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException(ErrorMessages.NO_FILES_TO_UPLOAD);
    }
    const urls = files.map((file) => `/uploads/${file.filename}`);
    return { urls };
  }
}
