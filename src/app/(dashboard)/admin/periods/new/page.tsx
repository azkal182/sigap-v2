// 'use client'

// import { useState } from 'react'

// import { useRouter } from 'next/navigation'

// import type { z } from 'zod'

// import { TemplateSchema, type FieldType, type Template } from '@/schemas/survey-schemas'

// import { useCreatePeriod } from '@/hooks/usePeriods'

// // ---------- Utilities ----------
// function slugifyKey(s: string) {
//   return s
//     .trim()
//     .replace(/[^\w\s-]/g, '')
//     .replace(/\s+/g, '_')
//     .replace(/_+/g, '_')
//     .toLowerCase()
// }

// function ensureCommentsForRatings(tpl: Template): Template {
//   const cloned: Template = JSON.parse(JSON.stringify(tpl))

//   cloned.fields = cloned.fields.map(f => {
//     if (f.type !== 'rating_5') return f
//     const key = f.key
//     const noteKey = f.comment?.key || `${key}_note`

//     return {
//       ...f,
//       stat: true, // rating selalu ikut statistik
//       comment: {
//         enabled: true,
//         key: noteKey,
//         label: f.comment?.label || 'Komentar / Alasan Penilaian',
//         required: true // SELALU wajib meskipun bintang 5
//         // showWhenRatingLTE TIDAK dipakai agar selalu tampil
//       }
//     }
//   })

//   // pastikan stat untuk nps_11 juga true (kalau ada)
//   cloned.fields = cloned.fields.map(f => (f.type === 'nps_11' ? { ...f, stat: true } : f))

//   // default meta
//   cloned.meta = cloned.meta || { enableUploads: false, uploadFields: [] }

//   return cloned
// }

// function makePondokDefaultTemplate(): Template {
//   const rating = (key: string, label: string) => ({
//     key,
//     label,
//     type: 'rating_5' as const,
//     required: true,
//     stat: true,
//     comment: {
//       enabled: true,
//       key: `${key}_note`,
//       label: 'Komentar / Alasan Penilaian',
//       required: true
//     }
//   })

//   const base: Template = {
//     version: 4,
//     title: 'Survey Wali Santri & Arsip Data',
//     meta: {
//       enableUploads: true,
//       uploadFields: [
//         { key: 'familyCard', label: 'Kartu Keluarga', required: true, accept: 'image/*,application/pdf' },
//         { key: 'certificate', label: 'Ijazah', required: false, accept: 'image/*,application/pdf' },
//         { key: 'birthCertificate', label: 'Akta Kelahiran', required: false, accept: 'image/*,application/pdf' }
//       ]
//     },
//     fields: [
//       rating('generalSatisfaction', 'Kepuasan Umum'),
//       rating('dormCleanliness', 'Kebersihan Asrama'),
//       rating('foodQuality', 'Kualitas Makanan'),
//       rating('securityDiscipline', 'Keamanan & Kedisiplinan'),
//       rating('religiousActivities', 'Kegiatan Keagamaan'),
//       rating('teacherCommunication', 'Komunikasi dengan Pengasuh/Ustadz'),
//       rating('facilities', 'Fasilitas'),
//       rating('healthService', 'Layanan Kesehatan'),
//       rating('administration', 'Pelayanan Administrasi'),
//       rating('financeTransparency', 'Transparansi Keuangan'),
//       rating('academicCoaching', 'Kegiatan Akademik/Pembinaan'),
//       {
//         key: 'npsRecommend',
//         label: 'Rekomendasi (NPS 0–10)',
//         type: 'nps_11',
//         required: true,
//         stat: true,
//         comment: {
//           enabled: false,
//           required: true
//         }
//       },
//       {
//         key: 'feedback',
//         label: 'Saran & Masukan',
//         type: 'text_long',
//         required: false,
//         stat: false,
//         comment: {
//           enabled: false,
//           required: true
//         }
//       }
//     ]
//   }

//   return ensureCommentsForRatings(base)
// }

// // ---------- Page ----------
// export default function NewPeriodPage() {
//   const router = useRouter()
//   const create = useCreatePeriod()

//   const [name, setName] = useState('')
//   const [startsAt, setStartsAt] = useState<string>('')
//   const [endsAt, setEndsAt] = useState<string>('')

//   // default langsung pakai template pondok lengkap (siap pakai)
//   const [template, setTemplate] = useState<Template>(makePondokDefaultTemplate())
//   const [jsonText, setJsonText] = useState(JSON.stringify(template, null, 2))
//   const [err, setErr] = useState<string>('')

//   const syncJsonToState = () => {
//     try {
//       const obj = JSON.parse(jsonText)
//       const parsed = TemplateSchema.parse(obj)

//       setTemplate(parsed)
//       setErr('')
//       alert('Template valid ✅ & disinkronkan')
//     } catch (e: any) {
//       setErr(String(e?.message ?? e))
//     }
//   }

//   const syncStateToJson = () => {
//     setJsonText(JSON.stringify(template, null, 2))
//     setErr('')
//   }

//   // ---------- Builder Cepat ----------
//   const addField = (type: z.infer<typeof FieldType>) => {
//     const label = prompt('Label field:')

//     if (!label) return
//     const key = slugifyKey(prompt('Key field (otomatis akan dinormalisasi):') || label)

