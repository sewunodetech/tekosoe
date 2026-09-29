export function Logo({ size = 24, dot = true }: { size?: number; dot?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <span
        className="font-display font-extrabold tracking-tight text-[#1f7a6e]"
        style={{ fontSize: size }}
      >
        tekosoe
      </span>
      {dot && (
        <span
          className="rounded-full bg-[#ff9a62] inline-block"
          style={{ width: size / 3.5, height: size / 3.5 }}
        />
      )}
    </div>
  );
}
