export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 px-6 md:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Internet Outage Dashboard</span>
        </div>
      </div>
    </footer>
  );
}

