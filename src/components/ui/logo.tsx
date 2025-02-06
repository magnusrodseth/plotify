import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  showText?: boolean;
}

export function Logo({ showText = true, className, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 bg-red-500 rounded-full" />
        <div className="absolute inset-1 bg-pink-400 rounded-full" />
        <div
          className="absolute right-1 top-2 w-1.5 h-1.5 bg-white rounded-full"
          style={{ transform: "rotate(-45deg)" }}
        />
      </div>
      {showText && <span className="text-xl font-bold">Plotify</span>}
    </div>
  );
}
