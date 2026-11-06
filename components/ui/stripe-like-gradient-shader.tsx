"use client";

import { GradFlow } from "gradflow";

/** React/TypeScript variant of the portfolio's native Work hero effect.
 *  Intended for a future shadcn + Tailwind build. The published website is static. */
export const Component = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#07173f]">
      <GradFlow
        config={{
          color1: { r: 7, g: 23, b: 63 },
          color2: { r: 11, g: 42, b: 140 },
          color3: { r: 67, g: 119, b: 224 },
          speed: 0.4,
          scale: 1,
          type: "stripe",
          noise: 0.08,
        }}
      />
      {/* Add your content above the gradient using a positioned overlay. */}
    </div>
  );
};
