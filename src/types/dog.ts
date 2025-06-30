export interface Dog {
    id: string;
    name: string;
    breed: string;
    photo_url?: string | null;
    birthday?: string;
    bio?: string;
    weight?: number;
    gender?: 'male' | 'female';
    created_at: string;
  }