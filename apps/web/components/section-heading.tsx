export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <h2 className="section-title">{title}</h2>
      {description ? <p className="muted" style={{ margin: 0 }}>{description}</p> : null}
    </div>
  );
}
