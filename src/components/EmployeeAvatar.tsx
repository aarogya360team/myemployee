import Image from "next/image";
import { appearanceSrc } from "@/lib/employee-identity";

export function EmployeeAvatar({
  avatar,
  name,
  size = 40,
}: {
  avatar?: string | null;
  name: string;
  size?: number;
}) {
  const src = avatar?.startsWith("/") || Boolean(avatar) ? appearanceSrc(avatar) : null;
  const initial = name.slice(0, 1).toUpperCase();
  if (!src) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] font-semibold text-white"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-xl object-cover"
      style={{ width: size, height: size }}
    />
  );
}
