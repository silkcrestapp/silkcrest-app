import { useSave } from '../context/useSave';

export default function SaveSelect() {
  const { saves, setSave } = useSave();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Silkcrest</h1>
          <p className="text-muted-foreground text-sm">Select a save file to continue</p>
        </div>

        <div className="space-y-2">
          {saves.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground italic">No save files found.</p>
          ) : (
            saves.map(save => (
              <button
                key={save.id}
                onClick={() => setSave(save)}
                className="w-full text-left rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors"
              >
                <p className="font-medium text-sm">{save.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(save.created_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}