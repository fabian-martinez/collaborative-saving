import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    await this.membersRepository.update(id, updateMemberDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.membersRepository.delete(id);
  }
}
