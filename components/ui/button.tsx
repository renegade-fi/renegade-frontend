import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    {
        defaultVariants: {
            size: "default",
            variant: "default",
        },
        variants: {
            size: {
                default: "h-9 px-4 py-2",
                icon: "h-9 w-9",
                lg: "h-10 rounded-md px-8",
                shimmer: "h-9 px-4",
                sm: "h-8  px-3 text-xs",
                xl: "h-16",
            },
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:bg-background disabled:text-foreground disabled:border-border disabled:border",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                outline:
                    "border border-border  bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                shimmer: "bg-shimmer-button animate-shimmer-button hover:paused",
            },
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ className, size, variant }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
