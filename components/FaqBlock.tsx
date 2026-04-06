const faqs = [
  {
    question: 'How do predictions work?',
    answer:
      'Before a race starts, you submit your predicted top 10. After the race, you get 5 points for every driver in the exact correct position, 1 point if the driver still finished in the top 10 but in a different spot, and 0 points if the driver missed the top 10. A perfect prediction scores 50 points.',
  },
  {
    question: 'Do I need an account to join a pool?',
    answer:
      'Yes. You need an account to create pools, accept invitations, save predictions and appear on leaderboards.',
  },
  {
    question: 'Can I change my prediction later?',
    answer:
      'Yes, you can update your prediction as often as you want until predictions close for that race weekend.',
  },
  {
    question: 'What is the global leaderboard?',
    answer:
      'The global leaderboard shows how all players are performing across the platform, while pools let you compete in smaller private groups with friends.',
  },
  {
    question: 'Why should I join the Discord?',
    answer:
      'Discord is the best place to get race reminders, hear about updates, share feedback, report bugs and chat with other F1 fans in the community.',
  },
  {
    question: 'Is it free to use?',
    answer:
      'Yes. The Prediction Paddock is free to use, including creating an account, joining pools and making predictions.',
  },
]

export default function FaqBlock() {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <div className="flex flex-wrap items-baseline gap-2 mb-2">
        <h3 className="text-2xl font-semibold text-white">FAQ</h3>
      </div>
      <p className="text-white/70 text-sm mb-4">
        A few quick answers before lights out.
      </p>

      <div className="space-y-3">
        {faqs.map((item) => (
          <details
            key={item.question}
            className="group rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-white font-medium">
              <span>{item.question}</span>
              <span className="shrink-0 text-f1-red transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  )
}
