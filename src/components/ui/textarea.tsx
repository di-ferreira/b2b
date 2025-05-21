import * as React from 'react';

import { cn } from '@/lib/utils';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Label } from './label';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: IconProp;
  labelText?: string;
  labelPosition?: 'top' | 'left' | 'right';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      icon,
      id,
      disabled,
      required,
      labelText = '',
      labelPosition = 'left',
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          `relative flex w-full items-center gap-1.5 my-2`,
          labelPosition === 'top' && `flex-col items-start`,
          labelPosition === 'right' && `flex-row-reverse`,
          className
        )}
      >
        <Label
          htmlFor={id}
          className={cn(
            `relative `,
            required &&
              labelText !== '' &&
              `after:content-['*'] after:absolute after:ml-0.5 after:text-destructive`
          )}
        >
          {labelText}
        </Label>
        <span
          className={cn(
            `absolute  flex items-center justify-center w-4 h-auto text-lg`,
            `left-4 top-2.5`,
            labelText !== '' && `top-8`
          )}
        >
          {icon && <FontAwesomeIcon icon={icon} className='text-slate-400' />}
        </span>
        <textarea
          disabled={disabled}
          className={cn(
            `flex min-h-[60px] w-full rounded-md border border-input bg-white px-3 
                      py-2 text-sm shadow-sm placeholder:text-muted-foreground
                      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
                      disabled:cursor-not-allowed`,
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
// Textarea.displayName = "Textarea"

export { Textarea };

