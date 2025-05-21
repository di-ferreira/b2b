import { IconProp } from '@fortawesome/fontawesome-svg-core';
export interface iNavButton {
  Text: string;
  Link: string;
  Icon: IconProp;
  isButton?: boolean;
  onClick?: () => void;
}
