import { ComponentType } from 'react';

interface IBlogPost {
  id: number;
  title: string;
  summary: string;
  date: string;
  component: ComponentType;
}

export default IBlogPost;
