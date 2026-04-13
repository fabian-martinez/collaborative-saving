import * as fs from 'fs';

const filePath = 'src/infrastructure/nestjs/http/controllers/members.v2.controller.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Use regexes to completely replace the try/catch structures.
content = content.replace(/async create\(\n\s*@Body\(\) body: CreateMemberHttpDto,\n\s*\): Promise<MemberResponseHttpDto> \{\n\s*try \{\n\s*const result = await this\.createMemberUseCase\.execute\(body\);\n\s*return this\.mapMemberToHttp\(result\);\n\s*\} catch \(e: unknown\) \{\n[\s\S]*?\}\n\s*\}/, `async create(
    @Body() body: CreateMemberHttpDto,
  ): Promise<MemberResponseHttpDto> {
    const result = await this.createMemberUseCase.execute(body);
    return this.mapMemberToHttp(result);
  }`);

content = content.replace(/async recordExtraordinaryLoanPayment\(\n\s*@Param\('id', ParseUUIDPipe\) id: string,\n\s*@Body\(\) body: RecordExtraordinaryLoanPaymentHttpDto,\n\s*\): Promise<RecordExtraordinaryLoanPaymentResponseHttpDto> \{\n\s*try \{([\s\S]*?)\} catch \(e: unknown\) \{\n[\s\S]*?\}\n\s*\}/, `async recordExtraordinaryLoanPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RecordExtraordinaryLoanPaymentHttpDto,
  ): Promise<RecordExtraordinaryLoanPaymentResponseHttpDto> {$1}`);

content = content.replace(/async detail\(\n\s*@Param\('id', ParseUUIDPipe\) id: string,\n\s*\): Promise<MemberResponseHttpDto> \{\n\s*try \{\n\s*const result = await this\.getMemberDetailQuery\.execute\(id\);\n\s*return this\.mapMemberToHttp\(result\);\n\s*\} catch \(e: unknown\) \{\n[\s\S]*?\}\n\s*\}/, `async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberResponseHttpDto> {
    const result = await this.getMemberDetailQuery.execute(id);
    return this.mapMemberToHttp(result);
  }`);

content = content.replace(/async update\(\n\s*@Param\('id', ParseUUIDPipe\) id: string,\n\s*@Body\(\) body: UpdateMemberHttpDto,\n\s*\): Promise<MemberResponseHttpDto> \{\n\s*try \{([\s\S]*?)\} catch \(e: unknown\) \{\n[\s\S]*?\}\n\s*\}/, `async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMemberHttpDto,
  ): Promise<MemberResponseHttpDto> {$1}`);

content = content.replace(/async remove\(@Param\('id', ParseUUIDPipe\) id: string\): Promise<void> \{\n\s*try \{\n\s*await this\.deleteMemberUseCase\.execute\(\{ memberId: id \}\);\n\s*\} catch \(e: unknown\) \{\n[\s\S]*?\}\n\s*\}/, `async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteMemberUseCase.execute({ memberId: id });
  }`);

content = content.replace(/async getDues\(\n\s*@Param\('id', ParseUUIDPipe\) id: string,\n\s*\): Promise<MemberDueResponseHttpDto\[\]> \{\n\s*try \{\n\s*const dues = await this\.getMemberDuesQuery\.execute\(id\);\n\s*return dues\.map\(\(d\) => this\.mapDueToHttp\(d\)\);\n\s*\} catch \(e: unknown\) \{\n[\s\S]*?\}\n\s*\}/, `async getDues(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberDueResponseHttpDto[]> {
    const dues = await this.getMemberDuesQuery.execute(id);
    return dues.map((d) => this.mapDueToHttp(d));
  }`);


fs.writeFileSync(filePath, content, 'utf-8');
console.log(`Updated ${filePath}`);
