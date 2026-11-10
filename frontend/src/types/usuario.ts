
export interface Usuario {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  disabled: boolean;
  created_at: string;
}

export interface DatosRegistro {
  username: string;
  full_name: string;
  email: string;
  password: string;
}