//     let f: any = {
//       key,
//       label,
//       type,
//       required: false,
//       stat: type === 'rating_5' || type === 'nps_11',
//       comment: { enabled: false }
//     }

//     if (type === 'rating_5') {
//       f = {
//         ...f,
//         required: true,
//         stat: true,
//         comment: {
//           enabled: true,
//           key: `${key}_note`,
//           label: 'Komentar / Alasan Penilaian',
//           required: true
//         }
//       }
//     }

//     const next = { ...template, fields: [...template.fields, f] }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   const usePondokPreset = () => {
//     const t = makePondokDefaultTemplate()

//     setTemplate(t)
//     setJsonText(JSON.stringify(t, null, 2))
//   }

//   // ---------- Upload Meta Builder ----------
//   const toggleUploads = (enable: boolean) => {
//     const meta = template.meta || { enableUploads: false, uploadFields: [] }
//     const next = { ...template, meta: { ...meta, enableUploads: enable } }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   const addUploadField = () => {
//     const label = prompt('Label dokumen:')

//     if (!label) return
//     const key = slugifyKey(prompt('Key dokumen (otomatis dinormalisasi):') || label)
//     const required = confirm('Wajib diupload? (OK = Ya, Cancel = Tidak)')
//     const accept = prompt('Accept types (kosongkan jika bebas). Contoh: image/*,application/pdf') || undefined

//     const meta = template.meta || { enableUploads: true, uploadFields: [] }
//     const up = [...meta.uploadFields, { key, label, required, accept }]
//     const next = { ...template, meta: { ...meta, enableUploads: true, uploadFields: up } }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   const removeUploadField = (key: string) => {
//     const meta = template.meta || { enableUploads: false, uploadFields: [] }
//     const up = meta.uploadFields.filter(u => u.key !== key)
//     const next = { ...template, meta: { ...meta, uploadFields: up } }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   // ---------- Submit ----------
//   const onSubmit = async () => {
//     if (!name.trim()) return alert('Nama periode wajib diisi')

//     try {
//       // Normalisasi akhir: semua rating wajib comment, stat untuk numerik
//       const normalized = ensureCommentsForRatings(template)
//       const parsed = TemplateSchema.parse(normalized)

//       await create.mutateAsync({
//         name,
//         startsAt: startsAt || undefined,
//         endsAt: endsAt || undefined,
//         template: parsed
//       })

//       router.push('/admin/periods')
//     } catch (e: any) {
//       alert('Gagal: ' + (e?.message ?? e))
//     }
//   }

//   return (
//     <main style={{ maxWidth: 1100, margin: '24px auto', padding: 16 }}>
//       <h1>Tambah Periode</h1>

//       <section
//         style={{
//           display: 'grid',
//           gridTemplateColumns: '1fr 1fr',
//           gap: 16,
//           alignItems: 'start',
//           marginTop: 12
//         }}
//       >
//         {/* Kiri: Form & Builder */}
//         <div>
//           <label>Nama Periode</label>
//           <br />
//           <input
//             value={name}
//             onChange={e => setName(e.target.value)}
//             placeholder='Mis. Semester Ganjil 2025/2026'
//             style={input}
//           />

//           <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
//             <div>
//               <label>Mulai</label>
//               <br />
//               <input type='date' value={startsAt} onChange={e => setStartsAt(e.target.value)} style={input} />
//             </div>
//             <div>
//               <label>Selesai</label>
//               <br />
//               <input type='date' value={endsAt} onChange={e => setEndsAt(e.target.value)} style={input} />
//             </div>
//           </div>

//           <div style={{ marginTop: 16, padding: '12px', border: '1px solid #eee', borderRadius: 8 }}>
//             <h3 style={{ marginTop: 0 }}>Template Cepat</h3>
//             <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
//               <button onClick={() => addField('rating_5')}>+ Rating 1–5 (wajib komentar)</button>
//               <button onClick={() => addField('nps_11')}>+ NPS 0–10</button>
//               <button onClick={() => addField('text_long')}>+ Text Panjang</button>
//               <button onClick={() => addField('file')}>+ File (dalam fields)</button>
//               <button onClick={usePondokPreset} style={{ marginLeft: 'auto' }}>
//                 Gunakan Template Pondok (lengkap)
//               </button>
//             </div>

//             <ul style={{ marginTop: 12, maxHeight: 260, overflow: 'auto', paddingRight: 8 }}>
//               {template.fields.map(f => (
//                 <li
//                   key={f.key}
//                   style={{
//                     padding: '6px 8px',
//                     border: '1px solid #eee',
//                     marginBottom: 6,
//                     borderRadius: 6,
//                     background: f.type === 'rating_5' ? '#fafcff' : 'white'
//                   }}
//                 >
//                   <b>{f.label}</b> <small>({f.key})</small> — <code>{f.type}</code>
//                   {f.required && <em> · required</em>} {f.stat && <em> · stat</em>}
//                   {f.type === 'rating_5' && (
//                     <>
//                       {' '}
//                       · <span style={{ color: '#1e88e5' }}>comment: wajib</span>{' '}
//                       {f.comment?.key && (
//                         <>
//                           (<code>{f.comment.key}</code>)
//                         </>
//                       )}
//                     </>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Upload Meta */}
//           <div style={{ marginTop: 16, padding: '12px', border: '1px solid #eee', borderRadius: 8 }}>
//             <h3 style={{ marginTop: 0 }}>Upload Dokumen (per-periode)</h3>

