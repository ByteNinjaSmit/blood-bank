import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Github, Linkedin, Twitter } from 'lucide-react'

const team = [
    {
        name: "Dr. A.B. Pawar",
        role: "Dean Academics SCOE & Project Consultant",
        initials: "SB",
        image: "https://sanjivanicoe.org.in/media/k2/items/cache/42121f00ffc451d0c288e11c1f28cbd4_S.jpg?t=20250814_064435",
        socials: { twitter: "#", linkedin: "https://www.linkedin.com/in/drabpawar/", github: "#" },
    },
    {
        name: "Smitraj Bankar",
        role: "Developer & Project Lead",
        initials: "SB",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoP5UPM0lpcZquldK9kpFPfPlHjxkFSAMWOg&s",
        socials: { twitter: "https://x.com/smitrajdbankar", linkedin: "https://www.linkedin.com/in/smitrajbankar/", github: "https://github.com/ByteNinjaSmit" },
    },
]

export default function TeamSection() {
    return (
        <section className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">Meet Our Team</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Dedicated professionals working together to save lives and make a difference.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                    {team.map((member) => (
                        <div key={member.name} className="group relative bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 flex flex-col items-center text-center">
                            <div className="relative w-32 h-32 mb-6 rounded-full overflow-hidden ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
                                <Image
                                    src={member.image}
                                    alt={member.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">{member.name}</h3>
                            <p className="text-sm font-medium text-primary mb-6 uppercase tracking-wider">{member.role}</p>

                            <div className="flex gap-4 mt-auto">
                                {member.socials.twitter && (
                                    <Link href={member.socials.twitter} className="text-muted-foreground hover:text-primary transition-colors p-2">
                                        <Twitter className="w-5 h-5" />
                                    </Link>
                                )}
                                {member.socials.linkedin && (
                                    <Link href={member.socials.linkedin} className="text-muted-foreground hover:text-primary transition-colors p-2">
                                        <Linkedin className="w-5 h-5" />
                                    </Link>
                                )}
                                {member.socials.github && (
                                    <Link href={member.socials.github} className="text-muted-foreground hover:text-primary transition-colors p-2">
                                        <Github className="w-5 h-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
