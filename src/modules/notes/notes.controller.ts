import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteSearchDto } from './dto/note-search.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  async create(@CurrentUser() user: any, @Body() createNoteDto: CreateNoteDto) {
    const note = await this.notesService.create(user.id, createNoteDto);
    return ApiResponseDto.success(note, 'Note created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes with search' })
  async findAll(@CurrentUser() user: any, @Query() query: NoteSearchDto) {
    const notes = await this.notesService.findAll(user.id, query);
    return ApiResponseDto.success(notes);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search notes' })
  async search(@CurrentUser() user: any, @Query('q') query: string) {
    const notes = await this.notesService.search(user.id, query);
    return ApiResponseDto.success(notes);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get note by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') noteId: string) {
    const note = await this.notesService.findOne(user.id, noteId);
    return ApiResponseDto.success(note);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update note' })
  async update(
    @CurrentUser() user: any,
    @Param('id') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    const note = await this.notesService.update(user.id, noteId, updateNoteDto);
    return ApiResponseDto.success(note, 'Note updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete note (soft delete)' })
  async remove(@CurrentUser() user: any, @Param('id') noteId: string) {
    const result = await this.notesService.remove(user.id, noteId);
    return ApiResponseDto.success(result.message);
  }

  @Put(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite status' })
  async toggleFavorite(@CurrentUser() user: any, @Param('id') noteId: string) {
    const note = await this.notesService.toggleFavorite(user.id, noteId);
    return ApiResponseDto.success(note, 'Favorite status toggled');
  }
}