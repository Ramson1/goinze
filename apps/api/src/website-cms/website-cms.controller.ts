import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { SessionUser } from '@goinze/shared-types';
import { WebsiteCmsService } from './website-cms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('website')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebsiteCmsController {
  constructor(private readonly websiteCmsService: WebsiteCmsService) {}

  // ---- Website content ----
  @Public()
  @Get('content')
  listContent(@Query('schoolId') schoolId?: string) {
    return this.websiteCmsService.listContent(schoolId ?? null);
  }

  @Post('content')
  @Roles('SCHOOL_ADMIN')
  upsertContent(
    @CurrentUser() user: SessionUser,
    @Body() data: { key: string; title?: string; body?: any },
  ) {
    return this.websiteCmsService.upsertContent(user.schoolId, data);
  }

  // ---- News ----
  @Public()
  @Get('news')
  listNews(@Query('schoolId') schoolId?: string) {
    return this.websiteCmsService.listNews(schoolId ?? null, true);
  }

  @Get('news/manage')
  @Roles('SCHOOL_ADMIN')
  listAllNews(@CurrentUser() user: SessionUser) {
    return this.websiteCmsService.listNews(user.schoolId, false);
  }

  @Public()
  @Get('news/:slug')
  getNews(@Param('slug') slug: string, @Query('schoolId') schoolId?: string) {
    return this.websiteCmsService.getNewsBySlug(schoolId ?? null, slug);
  }

  @Patch('news/:id/publish')
  @Roles('SCHOOL_ADMIN')
  setNewsPublished(
    @Param('id') id: string,
    @Body() data: { published: boolean },
  ) {
    return this.websiteCmsService.setNewsPublished(id, data.published);
  }

  @Post('news')
  @Roles('SCHOOL_ADMIN')
  createNews(
    @CurrentUser() user: SessionUser,
    @Body()
    data: {
      title: string;
      body: string;
      category?: string;
      excerpt?: string;
      coverUrl?: string;
      published?: boolean;
    },
  ) {
    return this.websiteCmsService.createNews(user.schoolId, data);
  }

  // ---- Events ----
  @Public()
  @Get('events')
  listEvents(@Query('schoolId') schoolId?: string) {
    return this.websiteCmsService.listEvents(schoolId ?? null);
  }

  @Post('events')
  @Roles('SCHOOL_ADMIN')
  createEvent(
    @CurrentUser() user: SessionUser,
    @Body()
    data: {
      title: string;
      description?: string;
      location?: string;
      startsAt: string;
      endsAt?: string;
      coverUrl?: string;
    },
  ) {
    return this.websiteCmsService.createEvent(user.schoolId, data);
  }

  // ---- Gallery ----
  @Public()
  @Get('gallery')
  listGallery(
    @Query('schoolId') schoolId?: string,
    @Query('album') album?: string,
  ) {
    return this.websiteCmsService.listGallery(schoolId ?? null, album);
  }

  @Post('gallery')
  @Roles('SCHOOL_ADMIN')
  createGalleryItem(
    @CurrentUser() user: SessionUser,
    @Body() data: { url: string; type?: string; caption?: string; album?: string },
  ) {
    return this.websiteCmsService.createGalleryItem(user.schoolId, data);
  }

  // ---- Media upload ----

  @Post('upload')
  @Roles('SCHOOL_ADMIN')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      return { error: 'No file provided' };
    }
    const result = await this.websiteCmsService.uploadMedia(file.buffer);
    return { url: result.url, publicId: result.publicId };
  }
}