//             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//               <input
//                 id='toggle-upload'
//                 type='checkbox'
//                 checked={!!template.meta?.enableUploads}
//                 onChange={e => toggleUploads(e.target.checked)}
//               />
//               <label htmlFor='toggle-upload'>Aktifkan Upload Dokumen</label>
//               <button onClick={addUploadField} disabled={!template.meta?.enableUploads} style={{ marginLeft: 'auto' }}>
//                 + Tambah Field Upload
//               </button>
//             </div>

//             {template.meta?.enableUploads && (
//               <ul style={{ marginTop: 12 }}>
//                 {template.meta.uploadFields.map(u => (
//                   <li
//                     key={u.key}
//                     style={{
//                       padding: '6px 8px',
//                       border: '1px solid #eee',
//                       marginBottom: 6,
//                       borderRadius: 6
//                     }}
//                   >
//                     <b>{u.label}</b> <small>({u.key})</small> {u.required && <em> · required</em>}
//                     {u.accept && (
//                       <>
//                         {' '}
//                         · <code>{u.accept}</code>
//                       </>
//                     )}
//                     <button
//                       onClick={() => removeUploadField(u.key)}
//                       style={{
//                         marginLeft: 8,
//                         color: '#b00020',
//                         border: '1px solid #b00020',
//                         padding: '2px 8px',
//                         borderRadius: 6
//                       }}
//                     >
//                       Hapus
//                     </button>
//                   </li>
//                 ))}
//                 {!template.meta.uploadFields.length && <li>Tidak ada field upload.</li>}
//               </ul>
//             )}
//           </div>
//         </div>

//         {/* Kanan: Editor JSON */}
//         <div>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <h3 style={{ marginTop: 0 }}>Template JSON</h3>
//             <div style={{ display: 'flex', gap: 8 }}>
//               <button onClick={syncJsonToState}>Validasi & Sinkron → State</button>
//               <button onClick={syncStateToJson}>← Refresh dari State</button>
//             </div>
//           </div>

//           <textarea
//             value={jsonText}
//             onChange={e => setJsonText(e.target.value)}
//             rows={28}
//             style={{ width: '100%', fontFamily: 'monospace' }}
//           />
//           {!!err && <p style={{ color: 'crimson' }}>❌ {err}</p>}
//         </div>
//       </section>

//       <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
//         <button onClick={onSubmit} disabled={create.isPending}>
//           {create.isPending ? 'Menyimpan...' : 'Simpan Periode'}
//         </button>
//         <button onClick={() => history.back()} type='button'>
//           Batal
//         </button>
//       </div>
//     </main>
//   )
// }

// const input: React.CSSProperties = {
//   padding: '8px 10px',
//   border: '1px solid #ddd',
//   borderRadius: 6,
//   width: '100%',
//   marginTop: 4
// }

// 'use client'

// import { useState } from 'react'

// import { useRouter } from 'next/navigation'

// import type { z } from 'zod'

// import {
//   Container,
//   Box,
//   Grid,
//   Paper,
//   Stack,
//   Typography,
//   TextField,
//   Button,
//   Divider,
//   List,
//   ListItem,
//   ListItemText,
//   Chip,
//   Checkbox,
//   FormControlLabel,
//   Alert
// } from '@mui/material'

// import { TemplateSchema, type FieldType, type Template } from '@/schemas/survey-schemas'
// import { useCreatePeriod } from '@/hooks/usePeriods'

// // ---------- Utilities ----------
// function slugifyKey(s: string) {
//   return s
//     .trim()
//     .replace(/[^\w\s-]/g, '')
//     .replace(/\s+/g, '_')
//     .replace(/_+/g, '_')
//     .toLowerCase()
// }

// function ensureCommentsForRatings(tpl: Template): Template {
//   const cloned: Template = JSON.parse(JSON.stringify(tpl))

//   cloned.fields = cloned.fields.map(f => {
//     if (f.type !== 'rating_5') return f
//     const key = f.key
//     const noteKey = f.comment?.key || `${key}_note`

//     return {
//       ...f,
//       stat: true,
//       comment: {
//         enabled: true,
//         key: noteKey,
//         label: f.comment?.label || 'Komentar / Alasan Penilaian',
//         required: true
//       }
//     }
//   })

//   cloned.fields = cloned.fields.map(f => (f.type === 'nps_11' ? { ...f, stat: true } : f))
//   cloned.meta = cloned.meta || { enableUploads: false, uploadFields: [] }

//   return cloned
// }

// function makePondokDefaultTemplate(): Template {
//   const rating = (key: string, label: string) => ({
//     key,
//     label,
//     type: 'rating_5' as const,
//     required: true,
//     stat: true,
//     comment: {
//       enabled: true,
//       key: `${key}_note`,
//       label: 'Komentar / Alasan Penilaian',
//       required: true
//     }
//   })

