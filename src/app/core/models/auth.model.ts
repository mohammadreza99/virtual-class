export type Sex = 'Male' | 'Female';

export interface AuthRegister {
  first_name: string;
  last_name: string;
  sex: Sex;
  username: string;
  password: string;
  email: string;
  phone_number: string;
}

export interface AuthLogin {
  email: string;
  password: string;
  company_id: number;
}
