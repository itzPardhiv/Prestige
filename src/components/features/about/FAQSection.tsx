import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-prestige',
    question: 'What is PRESTIGE?',
    answer:
      'PRESTIGE is an interactive cryptography learning and analysis platform designed to help students, developers, and security enthusiasts master classical and modern ciphers through hands-on decoding, mathematical frequency analysis, and progressive challenges.',
  },
  {
    id: 'who-is-it-for',
    question: 'Who is PRESTIGE for?',
    answer:
      'PRESTIGE is built for anyone curious about how encryption works—including computer science students, cybersecurity learners, puzzle solvers, and educators looking for an interactive laboratory to demonstrate cryptographic principles.',
  },
  {
    id: 'prior-knowledge',
    question: 'Do I need prior cryptography knowledge?',
    answer:
      'No prior knowledge is required. You can start with foundational ciphers like the Caesar and Atbash ciphers, and utilize guided hints, auto-detection tools, and letter frequency graphs as you advance to polyalphabetic ciphers like Vigenère and complex substitutions.',
  },
  {
    id: 'what-can-i-learn',
    question: 'What can I learn with PRESTIGE?',
    answer:
      'You will learn how classical substitution works, how polyalphabetic key schedules operate, the significance of letter frequency distributions and Index of Coincidence (IoC), binary and Base64 digital representations, Morse transmission, and cryptanalytic problem-solving heuristics.',
  },
  {
    id: 'only-a-decoder',
    question: 'Is PRESTIGE only a cipher decoder?',
    answer:
      'No. Beyond decoding, PRESTIGE provides statistical entropy calculators, unigram letter frequency comparative charts, automated cipher identification heuristics, comprehensive cryptanalysis reports, and structured practice challenges.',
  },
  {
    id: 'save-my-work',
    question: 'Can I save my work?',
    answer:
      'Yes. You can save any ongoing or completed cipher analysis into custom folders in your History, resume them at any time in the workspace, and export detailed mathematical reports in text, markdown, or print-ready formats.',
  },
  {
    id: 'track-progress',
    question: 'Does PRESTIGE track my progress?',
    answer:
      'Yes. Your account locally tracks your solved challenge history, analysis accuracy percentage, fastest solve times, and saved investigations across all cipher categories.',
  },
  {
    id: 'without-account',
    question: 'Can I use PRESTIGE without creating an account?',
    answer:
      'PRESTIGE currently stores account and learning data locally in your browser. While an account is required so your progress and saved folders stay organized, you can instantly start learning with our one-click Demo Learner account without filling out a form.',
  },
  {
    id: 'real-world-secrets',
    question: 'Is PRESTIGE intended for real-world encrypted communications?',
    answer:
      'No. PRESTIGE is strictly an educational learning platform demonstrating historical, mathematical, and algorithmic cipher concepts. Classical ciphers are computationally insecure and must never be used to protect real-world private communications.',
  },
  {
    id: 'suggest-improvements',
    question: 'Can I suggest improvements or report an issue?',
    answer:
      'Yes! We welcome learner feedback, challenge suggestions, and algorithm contributions. You can connect directly via the links in the "Created by" section or submit feedback through our community repository.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIds, setOpenIds] = useState<string[]>(['what-is-prestige']);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="surface-card p-6 sm:p-8 border border-border rounded-xl transition-colors space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand-500" />
            <h3 className="text-base font-semibold text-content-primary">
              Frequently Asked Questions
            </h3>
          </div>
          <p className="text-xs text-content-secondary">
            Everything you need to know about the PRESTIGE cryptography learning platform.
          </p>
        </div>
        <span className="text-[11px] text-content-tertiary">
          10 Q&As
        </span>
      </div>

      {/* Accordion List */}
      <div className="divide-y divide-border-subtle">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openIds.includes(item.id);

          return (
            <div key={item.id} className="py-3">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
                className="w-full text-left flex items-center justify-between gap-4 py-1 text-xs font-semibold text-content-primary hover:text-brand-500 transition-colors group"
              >
                <span className="leading-snug">{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-content-tertiary group-hover:text-brand-500 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-brand-500' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div
                  id={`faq-answer-${item.id}`}
                  className="pt-2 pb-1 text-xs text-content-secondary leading-relaxed animate-in fade-in duration-200"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