//   const base: Template = {
//     version: 4,
//     title: 'Survey Wali Santri & Arsip Data',
//     meta: {
//       enableUploads: true,
//       uploadFields: [
//         { key: 'familyCard', label: 'Kartu Keluarga', required: true, accept: 'image/*,application/pdf' },
//         { key: 'certificate', label: 'Ijazah', required: false, accept: 'image/*,application/pdf' },
//         { key: 'birthCertificate', label: 'Akta Kelahiran', required: false, accept: 'image/*,application/pdf' }
//       ]
//     },
//     fields: [
//       rating('generalSatisfaction', 'Kepuasan Umum'),
//       rating('dormCleanliness', 'Kebersihan Asrama'),
//       rating('foodQuality', 'Kualitas Makanan'),
//       rating('securityDiscipline', 'Keamanan & Kedisiplinan'),
//       rating('religiousActivities', 'Kegiatan Keagamaan'),
//       rating('teacherCommunication', 'Komunikasi dengan Pengasuh/Ustadz'),
//       rating('facilities', 'Fasilitas'),
//       rating('healthService', 'Layanan Kesehatan'),
//       rating('administration', 'Pelayanan Administrasi'),
//       rating('financeTransparency', 'Transparansi Keuangan'),
//       rating('academicCoaching', 'Kegiatan Akademik/Pembinaan'),
//       {
//         key: 'npsRecommend',
//         label: 'Rekomendasi (NPS 0–10)',
//         type: 'nps_11',
//         required: true,
//         stat: true,
//         comment: { enabled: false, required: true }
//       },
//       {
//         key: 'feedback',
//         label: 'Saran & Masukan',
//         type: 'text_long',
//         required: false,
//         stat: false,
//         comment: { enabled: false, required: true }
//       }
//     ]
//   }

//   return ensureCommentsForRatings(base)
// }

// // ---------- Page ----------
// export default function NewPeriodPage() {
//   const router = useRouter()
//   const create = useCreatePeriod()

//   const [name, setName] = useState('')
//   const [startsAt, setStartsAt] = useState<string>('')
//   const [endsAt, setEndsAt] = useState<string>('')

//   const [template, setTemplate] = useState<Template>(makePondokDefaultTemplate())
//   const [jsonText, setJsonText] = useState(JSON.stringify(template, null, 2))
//   const [err, setErr] = useState<string>('')

//   const syncJsonToState = () => {
//     try {
//       const obj = JSON.parse(jsonText)
//       const parsed = TemplateSchema.parse(obj)

//       setTemplate(parsed)
//       setErr('')
//       alert('Template valid ✅ & disinkronkan')
//     } catch (e: any) {
//       setErr(String(e?.message ?? e))
//     }
//   }

//   const syncStateToJson = () => {
//     setJsonText(JSON.stringify(template, null, 2))
//     setErr('')
//   }

//   // ---------- Builder Cepat ----------
//   const addField = (type: z.infer<typeof FieldType>) => {
//     const label = prompt('Label field:')

//     if (!label) return
//     const key = slugifyKey(prompt('Key field (otomatis akan dinormalisasi):') || label)

//     let f: any = {
//       key,
//       label,
//       type,
//       required: false,
//       stat: type === 'rating_5' || type === 'nps_11',
//       comment: { enabled: false }
//     }

//     if (type === 'rating_5') {
//       f = {
//         ...f,
//         required: true,
//         stat: true,
//         comment: {
//           enabled: true,
//           key: `${key}_note`,
//           label: 'Komentar / Alasan Penilaian',
//           required: true
//         }
//       }
//     }

//     const next = { ...template, fields: [...template.fields, f] }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   const usePondokPreset = () => {
//     const t = makePondokDefaultTemplate()

//     setTemplate(t)
//     setJsonText(JSON.stringify(t, null, 2))
//   }

//   // ---------- Upload Meta Builder ----------
//   const toggleUploads = (enable: boolean) => {
//     const meta = template.meta || { enableUploads: false, uploadFields: [] }
//     const next = { ...template, meta: { ...meta, enableUploads: enable } }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   const addUploadField = () => {
//     const label = prompt('Label dokumen:')

//     if (!label) return
//     const key = slugifyKey(prompt('Key dokumen (otomatis dinormalisasi):') || label)
//     const required = confirm('Wajib diupload? (OK = Ya, Cancel = Tidak)')
//     const accept = prompt('Accept types (kosongkan jika bebas). Contoh: image/*,application/pdf') || undefined

//     const meta = template.meta || { enableUploads: true, uploadFields: [] }
//     const up = [...meta.uploadFields, { key, label, required, accept }]
//     const next = { ...template, meta: { ...meta, enableUploads: true, uploadFields: up } }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   const removeUploadField = (key: string) => {
//     const meta = template.meta || { enableUploads: false, uploadFields: [] }
//     const up = meta.uploadFields.filter(u => u.key !== key)
//     const next = { ...template, meta: { ...meta, uploadFields: up } }

//     setTemplate(next)
//     setJsonText(JSON.stringify(next, null, 2))
//   }

//   // ---------- Submit ----------
//   const onSubmit = async () => {
//     if (!name.trim()) return alert('Nama periode wajib diisi')

//     try {
//       const normalized = ensureCommentsForRatings(template)
//       const parsed = TemplateSchema.parse(normalized)

//       await create.mutateAsync({
//         name,
//         startsAt: startsAt || undefined,
//         endsAt: endsAt || undefined,
//         template: parsed
//       })

//       router.push('/admin/periods')
//     } catch (e: any) {
//       alert('Gagal: ' + (e?.message ?? e))
//     }
//   }

