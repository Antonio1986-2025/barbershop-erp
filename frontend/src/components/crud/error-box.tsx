export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}
