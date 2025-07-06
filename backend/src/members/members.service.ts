import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
  ) {}

  create(createMemberDto: CreateMemberDto): Promise<Member> {
    const member = this.membersRepository.create(createMemberDto);
    return this.membersRepository.save(member);
  }

  findAll(): Promise<Member[]> {
    return this.membersRepository.find();
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.membersRepository.findOneBy({ id });
    if (!member) {
      throw new NotFoundException(`Member #${id} not found`);
    }
    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.membersRepository.preload({
      id,
      ...updateMemberDto,
    });
    if (!member) {
      throw new NotFoundException(`Member #${id} not found`);
    }
    return this.membersRepository.save(member);
  }

  async remove(id: string): Promise<void> {
    const result = await this.membersRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Member #${id} not found`);
    }
  }

  findDeleted(): Promise<Member[]> {
    return this.membersRepository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
    });
  }
}