//   return (
//     <Container maxWidth='lg' className='py-6'>
//       <Typography variant='h5' fontWeight={600} className='mb-4'>
//         Tambah Periode
//       </Typography>

//       <Grid container spacing={2} alignItems='flex-start'>
//         {/* Kiri: Form & Builder */}
//         <Grid item xs={12} md={6}>
//           <Paper variant='outlined' className='p-4'>
//             <Stack spacing={2}>
//               <TextField
//                 label='Nama Periode'
//                 value={name}
//                 onChange={e => setName(e.target.value)}
//                 placeholder='Mis. Semester Ganjil 2025/2026'
//                 fullWidth
//               />

//               <Stack direction='row' spacing={1}>
//                 <TextField
//                   label='Mulai'
//                   type='date'
//                   value={startsAt}
//                   onChange={e => setStartsAt(e.target.value)}
//                   fullWidth
//                   InputLabelProps={{ shrink: true }}
//                 />
//                 <TextField
//                   label='Selesai'
//                   type='date'
//                   value={endsAt}
//                   onChange={e => setEndsAt(e.target.value)}
//                   fullWidth
//                   InputLabelProps={{ shrink: true }}
//                 />
//               </Stack>
//             </Stack>
//           </Paper>

//           <Paper variant='outlined' className='p-4 mt-4'>
//             <Stack direction='row' justifyContent='space-between' alignItems='center'>
//               <Typography variant='h6'>Template Cepat</Typography>
//               <Button onClick={usePondokPreset} variant='contained' size='small'>
//                 Gunakan Template Pondok (lengkap)
//               </Button>
//             </Stack>

//             <Stack direction='row' spacing={1} useFlexGap className='flex-wrap mt-3'>
//               <Button onClick={() => addField('rating_5')} variant='outlined' size='small'>
//                 + Rating 1–5 (wajib komentar)
//               </Button>
//               <Button onClick={() => addField('nps_11')} variant='outlined' size='small'>
//                 + NPS 0–10
//               </Button>
//               <Button onClick={() => addField('text_long')} variant='outlined' size='small'>
//                 + Text Panjang
//               </Button>
//               <Button onClick={() => addField('file')} variant='outlined' size='small'>
//                 + File (dalam fields)
//               </Button>
//             </Stack>

//             <Divider className='my-3' />

//             <Box className='max-h-72 overflow-auto pr-2'>
//               <List dense>
//                 {template.fields.map(f => (
//                   <ListItem
//                     key={f.key}
//                     sx={{
//                       border: '1px solid',
//                       borderColor: 'divider',
//                       borderRadius: 1,
//                       mb: 1,
//                       bgcolor: f.type === 'rating_5' ? 'action.hover' : 'background.paper'
//                     }}
//                   >
//                     <ListItemText
//                       primary={
//                         <Stack direction='row' spacing={1} alignItems='center'>
//                           <Typography fontWeight={600}>{f.label}</Typography>
//                           <Typography variant='body2' color='text.secondary'>
//                             ({f.key})
//                           </Typography>
//                           <Chip size='small' label={f.type} />
//                           {f.required && <Chip size='small' variant='outlined' label='required' />}
//                           {f.stat && <Chip size='small' variant='outlined' label='stat' />}
//                           {f.type === 'rating_5' && (
//                             <Chip
//                               size='small'
//                               color='primary'
//                               variant='outlined'
//                               label={`comment: wajib${f.comment?.key ? ` (${f.comment.key})` : ''}`}
//                             />
//                           )}
//                         </Stack>
//                       }
//                     />
//                   </ListItem>
//                 ))}
//                 {!template.fields.length && <Alert severity='info'>Belum ada field.</Alert>}
//               </List>
//             </Box>
//           </Paper>

//           {/* Upload Meta */}
//           <Paper variant='outlined' className='p-4 mt-4'>
//             <Typography variant='h6'>Upload Dokumen (per-periode)</Typography>

//             <Stack direction='row' alignItems='center' spacing={1} className='mt-2'>
//               <FormControlLabel
//                 control={
//                   <Checkbox checked={!!template.meta?.enableUploads} onChange={e => toggleUploads(e.target.checked)} />
//                 }
//                 label='Aktifkan Upload Dokumen'
//               />
//               <Box className='ml-auto' />
//               <Button onClick={addUploadField} disabled={!template.meta?.enableUploads} variant='outlined' size='small'>
//                 + Tambah Field Upload
//               </Button>
//             </Stack>

//             {template.meta?.enableUploads && (
//               <List className='mt-3'>
//                 {template.meta.uploadFields.map(u => (
//                   <ListItem
//                     key={u.key}
//                     sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}
//                     secondaryAction={
//                       <Button onClick={() => removeUploadField(u.key)} color='error' variant='outlined' size='small'>
//                         Hapus
//                       </Button>
//                     }
//                   >
//                     <ListItemText
//                       primary={
//                         <Stack direction='row' spacing={1} alignItems='center'>
//                           <Typography fontWeight={600}>{u.label}</Typography>
//                           <Typography variant='body2' color='text.secondary'>
//                             ({u.key})
//                           </Typography>
//                           {u.required && <Chip size='small' variant='outlined' label='required' />}
//                           {u.accept && <Chip size='small' label={u.accept} />}
//                         </Stack>
//                       }
//                     />
//                   </ListItem>
//                 ))}
//                 {!template.meta.uploadFields.length && <Typography>Tidak ada field upload.</Typography>}
//               </List>
//             )}
//           </Paper>
//         </Grid>

