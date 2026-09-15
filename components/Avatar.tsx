import { Member } from '@/lib/types';

interface AvatarProps {
  member: Member;
  className?: string;
}

import Image from 'next/image';

export default function Avatar({ member, className = '' }: AvatarProps) {
  const avatarContent = member.avatar_url ? (
    <div 
      className={`relative rounded-full overflow-hidden shrink-0 border-[2.5px] border-[#2d2d2d] w-full h-full`}
      style={{ backgroundColor: member.color }}
    >
      <Image
        src={member.avatar_url}
        alt={`Avatar de ${member.name}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        priority
        unoptimized={true}
      />
    </div>
  ) : (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 border-[2.5px] border-[#2d2d2d] w-full h-full`}
      style={{ backgroundColor: member.color }}
    >
      {member.name.charAt(0)}
    </div>
  );

  return (
    <div className={`rounded-full overflow-hidden shrink-0 ${className}`}>
      {avatarContent}
    </div>
  );
}
