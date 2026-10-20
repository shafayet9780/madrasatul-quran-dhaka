// Common types for the Madrasatul Quran website

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  preferredLanguage: 'bengali' | 'english';
}

export type Language = 'bengali' | 'english';