//         {/* Kanan: Editor JSON */}
//         <Grid item xs={12} md={6}>
//           <Paper variant='outlined' className='p-4'>
//             <Stack direction='row' justifyContent='space-between' alignItems='center'>
//               <Typography variant='h6'>Template JSON</Typography>
//               <Stack direction='row' spacing={1}>
//                 <Button onClick={syncJsonToState} variant='contained' size='small'>
//                   Validasi & Sinkron → State
//                 </Button>
//                 <Button onClick={syncStateToJson} variant='outlined' size='small'>
//                   ← Refresh dari State
//                 </Button>
//               </Stack>
//             </Stack>

//             <TextField
//               value={jsonText}
//               onChange={e => setJsonText(e.target.value)}
//               multiline
//               rows={28}
//               fullWidth
//               className='mt-3'
//               InputProps={{
//                 sx: {
//                   fontFamily:
//                     'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
//                 }
//               }}
//             />

//             {!!err && (
//               <Alert severity='error' className='mt-3'>
//                 ❌ {err}
//               </Alert>
//             )}
//           </Paper>
//         </Grid>
//       </Grid>

//       <Stack direction='row' spacing={1.5} className='mt-4'>
//         <Button onClick={onSubmit} disabled={create.isPending} variant='contained'>
//           {create.isPending ? 'Menyimpan...' : 'Simpan Periode'}
//         </Button>
//         <Button onClick={() => history.back()} type='button' variant='text'>
//           Batal
//         </Button>
//       </Stack>
//     </Container>
//   )
// }

'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import type { z } from 'zod'

import {
  Container,
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Checkbox,
  FormControlLabel,
  Alert,
  ListItemSecondaryAction
} from '@mui/material'

import { TemplateSchema, type FieldType, type Template } from '@/schemas/survey-schemas'
import { useCreatePeriod } from '@/hooks/usePeriods'
import CustomTextField from '@/@core/components/mui/TextField'

// ---------- Utilities (tidak diubah) ----------
function slugifyKey(s: string) {
  return s
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}

function ensureCommentsForRatings(tpl: Template): Template {
  const cloned: Template = JSON.parse(JSON.stringify(tpl))

  cloned.fields = cloned.fields.map(f => {
    if (f.type !== 'rating_5') return f
    const key = f.key
    const noteKey = f.comment?.key || `${key}_note`

    return {
      ...f,
      stat: true,
      comment: {
        enabled: true,
        key: noteKey,
        label: f.comment?.label || 'Komentar / Alasan Penilaian',
        required: true
      }
    }
  })
  cloned.fields = cloned.fields.map(f => (f.type === 'nps_11' ? { ...f, stat: true } : f))
  cloned.meta = cloned.meta || { enableUploads: false, uploadFields: [] }

  return cloned
}

function makePondokDefaultTemplate(): Template {
  const rating = (key: string, label: string) => ({
    key,
    label,
    type: 'rating_5' as const,
    required: true,
    stat: true,
    comment: {
      enabled: true,
      key: `${key}_note`,
      label: 'Komentar / Alasan Penilaian',
      required: true
    }
  })

  const base: Template = {
    version: 4,
    title: 'Survey Wali Santri & Arsip Data',
    meta: {
      enableUploads: true,
      uploadFields: [
        { key: 'familyCard', label: 'Kartu Keluarga', required: true, accept: 'image/*,application/pdf' },
        { key: 'certificate', label: 'Ijazah', required: false, accept: 'image/*,application/pdf' },
        { key: 'birthCertificate', label: 'Akta Kelahiran', required: false, accept: 'image/*,application/pdf' }
      ]
    },
    fields: [
      rating('generalSatisfaction', 'Kepuasan Umum'),
      rating('dormCleanliness', 'Kebersihan Asrama'),
      rating('foodQuality', 'Kualitas Makanan'),
      rating('securityDiscipline', 'Keamanan & Kedisiplinan'),
      rating('religiousActivities', 'Kegiatan Keagamaan'),
      rating('teacherCommunication', 'Komunikasi dengan Pengasuh/Ustadz'),
      rating('facilities', 'Fasilitas'),
      rating('healthService', 'Layanan Kesehatan'),
      rating('administration', 'Pelayanan Administrasi'),
      rating('financeTransparency', 'Transparansi Keuangan'),
      rating('academicCoaching', 'Kegiatan Akademik/Pembinaan'),
      {
        key: 'npsRecommend',
        label: 'Rekomendasi (NPS 0–10)',
        type: 'nps_11',
        required: true,
        stat: true,
        comment: { enabled: false, required: true }
      },
      {
        key: 'feedback',
        label: 'Saran & Masukan',
        type: 'text_long',
        required: false,
        stat: false,
        comment: { enabled: false, required: true }
      }
    ]
  }

  return ensureCommentsForRatings(base)
}

