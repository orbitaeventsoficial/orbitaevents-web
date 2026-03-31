'use client';

import Image from 'next/image';

interface TeamMember {
  image?: string;
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
        <div key={index} className="card p-6 rounded-3xl text-center group hover:border-amber-500/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-500">
          <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-oe-gold/20 to-oe-gold/10 transition-shadow duration-500 group-hover:shadow-[0_0_24px_rgba(245,158,11,0.2)]">
            {member.image ? (
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover"
                sizes="96px"
                quality={70}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.25),transparent_55%),linear-gradient(135deg,rgba(251,191,36,0.16),rgba(255,255,255,0.04))] text-3xl font-black text-white/88">
                {member.name.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">{member.name}</h3>
          <p className="text-oe-gold text-sm mb-2">{member.role}</p>
          <p className="text-sm text-white/70">{member.desc}</p>
        </div>
      ))}
    </div>
  );
}


