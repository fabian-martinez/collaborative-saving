import { ApiProperty } from '@nestjs/swagger';

export class DeleteMemberResponseDto {
  @ApiProperty({
    description: 'Indicates if the deletion was successful',
    example: true,
  })
  success: boolean;
}
