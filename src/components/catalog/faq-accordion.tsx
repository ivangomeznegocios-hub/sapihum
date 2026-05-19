'use client'

import { useState } from 'react'

export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="divide-y divide-border">
            {items.map((item, index) => (
                <div key={item.question}>
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-brand-text-strong transition-colors hover:text-brand-blue"
                    >
                        {item.question}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`ml-2 shrink-0 text-brand-text-muted transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                        <p className="text-sm leading-relaxed text-brand-text-muted">{item.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