// ---------- Page ----------
export default function NewPeriodPage() {
  const router = useRouter()
  const create = useCreatePeriod()

  const [name, setName] = useState('')
  const [startsAt, setStartsAt] = useState<string>('')
  const [endsAt, setEndsAt] = useState<string>('')

  const [template, setTemplate] = useState<Template>(makePondokDefaultTemplate())
  const [jsonText, setJsonText] = useState(JSON.stringify(template, null, 2))
  const [err, setErr] = useState<string>('')

  const syncJsonToState = () => {
    try {
      const obj = JSON.parse(jsonText)
      const parsed = TemplateSchema.parse(obj)

      setTemplate(parsed)
      setErr('')
      alert('Template valid ✅ & disinkronkan')
    } catch (e: any) {
      setErr(String(e?.message ?? e))
    }
  }

  const syncStateToJson = () => {
    setJsonText(JSON.stringify(template, null, 2))
    setErr('')
  }

  // ---------- Builder Cepat (fungsi tetap) ----------
  const addField = (type: z.infer<typeof FieldType>) => {
    const label = prompt('Label field:')

    if (!label) return
    const key = slugifyKey(prompt('Key field (otomatis akan dinormalisasi):') || label)

    let f: any = {
      key,
      label,
      type,
      required: false,
      stat: type === 'rating_5' || type === 'nps_11',
      comment: { enabled: false }
    }

    if (type === 'rating_5') {
      f = {
        ...f,
        required: true,
        stat: true,
        comment: {
          enabled: true,
          key: `${key}_note`,
          label: 'Komentar / Alasan Penilaian',
          required: true
        }
      }
    }

    const next = { ...template, fields: [...template.fields, f] }

    setTemplate(next)
    setJsonText(JSON.stringify(next, null, 2))
  }

  const usePondokPreset = () => {
    const t = makePondokDefaultTemplate()

    setTemplate(t)
    setJsonText(JSON.stringify(t, null, 2))
  }

  // ---------- Upload Meta Builder (fungsi tetap) ----------
  const toggleUploads = (enable: boolean) => {
    const meta = template.meta || { enableUploads: false, uploadFields: [] }
    const next = { ...template, meta: { ...meta, enableUploads: enable } }

    setTemplate(next)
    setJsonText(JSON.stringify(next, null, 2))
  }

  const addUploadField = () => {
    const label = prompt('Label dokumen:')

    if (!label) return
    const key = slugifyKey(prompt('Key dokumen (otomatis dinormalisasi):') || label)
    const required = confirm('Wajib diupload? (OK = Ya, Cancel = Tidak)')
    const accept = prompt('Accept types (kosongkan jika bebas). Contoh: image/*,application/pdf') || undefined

    const meta = template.meta || { enableUploads: true, uploadFields: [] }
    const up = [...meta.uploadFields, { key, label, required, accept }]
    const next = { ...template, meta: { ...meta, enableUploads: true, uploadFields: up } }

    setTemplate(next)
    setJsonText(JSON.stringify(next, null, 2))
  }

  const removeUploadField = (key: string) => {
    const meta = template.meta || { enableUploads: false, uploadFields: [] }
    const up = meta.uploadFields.filter(u => u.key !== key)
    const next = { ...template, meta: { ...meta, uploadFields: up } }

    setTemplate(next)
    setJsonText(JSON.stringify(next, null, 2))
  }

  // ---------- Submit (tetap) ----------
  const onSubmit = async () => {
    if (!name.trim()) return alert('Nama periode wajib diisi')

    try {
      const normalized = ensureCommentsForRatings(template)
      const parsed = TemplateSchema.parse(normalized)

      await create.mutateAsync({
        name,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        template: parsed
      })
      router.push('/admin/periods')
    } catch (e: any) {
      alert('Gagal: ' + (e?.message ?? e))
    }
  }

  return (
    <Container maxWidth='lg' className='py-6' sx={{ overflowX: 'hidden' }}>
      <Typography variant='h5' fontWeight={600} className='mb-4'>
        Tambah Periode
      </Typography>

      <Grid container spacing={2} alignItems='flex-start'>
        {/* Kiri: Form & Builder */}
        <Grid item xs={12} md={6}>
          <Paper variant='outlined' className='p-4'>
            <Stack spacing={2}>
              <CustomTextField
                label='Nama Periode'
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='Mis. Semester Ganjil 2025/2026'
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                <CustomTextField
                  label='Mulai'
                  type='date'
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <CustomTextField
                  label='Selesai'
                  type='date'
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Stack>
          </Paper>

          {/* Template Cepat - responsif, tanpa horizontal scroll */}
          <Paper variant='outlined' className='p-4 mt-4'>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={1.5}
              useFlexGap
            >
              <Typography variant='h6' className='break-words'>
                Template Cepat
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button onClick={usePondokPreset} variant='contained' size='small' className='w-full sm:w-auto'>
                Gunakan Template Pondok (lengkap)
              </Button>
            </Stack>

            {/* Tombol builder grid: 1 kolom di xs, 2 di sm, 3 di md+ */}
            <Grid container spacing={1} className='mt-3'>
              <Grid item xs={12} sm={6} md={4}>
                <Button onClick={() => addField('rating_5')} variant='outlined' size='small' fullWidth>
                  + Rating 1–5 (wajib komentar)
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button onClick={() => addField('nps_11')} variant='outlined' size='small' fullWidth>
                  + NPS 0–10
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button onClick={() => addField('text_long')} variant='outlined' size='small' fullWidth>
                  + Text Panjang
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button onClick={() => addField('file')} variant='outlined' size='small' fullWidth>
                  + File (dalam fields)
                </Button>
              </Grid>
            </Grid>

            <Divider className='my-3' />

            {/* Daftar field: wrap dan break words */}
            <Box className='max-h-72 overflow-auto pr-2'>
              <List dense>
                {template.fields.map(f => (
                  <ListItem
                    key={f.key}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: f.type === 'rating_5' ? 'action.hover' : 'background.paper'
                    }}
                    className='break-words'
                  >
                    <ListItemText
                      primary={
                        <Stack direction='row' spacing={1} useFlexGap className='flex-wrap' alignItems='center'>
                          <Typography fontWeight={600} className='break-words'>
                            {f.label}
                          </Typography>
                          <Typography variant='body2' color='text.secondary' className='break-words'>
                            ({f.key})
                          </Typography>
                          <Chip size='small' label={f.type} />
                          {f.required && <Chip size='small' variant='outlined' label='required' />}
                          {f.stat && <Chip size='small' variant='outlined' label='stat' />}
                          {f.type === 'rating_5' && (
                            <Chip
                              size='small'
                              color='primary'
                              variant='outlined'
                              label={`comment: wajib${f.comment?.key ? ` (${f.comment.key})` : ''}`}
                              className='max-w-full'
                              sx={{ '.MuiChip-label': { whiteSpace: 'normal' } }}
                            />
                          )}
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
                {!template.fields.length && <Alert severity='info'>Belum ada field.</Alert>}
              </List>
            </Box>
          </Paper>

          {/* Upload Dokumen (per-periode) - responsif */}
          <Paper variant='outlined' className='p-4 mt-4'>
            <Typography variant='h6' className='break-words'>
              Upload Dokumen (per-periode)
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'start', sm: 'center' }}
              spacing={1}
              useFlexGap
              className='mt-2'
            >
              <FormControlLabel
                control={
                  <Checkbox checked={!!template.meta?.enableUploads} onChange={e => toggleUploads(e.target.checked)} />
                }
                label='Aktifkan Upload Dokumen'
              />
              <Box className='sm:ml-auto' />
              <Button
                onClick={addUploadField}
                disabled={!template.meta?.enableUploads}
                variant='outlined'
                size='small'
                className='w-full sm:w-auto'
              >
                + Tambah Field Upload
              </Button>
            </Stack>

            {template.meta?.enableUploads && (
              <List className='mt-3'>
                {template.meta.uploadFields.map(u => (
                  <ListItem
                    key={u.key}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}
                    className='break-words'
                  >
                    {/* Teks utama dengan wrap */}
                    <ListItemText
                      primary={
                        <Stack direction='row' spacing={1} useFlexGap className='flex-wrap' alignItems='center'>
                          <Typography fontWeight={600} className='break-words'>
                            {u.label}
                          </Typography>
                          <Typography variant='body2' color='text.secondary' className='break-words'>
                            ({u.key})
                          </Typography>
                          {u.required && <Chip size='small' variant='outlined' label='required' />}
                          {u.accept && (
                            <Chip
                              size='small'
                              label={u.accept}
                              className='max-w-full'
                              sx={{ '.MuiChip-label': { whiteSpace: 'normal' } }}
                            />
                          )}
                        </Stack>
                      }
                    />

                    {/* Tombol hapus: pindah ke bawah pada layar kecil */}
                    <ListItemSecondaryAction className='hidden sm:block'>
                      <Button onClick={() => removeUploadField(u.key)} color='error' variant='outlined' size='small'>
                        Hapus
                      </Button>
                    </ListItemSecondaryAction>
                    <Box className='block sm:hidden w-full mt-2'>
                      <Button
                        onClick={() => removeUploadField(u.key)}
                        color='error'
                        variant='outlined'
                        size='small'
                        fullWidth
                      >
                        Hapus
                      </Button>
                    </Box>
                  </ListItem>
                ))}
                {!template.meta.uploadFields.length && <Typography>Tidak ada field upload.</Typography>}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Kanan: Editor JSON */}
        <Grid item xs={12} md={6}>
          <Paper variant='outlined' className='p-4'>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={1}
              useFlexGap
            >
              <Typography variant='h6'>Template JSON</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                <Button onClick={syncJsonToState} variant='contained' size='small' className='w-full sm:w-auto'>
                  Validasi & Sinkron → State
                </Button>
                <Button onClick={syncStateToJson} variant='outlined' size='small' className='w-full sm:w-auto'>
                  ← Refresh dari State
                </Button>
              </Stack>
            </Stack>

            <CustomTextField
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              multiline
              rows={28}
              fullWidth
              className='mt-3'
              InputProps={{
                sx: {
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  whiteSpace: 'pre'
                }
              }}
            />

            {!!err && (
              <Alert severity='error' className='mt-3'>
                ❌ {err}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} className='mt-4' useFlexGap>
        <Button onClick={onSubmit} disabled={create.isPending} variant='contained' className='w-full sm:w-auto'>
          {create.isPending ? 'Menyimpan...' : 'Simpan Periode'}
        </Button>
        <Button onClick={() => history.back()} type='button' variant='text' className='w-full sm:w-auto'>
          Batal
        </Button>
      </Stack>
    </Container>
  )
}
