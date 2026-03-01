export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-[#0a0a0c] px-4 py-6 text-center text-sm text-foreground-muted">
      <p className="text-gray-400">© {new Date().getFullYear()} The prediction paddock</p>
      <p className="mt-2 text-amber-500/90">
        This site is still in development,things may occasionally go wrong.
      </p>
    </footer>
  )
}
