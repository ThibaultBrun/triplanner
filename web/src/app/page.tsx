export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50 px-6 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="w-full max-w-2xl text-center">
        <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Maquette · Pays Basque
        </span>

        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
          Triplanner
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Le compagnon de voyage pour découvrir le Pays Basque à votre rythme.
          Sélectionnez vos lieux, on s&apos;occupe de l&apos;itinéraire.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card title="Découverte" status="à venir" />
          <Card title="Itinéraire" status="à venir" />
          <Card title="Carte" status="à venir" />
        </div>

        <p className="mt-12 text-xs text-slate-400 dark:text-slate-600">
          Maquette en cours de construction · déployée sur GitHub Pages
        </p>
      </main>
    </div>
  );
}

function Card({ title, status }: { title: string; status: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 px-4 py-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-base font-medium text-slate-900 dark:text-slate-100">
        {title}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-600">
        {status}
      </div>
    </div>
  );
}
