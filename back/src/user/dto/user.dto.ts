import { IsString, Length, Matches, NotEquals } from 'class-validator';

export class CheckPseudoDto {
  @IsString({ message: 'The username must be a string.' })
  @Length(3, 15, { message: 'The username must be between 3 and 15 characters.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'The username must contain letters, numbers, hyphens, or underscores.'  })
  @NotEquals('admin', { message: 'The username cannot be equal to "admin".' })
  pseudo: string;
}
