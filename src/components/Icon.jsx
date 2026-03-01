// src/components/Icon.jsx
import * as Icons from "lucide-react";

const Icon = ({ name, size = 24, className = "", strokeWidth = 2 }) => {
  const LucideIcon = Icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} strokeWidth={strokeWidth} />;
};

export default Icon;
