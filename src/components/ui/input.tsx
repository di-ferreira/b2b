import { cn } from '@/lib/utils';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { Label } from './label';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: IconProp;
  labelText?: string;
  inputClass?: string;
  labelPosition?: 'top' | 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClass,
      type,
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
              `after:content-['*'] after:absolute after:ml-0.5 after:text-destructive tablet-portrait:text-2xl`
          )}
        >
          {labelText}
        </Label>
        <span
          className={cn(
            `absolute  flex items-center justify-center w-4 h-auto text-lg`,
            `left-4 top-2.5`,
            labelText !== '' && `top-8 tablet-portrait:top-11`
          )}
        >
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              className='text-slate-400 tablet-portrait:text-2xl'
            />
          )}
        </span>
        <input
          type={type}
          id={id}
          disabled={disabled}
          required={required}
          className={cn(
            `flex h-10 w-full  rounded-md border border-input bg-background p-3 py-2 
                        text-sm text-black ring-offset-background file:border-0 file:bg-transparent file:text-sm
                        file:font-medium placeholder:text-muted-foreground focus-visible:outline-none
                        focus-visible:ring-1 focus-visible:ring-emsoft_blue-light focus:invalid:ring-destructive
                        disabled:cursor-not-allowed  placeholder:italic
                        placeholder:text-slate-400 tablet-portrait:placeholder:text-xl`,
            inputClass && inputClass,
            icon && `pl-8 pr-3`,
            icon && labelText !== '' && `pl-10 pr-3`
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

// Input.displayName = 'Input';

export { Input };

