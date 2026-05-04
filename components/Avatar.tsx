import { Member } from '@/lib/types';

interface AvatarProps {
  member: Member;
  className?: string;
}

export default function Avatar({ member, className = '' }: AvatarProps) {
  if (member.avatar_url) {
    return (
      <div 
        className={`relative rounded-full overflow-hidden shrink-0 shadow-sm border border-black/5 ${className}`}
        style={{ backgroundColor: member.color }}
      >
        <img
          src={member.avatar_url}
          alt={`Avatar de ${member.name}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${className}`}
      style={{ backgroundColor: member.color }}
    >
      {member.name.charAt(0)}
    </div>
  );
}
