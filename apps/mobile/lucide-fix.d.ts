import React from 'react';
import { SvgProps } from 'react-native-svg';

declare module 'lucide-react-native' {
  export interface LucideProps extends SvgProps {
    size?: number | string;
    color?: string;
    fill?: string;
    strokeWidth?: number | string;
    style?: any;
  }
  export const ShoppingBag: React.FC<LucideProps>;
  export const Search: React.FC<LucideProps>;
  export const Star: React.FC<LucideProps>;
  export const Timer: React.FC<LucideProps>;
  export const Flame: React.FC<LucideProps>;
  export const Leaf: React.FC<LucideProps>;
  export const ChefHat: React.FC<LucideProps>;
}
