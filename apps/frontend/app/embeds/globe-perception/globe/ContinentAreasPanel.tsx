import { CONTINENT_AREAS } from './continentAreas'

export function ContinentAreasPanel() {
  return (
    <section
      className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
      aria-labelledby="continent-areas-heading"
    >
      <h2
        id="continent-areas-heading"
        className="font-heading text-base font-semibold text-foreground sm:text-lg"
      >
        Superficies réelles des continents
      </h2>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        Ordres de grandeur en millions de km² (sources usuelles type manuels de géographie / agrégats continentaux).
        La carte Mercator ne respecte pas ces proportions : elle gonfle les surfaces vers les pôles.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Continent</th>
              <th className="py-2 text-right">Superficie (M km²)</th>
            </tr>
          </thead>
          <tbody>
            {CONTINENT_AREAS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/60 last:border-0"
              >
                <td className="py-2 pr-3 font-medium text-foreground">
                  {row.name}
                  {row.id === 'africa' ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (réel ≈ 14× le Groenland, souvent trompeur sur Mercator)
                    </span>
                  ) : null}
                </td>
                <td className="py-2 text-right tabular-nums text-foreground">
                  {row.areaMillionKm2.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Indicatif : frontières et définitions continentales peuvent varier. Pour l’article : rappeler que l’Afrique (~30,4
        M km²) est bien plus vaste que les cartes « plates » type Mercator ne le suggèrent à côté du Groenland.
      </p>
    </section>
  )
}
