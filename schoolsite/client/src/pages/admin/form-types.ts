export type Values = Record<string, unknown>;
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'datetime' | 'date' | 'number' | 'checkbox' | 'image';
  required?: boolean;
  options?: string[];
  help?: string;
  placeholder?: string;
  full?: boolean;
  rows?: number;
  min?: number;
  max?: number;
}
export const statusField: FieldConfig = {
  name: 'status',
  label: 'Visibility',
  type: 'select',
  options: ['draft', 'published'],
  help: 'Drafts are only visible to school staff.',
};
export const imageField = (name: string, label: string, help?: string): FieldConfig => ({
  name,
  label,
  type: 'image',
  full: true,
  help,
});
