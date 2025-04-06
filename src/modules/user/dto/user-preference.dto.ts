import { CategoryEnum, InterestEnum } from 'src/enum/user.enum';

export class UpdateUserPreferencesDto {
  name: string;
  id: string;
  // Allowed values: 'interest' or 'category'
  type: 'interest' | 'category';
}
