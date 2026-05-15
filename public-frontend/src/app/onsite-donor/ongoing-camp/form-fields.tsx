'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface FormFieldProps {
    label: string
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    placeholder?: string
    required?: boolean
    type?: string
    className?: string
    error?: string
}

export const FormInput = ({ label, name, value, onChange, placeholder, required = true, type = 'text', className = '', error }: FormFieldProps) => (
    <div className={`space-y-1.5 ${className}`}>
        <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label} {required && '*'}</label>
            {error && <span className="text-[10px] font-bold text-rose-500 animate-pulse">{error}</span>}
        </div>
        <input 
            required={required} 
            name={name} 
            type={type}
            value={value} 
            onChange={onChange} 
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 focus:bg-white transition-all outline-none font-bold text-sm text-gray-900 ${error ? 'border-rose-200' : 'border-gray-100'}`} 
            placeholder={placeholder} 
        />
    </div>
)

export const FormSelect = ({ label, name, value, onChange, options, placeholder, required = true, className = '', error }: FormFieldProps & { options: { value: string, label: string }[] }) => (
    <div className={`space-y-1.5 ${className}`}>
        <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label} {required && '*'}</label>
            {error && <span className="text-[10px] font-bold text-rose-500 animate-pulse">{error}</span>}
        </div>
        <select 
            required={required} 
            name={name} 
            value={value} 
            onChange={onChange} 
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 focus:bg-white transition-all outline-none font-bold text-sm text-gray-900 appearance-none ${error ? 'border-rose-200' : 'border-gray-100'}`}
        >
            <option value="">{placeholder || 'Select'}</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
)

export const FormRadioGroup = ({ label, name, value, onChange, options, className = '', error }: Omit<FormFieldProps, 'placeholder' | 'type'> & { options: { value: string, label: string }[] }) => (
    <div className={`space-y-1.5 ${className}`}>
        <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            {error && <span className="text-[10px] font-bold text-rose-500 animate-pulse">{error}</span>}
        </div>
        <div className="flex gap-2">
            {options.map(opt => (
                <button 
                    key={opt.value} 
                    type="button" 
                    onClick={() => onChange({ target: { name, value: opt.value } } as any)} 
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border-2 ${value === opt.value ? 'bg-rose-50 border-[#8B0000] text-[#8B0000]' : 'bg-white border-gray-50 text-gray-400 hover:border-gray-100'} ${error && value !== opt.value ? 'border-rose-100' : ''}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
)

export const FormVitalsInput = ({ label, name, value, onChange, placeholder, unit, step = '1', className = '', error }: FormFieldProps & { unit?: string, step?: string }) => (
    <div className={`space-y-1.5 ${className}`}>
        <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label} *</label>
            {error && <span className="text-[10px] font-bold text-rose-500 animate-pulse">{error}</span>}
        </div>
        <div className="relative">
            <input 
                required 
                name={name} 
                type="number" 
                step={step}
                value={value} 
                onChange={onChange} 
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#8B0000]/10 outline-none font-bold text-lg text-gray-900 ${error ? 'border-rose-200' : 'border-gray-100'}`} 
                placeholder={placeholder} 
            />
            {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs">{unit}</span>}
        </div>
    </div>
)
