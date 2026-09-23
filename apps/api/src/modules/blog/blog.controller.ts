import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth.types';
import { BlogService } from './blog.service';

@ApiTags('blog')
@Controller()
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get('blog/posts')
  @ApiOperation({ summary: 'Yayindaki yazilar' })
  findPublished(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blog.findPublished({
      category,
      q,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Public()
  @Get('blog/categories')
  @ApiOperation({ summary: 'Yazisi olan kategoriler' })
  categories() {
    return this.blog.categories();
  }

  @Public()
  @Get('blog/posts/:slug')
  @ApiOperation({ summary: 'Yazi detayi' })
  findBySlug(@Param('slug') slug: string) {
    return this.blog.findBySlug(slug);
  }

  // ── Admin ──

  @Get('admin/blog/posts')
  @Roles('ADMIN')
  findAllAdmin(@Query('status') status?: string, @Query('q') q?: string) {
    return this.blog.findAllAdmin({ status, q });
  }

  @Get('admin/blog/posts/:id')
  @Roles('ADMIN')
  findOneAdmin(@Param('id') id: string) {
    return this.blog.findOneAdmin(id);
  }

  @Post('admin/blog/posts')
  @Roles('ADMIN')
  createPost(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.blog.createPost(body, user.id);
  }

  @Patch('admin/blog/posts/:id')
  @Roles('ADMIN')
  updatePost(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.blog.updatePost(id, body);
  }

  @Delete('admin/blog/posts/:id')
  @Roles('ADMIN')
  removePost(@Param('id') id: string) {
    return this.blog.removePost(id);
  }

  @Post('admin/blog/categories')
  @Roles('ADMIN')
  createCategory(
    @Body() body: { slug: string; name: string; icon?: string; sortOrder?: number },
  ) {
    return this.blog.createCategory(body);
  }

  @Patch('admin/blog/categories/:id')
  @Roles('ADMIN')
  updateCategory(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.blog.updateCategory(id, body);
  }

  @Delete('admin/blog/categories/:id')
  @Roles('ADMIN')
  removeCategory(@Param('id') id: string) {
    return this.blog.removeCategory(id);
  }
}
