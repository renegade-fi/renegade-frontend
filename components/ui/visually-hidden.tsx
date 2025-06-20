"use client";

import { VisuallyHidden as VisuallyHiddenPrimitive } from "radix-ui";
import * as React from "react";

const VisuallyHidden = React.forwardRef<
    React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>((props, ref) => <VisuallyHiddenPrimitive.Root ref={ref} {...props} />);
VisuallyHidden.displayName = VisuallyHiddenPrimitive.Root.displayName;

export { VisuallyHidden };
