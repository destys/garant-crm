/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { IMaskInput, IMaskInputProps } from "react-imask";

import { cn } from "@/lib/utils";

interface InputProps
  extends Omit<React.ComponentProps<"input">, "mask" | "onChange"> {
  mask?: IMaskInputProps<HTMLInputElement>["mask"];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Input({ className, type, mask, onChange, ...props }: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";

  // Если есть маска — рендерим IMaskInput
  if (mask) {
    return (
      <div className="relative w-full">
        <IMaskInput
          {...(props as any)}
          mask={mask}
          unmask={true}
          data-slot="input"
          inputRef={(el) => {
            // чтобы работал ref
            if (typeof props.ref === "function") props.ref(el);
            else if (props.ref)
              (props.ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }}
          onAccept={(value: any) => {
            if (onChange) {
              const event = {
                target: {
                  name: props.name,
                  value,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              onChange(event);
            }
          }}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <input
        type={isPassword && showPassword ? "text" : type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
        onChange={onChange}
      />
      {isPassword && (
        <button
          type="button"
          className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      )}
    </div>
  );
}

export { Input };