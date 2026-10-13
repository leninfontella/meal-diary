import { Camera, Check, Image as ImageIcon, Leaf, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { PhotoSourceModal } from '../components/PhotoSourceModal';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from '../contexts/ConfirmDialogContext';
import { useToast } from '../contexts/ToastContext';
import { currentTime, toDateKey } from '../lib/date';
import { takeDraftPhoto } from '../lib/draftPhoto';
import { supabase } from '../lib/supabase';
import { mealTypes, type Meal, type MealType } from '../lib/types';

export function MealPage() {
  const { id } = useParams(); const { user } = useAuth(); const { notify } = useToast(); const { confirm } = useConfirmDialog(); const navigate = useNavigate();
  const cameraRef = useRef<HTMLInputElement>(null); const libraryRef = useRef<HTMLInputElement>(null);
  const [initialValues] = useState(() => ({ date: toDateKey(new Date()), time: currentTime() }));
  const [meal, setMeal] = useState<Meal | null>(null); const [file, setFile] = useState<File | null>(() => id ? null : takeDraftPhoto());
  const [preview, setPreview] = useState(''); const [date, setDate] = useState(initialValues.date); const [time, setTime] = useState(initialValues.time);
  const [type, setType] = useState<MealType | null>(null); const [note, setNote] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [photoSourceVisible, setPhotoSourceVisible] = useState(false);
  useEffect(() => { if (!file) return; const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const hasUnsavedChanges = !id && Boolean(file || type || note.trim() || date !== initialValues.date || time !== initialValues.time);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (!hasUnsavedChanges) return; event.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [hasUnsavedChanges]);
  useEffect(() => { if (!id) return; void (async () => {
    const { data, error } = await supabase.from('meals').select('*').eq('id', id).single(); if (error || !data) return setError('Não foi possível abrir esta refeição.');
    const row = data as Meal; setMeal(row); setDate(row.meal_date); setTime(row.meal_time.slice(0, 5)); setType(row.meal_type); setNote(row.note ?? '');
    setPreview((await supabase.storage.from('meal-photos').createSignedUrl(row.photo_path, 3600)).data?.signedUrl ?? '');
  })(); }, [id]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return setError('Confira a data e o horário.');
    if (!id && !file) return setError('Adicione uma foto da refeição.'); if (!user) return; setSaving(true);
    try {
      if (id) {
        const { error } = await supabase.from('meals').update({ meal_date: date, meal_time: time, meal_type: type, note: note.trim() || null }).eq('id', id); if (error) throw error;
      } else if (file) {
        const extension = (file.name.split('.').pop() || file.type.split('/').pop() || 'jpg').replace('jpeg', 'jpg'); const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('meal-photos').upload(path, file, { contentType: file.type || 'image/jpeg' }); if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from('meals').insert({ user_id: user.id, meal_date: date, meal_time: time, meal_type: type, note: note.trim() || null, photo_path: path });
        if (insertError) { await supabase.storage.from('meal-photos').remove([path]); throw insertError; }
      }
      notify({ tone: 'success', title: id ? 'Refeição atualizada' : 'Refeição adicionada' }); navigate('/diary', { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.'); } finally { setSaving(false); }
  }
  async function remove() {
    if (!meal || !await confirm({ title: 'Excluir refeição?', message: 'A foto e a observação serão removidas definitivamente.', confirmLabel: 'Excluir', tone: 'danger' })) return;
    const { error } = await supabase.from('meals').delete().eq('id', meal.id); if (error) return setError(error.message);
    await supabase.storage.from('meal-photos').remove([meal.photo_path]); navigate('/diary', { replace: true });
  }
  async function goBack() {
    if (hasUnsavedChanges && !await confirm({ title: 'Sair sem salvar?', message: 'Deseja sair sem salvar esta refeição? A foto e os dados preenchidos serão descartados.', confirmLabel: 'Sair sem salvar', tone: 'danger' })) return;
    navigate(-1);
  }
  const choose = (selected?: File) => { if (selected) setFile(selected); };
  return <div className="page editor-page"><ScreenHeader back onBack={() => void goBack()} title={id ? 'Sua refeição' : 'Nova refeição'} action={id ? <button className="icon-button danger" onClick={() => void remove()}><Trash2 /></button> : null} />
    <form className="editor-panel" onSubmit={save}>
      <button type="button" className={`photo-picker ${preview ? 'filled' : ''}`} onClick={() => !id && setPhotoSourceVisible(true)}>{preview ? <img src={preview} alt="Refeição" /> : <><span><Camera /></span><strong>Adicionar foto</strong><small>Câmera ou galeria</small></>}</button>
      {!id && preview && <div className="photo-actions"><button type="button" onClick={() => setPhotoSourceVisible(true)}><ImageIcon /> Trocar foto</button></div>}
      <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={libraryRef} hidden type="file" accept="image/*" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="form-row"><label>Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Horário<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label></div>
      <fieldset><legend>Tipo de refeição <small>opcional</small></legend><div className="chips">{mealTypes.map((item) => <button type="button" key={item} className={type === item ? 'active' : ''} onClick={() => setType(type === item ? null : item)}>{item}</button>)}</div></fieldset>
      <label>Observação<div className="textarea-wrap"><Leaf /><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Como estava a refeição?" /></div></label>
      {error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={saving}><Check />{saving ? 'Salvando...' : 'Salvar refeição'}</button>
    </form><PhotoSourceModal visible={photoSourceVisible} title={preview ? 'Trocar foto' : 'Adicionar foto'} description="Escolha como deseja adicionar a fotografia da refeição." onClose={() => setPhotoSourceVisible(false)} onCamera={() => cameraRef.current?.click()} onLibrary={() => libraryRef.current?.click()} />
  </div>;
}
