export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm text-danger animate-fade-in">
      {message}
    </div>
  );
}
