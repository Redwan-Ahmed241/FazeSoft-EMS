import svgPaths from "./svg-nubmbundb";

export default function Frame() {
  return (
    <div className="flex gap-3 items-center">
      <div className="relative h-10 w-10 flex-shrink-0">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 39.3262 39.5459">
          <ellipse cx="19.6631" cy="19.773" fill="#5932EA" rx="19.6631" ry="19.773" />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[56%] h-[51%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.1897 19.9927">
            <path clipRule="evenodd" d={svgPaths.p25ebec00} fill="white" fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <span className="font-semibold text-lg text-foreground tracking-wide">
        HIREMATE
      </span>
    </div>
  );
}