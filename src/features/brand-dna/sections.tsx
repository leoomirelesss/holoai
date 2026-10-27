import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { Card, Notice } from "@/components/ui/surface";
import { count, limits, type DnaForm, type Errors } from "./model";

type Props = { form: DnaForm; errors: Errors; locked: boolean; onChange: (form: DnaForm) => void };
export function DnaSections({ form, errors, locked, onChange }: Props) {
  const change = (key: keyof DnaForm, value: unknown) => onChange({ ...form, [key]: value });
  const hint = (key: keyof typeof limits) => `${count(form[key])} de ${limits[key]} caracteres.`;
  const focus = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
  return <>
    <Card id="dna-identity" className="dna-section" aria-labelledby="dna-identity-title">
      <div className="dna-section-heading"><span className="eyebrow">01 · IDENTIDAD</span><h2 id="dna-identity-title">Lo que te define.</h2><p className="section-description">Estos datos pertenecen al perfil de identidad de tu marca.</p></div>
      <Field id="dna-name" label="Nombre del perfil de marca" autoComplete="organization" value={form.name} readOnly={locked} onChange={e => change("name", e.target.value)} hint={hint("name")} error={errors.name} />
      <Field id="dna-website" label="Sitio web (opcional)" type="url" autoComplete="url" value={form.website} readOnly={locked} onChange={e => change("website", e.target.value)} hint="URL HTTPS. No visitaremos ni analizaremos tu sitio." error={errors.website} />
      <TextAreaField id="dna-description" label="Descripción" value={form.description} readOnly={locked} onChange={e => change("description", e.target.value)} hint={hint("description")} error={errors.description} />
      <Field id="dna-language" label="Idioma del contenido" placeholder="Por ejemplo: es-MX" value={form.language} readOnly={locked} onChange={e => change("language", e.target.value)} hint={`${hint("language")} Aporta el idioma; no lo inferimos automáticamente.`} error={errors.language} />
    </Card>
    <Card id="dna-visual" className="dna-section" aria-labelledby="dna-visual-title">
      <div className="dna-section-heading"><span className="eyebrow">02 · IDENTIDAD VISUAL</span><h2 id="dna-visual-title">Un lenguaje reconocible.</h2><p className="section-description">Añade únicamente los colores y la tipografía que quieras asociar al perfil.</p></div>
      <Notice title="Logo: no disponible"><p>La gestión de archivos del producto todavía no está habilitada. No se subirá ningún logo.</p></Notice>
      <div className="dna-repeatable"><h3>Colores de marca</h3><p className="field-hint">Hasta 12 colores HEX de seis dígitos. No se han añadido sugerencias ni colores automáticos.</p>
        {form.colors.length === 0 && <p className="field-hint">Todavía no has definido colores.</p>}
        {form.colors.map((color, i) => <div className="dna-color-row" key={i}>
          <span className="dna-swatch" aria-hidden="true" style={/^#[0-9a-f]{6}$/i.test(color) ? { backgroundColor: color } : undefined} />
          <Field id={`dna-color-${i}`} label={`Color HEX ${i + 1}`} value={color} readOnly={locked} onChange={e => change("colors", form.colors.map((c, index) => index === i ? e.target.value : c))} error={errors[`color-${i}`]} placeholder="#RRGGBB" spellCheck={false} />
          <Button variant="ghost" disabled={locked} aria-label={`Eliminar color ${i + 1}`} onClick={() => { change("colors", form.colors.filter((_, index) => index !== i)); focus("dna-add-color"); }}>Eliminar</Button>
        </div>)}
        {errors.colors && <p role="alert" className="field-error">{errors.colors}</p>}
        <Button id="dna-add-color" variant="secondary" disabled={locked || form.colors.length >= 12} onClick={() => { change("colors", [...form.colors, ""]); focus(`dna-color-${form.colors.length}`); }}>Añadir color</Button>
      </div>
      <Field id="dna-font" label="Familia tipográfica (opcional)" value={form.font} readOnly={locked} onChange={e => change("font", e.target.value)} hint={`${hint("font")} Nombre de familia, sin cargar fuentes externas. La interfaz continúa usando Inter.`} error={errors.font} />
    </Card>
    <Card id="dna-voice" className="dna-section" aria-labelledby="dna-voice-title">
      <div className="dna-section-heading"><span className="eyebrow">03 · VOZ Y AUDIENCIA</span><h2 id="dna-voice-title">Cómo hablas. A quién llegas.</h2><p className="section-description">Define un criterio claro para los mensajes que crearás más adelante.</p></div>
      <TextAreaField id="dna-tone" label="Tono de comunicación" value={form.tone} readOnly={locked} onChange={e => change("tone", e.target.value)} hint={hint("tone")} error={errors.tone} />
      <TextAreaField id="dna-audience" label="Público objetivo" value={form.audience} readOnly={locked} onChange={e => change("audience", e.target.value)} hint={hint("audience")} error={errors.audience} />
    </Card>
    <Card id="dna-competitors" className="dna-section" aria-labelledby="dna-competitors-title">
      <div className="dna-section-heading"><span className="eyebrow">04 · CONTEXTO</span><h2 id="dna-competitors-title">Tu entorno competitivo.</h2><p className="section-description">Lista opcional, hasta 20 competidores aportados por ti. No se investiga ninguna web.</p></div>
      {form.competitors.length === 0 && <p className="field-hint">No hay competidores añadidos.</p>}
      {form.competitors.map((competitor, i) => <fieldset className="dna-competitor" key={i}><legend>Competidor {i + 1}</legend>
        <Field id={`dna-competitor-${i}-name`} label={`Nombre del competidor ${i + 1}`} value={competitor.name} readOnly={locked} onChange={e => change("competitors", form.competitors.map((c, index) => index === i ? { ...c, name: e.target.value } : c))} hint="Hasta 160 caracteres." error={errors[`competitor-${i}-name`]} />
        <Field id={`dna-competitor-${i}-website`} label={`URL del competidor ${i + 1} (opcional)`} type="url" value={competitor.website} readOnly={locked} onChange={e => change("competitors", form.competitors.map((c, index) => index === i ? { ...c, website: e.target.value } : c))} hint="HTTPS, hasta 2048 caracteres." error={errors[`competitor-${i}-website`]} />
        <Button variant="ghost" disabled={locked} onClick={() => { change("competitors", form.competitors.filter((_, index) => index !== i)); focus("dna-add-competitor"); }}>Eliminar competidor {i + 1}</Button>
      </fieldset>)}
      {errors.competitors && <p role="alert" className="field-error">{errors.competitors}</p>}
      <Button id="dna-add-competitor" variant="secondary" disabled={locked || form.competitors.length >= 20} onClick={() => { change("competitors", [...form.competitors, { name: "", website: "" }]); focus(`dna-competitor-${form.competitors.length}-name`); }}>Añadir competidor</Button>
    </Card>
  </>;
}
export function ProfileSummary({ form, full = false }: { form: DnaForm; full?: boolean }) {
  return <div className="dna-summary-content">
    <p className="draft-value">{form.name || "Nombre por completar"}</p>
    <p className="draft-description">{form.description || "Descripción por completar"}</p>
    <dl className="dna-facts"><dt>Idioma</dt><dd>{form.language || "Por completar"}</dd><dt>Voz</dt><dd>{form.tone || "Por completar"}</dd><dt>Audiencia</dt><dd>{form.audience || "Por completar"}</dd>
      {full && <><dt>Web del perfil</dt><dd>{form.website || "Sin definir"}</dd><dt>Tipografía</dt><dd>{form.font || "Sin definir"}</dd><dt>Colores</dt><dd>{form.colors.join(", ") || "Sin definir"}</dd><dt>Competidores</dt><dd>{form.competitors.length ? form.competitors.map(c => `${c.name}${c.website ? ` · ${c.website}` : ""}`).join("; ") : "Ninguno"}</dd></>}
    </dl>
    {!full && <div className="dna-palette" aria-label="Colores de la edición local">{form.colors.filter(c => /^#[0-9a-f]{6}$/i.test(c)).map((c, i) => <span key={i} className="dna-swatch" role="img" aria-label={c} style={{ backgroundColor: c }} />)}</div>}
  </div>;
}
