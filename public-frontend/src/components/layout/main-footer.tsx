"use client"

import { Facebook, Linkedin, Instagram } from 'lucide-react'
import Link from 'next/link'
import { FaYoutube, FaFacebook, FaLinkedin, FaHome, FaInfo, FaImage, FaUser } from "react-icons/fa";
import { IoInformationCircle } from "react-icons/io5";
import { GrInstagram } from "react-icons/gr";
import Image from 'next/image';
import { FaLocationDot ,FaClock } from "react-icons/fa6";
import { ImDroplet } from "react-icons/im";


export default function Footer() {

    const socialLinks = [
        { icon: FaFacebook, label: 'Facebook' },
        { icon: FaYoutube, label: 'YouTube' },
        { icon: GrInstagram, label: 'Instagram' },
        { icon: FaLinkedin, label: 'Linkedin' }
    ]
    return (
        <footer className="bg-primary text-primary-foreground py-16 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold  flex items-center gap-2"><ImDroplet/>Sanjivani Blood Bank</h3>
                        <p className="text-sm leading-relaxed text-primary-foreground/90">
                            We enable healthcare professionals to deliver high-quality blood services, leading to the best possible outcome for patients.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.label}
                                    href="#"
                                    aria-label={social.label}
                                    className="w-7 h-7 rounded-full  text-primary hover:text-primary flex items-center justify-center text-xs transition-all hover:scale-110 duration-300"
                                >
                                    <social.icon className='text-2xl' />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg flex items-center gap-2"><FaLocationDot/> Locations</h4>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="font-semibold mb-1">Location 1:</p>
                                <p className="text-primary-foreground/90">
                                    Medical Plaza Building,<br />
                                    Floor 3, Sector 5,<br />
                                    Metro Heights,<br />
                                    Pin Code: 560034
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold mb-1">Location 2:</p>
                                <p className="text-primary-foreground/90">
                                    Central Healthcare Hub,<br />
                                    District Medical Complex,<br />
                                    Downtown Area,<br />
                                    Pin Code: 523034
                                </p>
                            </div>
                        </div>
                    </div>


                    {/* Working Days */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg  flex items-center gap-2"><FaClock/> Working Days</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Mon - Tue</span>
                                <span>08:00 AM - 05:00 PM</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Wed - Thu</span>
                                <span>09:00 AM - 06:00 PM</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fri - Sat</span>
                                <span>10:00 AM - 05:00 PM</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sunday</span>
                                <span>Emergency Only</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-primary-foreground/20">
                                <span>Phone Booking</span>
                                <span>Mon - 10:00 AM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-primary-foreground/20"></div>

                {/* Copyright */}
                <div className="pt-8 text-center text-sm text-primary-foreground/80">
                    <p>©{new Date().getFullYear()} Sanjivani Blood Bank. All Rights Reserved.</p>
                </div>

            </div>
        </footer>
    )
}
