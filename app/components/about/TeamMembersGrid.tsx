'use client';

import Image from 'next/image';

interface TeamMember {
  image: string;
  name: string;
  role: string;
  desc: string;
}

interface TeamMembersGridProps {
  members: TeamMember[];
}

export default function TeamMembersGrid({ members }: TeamMembersGridProps) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {members.map((member, index) => (
        <div key={index} className="card p-6 rounded-3xl text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-oe-gold/20 to-oe-gold/10 relative">
            <Image
              src={member.image}
              alt={member.name}
              fill
              className="object-cover"
              sizes="96px"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h3 className="text-xl font-bold text-white">{member.name}</h3>
          <p className="text-oe-gold text-sm mb-2">{member.role}</p>
          <p className="text-sm text-white/70">{member.desc}</p>
        </div>
      ))}
    </div>
  );
}
