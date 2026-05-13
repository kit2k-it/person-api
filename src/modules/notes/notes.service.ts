import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteSearchDto } from './dto/note-search.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createNoteDto: CreateNoteDto) {
    // Calculate word count and read time
    const wordCount = this.countWords(createNoteDto.content);
    const readTime = Math.ceil(wordCount / 200); // Average reading speed: 200 wpm

    const note = await this.prisma.note.create({
      data: {
        ...createNoteDto,
        userId,
        tags: createNoteDto.tags || [],
        wordCount,
        readTime,
      },
    });

    // Create initial version
    await this.createVersion(note.id, userId, note.title, note.content, 'Initial version');

    return note;
  }

  async findAll(userId: string, query: NoteSearchDto) {
    const { q, category, isFavorite, isArchived, sortBy = 'updatedAt', sortOrder = 'desc', page = 1, limit = 20 } = query;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }
    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }
    if (isArchived !== undefined) {
      where.isArchived = isArchived;
    }

    // Search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    // Always pin first
    orderBy.isPinned = 'desc';

    const result = await PaginationUtil.paginate(
      this.prisma.note.findMany({
        where,
        orderBy,
      }),
      page,
      limit,
    );

    return result;
  }

  async findOne(userId: string, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        deletedAt: null,
      },
      include: {
        childNotes: {
          where: {
            deletedAt: null,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async update(userId: string, noteId: string, updateNoteDto: UpdateNoteDto) {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        deletedAt: null,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Prepare update data
    const updateData: any = {
      ...updateNoteDto,
      updatedAt: new Date(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Update word count and read time if content changed
    if (updateNoteDto.content !== undefined) {
      updateData.wordCount = this.countWords(updateNoteDto.content);
      updateData.readTime = Math.ceil(updateData.wordCount / 200);
      updateData.version = note.version + 1;
    }

    // Create version history if title or content changed
    if (updateNoteDto.title !== undefined || updateNoteDto.content !== undefined) {
      await this.createVersion(
        noteId,
        userId,
        updateNoteDto.title || note.title,
        updateNoteDto.content || note.content,
        'Updated',
      );
    }

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: updateData,
    });

    return updated;
  }

  async remove(userId: string, noteId: string) {
    const note = await this.prisma.note.updateMany({
      where: {
        id: noteId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (note.count === 0) {
      throw new NotFoundException('Note not found');
    }

    return { success: true, message: 'Note deleted successfully' };
  }

  async toggleFavorite(userId: string, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        deletedAt: null,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        isFavorite: !note.isFavorite,
      },
    });

    return updated;
  }

  async search(userId: string, query: string) {
    const notes = await this.prisma.note.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    });

    return notes;
  }

  private async createVersion(
    noteId: string,
    userId: string,
    title: string,
    content: string,
    changeSummary?: string,
  ) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) return;

    const versions = await this.prisma.noteVersion.findMany({
      where: { noteId },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const nextVersion = versions.length > 0 ? versions[0].version + 1 : 1;

    await this.prisma.noteVersion.create({
      data: {
        noteId,
        version: nextVersion,
        title,
        content,
        changeSummary,
        createdBy: userId,
      },
    });
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
}