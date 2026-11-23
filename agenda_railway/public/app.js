const $ = id => document.getElementById(id);
const STORAGE_KEY = 'agenda_personal_tasks_v1';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';
let editingId = null;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const prettyDate = value => {
  if (!value) return 'Sin fecha';
  return new Date(value + 'T12:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'});
};
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function render() {
  const done = tasks.filter(t => t.done).length;
  const pending = tasks.length - done;
  $('totalStat').textContent = tasks.length;
  $('pendingStat').textContent = pending;
  $('doneStat').textContent = done;
  $('allCount').textContent = tasks.length;
  const percent = tasks.length ? Math.round(done/tasks.length*100) : 0;
  $('progressText').textContent = percent + '%';
  $('progressBar').style.width = percent + '%';

  const names = {all:'Todas las tareas',today:'Para hoy',upcoming:'Próximas',done:'Completadas'};
  $('crumb').textContent = names[currentFilter];
  $('listTitle').textContent = names[currentFilter];
  $('pageTitle').innerHTML = currentFilter === 'today' ? 'Lo que toca hoy<span>.</span>' : currentFilter === 'done' ? 'Mira lo que lograste<span>.</span>' : 'Tu día, a tu manera<span>.</span>';
  $('listSubtitle').textContent = currentFilter === 'today' ? 'Tus actividades programadas para hoy.' : currentFilter === 'done' ? 'Cada tarea terminada es un avance.' : 'Aquí aparecerán tus actividades.';
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.filter === currentFilter));

  let shown = tasks.filter(t => {
    if (currentFilter === 'today' && t.date !== today()) return false;
    if (currentFilter === 'upcoming' && (t.date <= today() || t.done)) return false;
    if (currentFilter === 'done' && !t.done) return false;
    const category = $('categoryFilter').value;
    return category === 'all' || t.category === category;
  }).sort((a,b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''));

  $('taskList').innerHTML = shown.map(t => `
    <div class="task-row ${t.done?'is-done':''}">
      <div class="task-name"><input class="check-task" type="checkbox" aria-label="Completar tarea" data-action="toggle" data-id="${t.id}" ${t.done?'checked':''}><div style="min-width:0"><div class="task-title">${escapeHTML(t.name)}</div>${t.notes?`<div class="task-notes">${escapeHTML(t.notes)}</div>`:''}</div></div>
      <div class="task-date">${prettyDate(t.date)}${t.time?`<span class="task-time">${escapeHTML(t.time)}</span>`:''}</div>
      <div><span class="category-pill category-${t.category}">${t.category}</span></div>
      <div><span class="status-pill ${t.done?'status-done':'status-pending'}">${t.done?'Completada':'Pendiente'}</span></div>
      <button class="more-btn" title="Editar o eliminar" data-action="menu" data-id="${t.id}">•••</button>
    </div>`).join('');
  $('emptyState').style.display = shown.length ? 'none' : 'block';
}
function openModal(task=null) {
  editingId = task ? task.id : null;
  $('modalTitle').textContent = task ? 'Editar tarea' : 'Nueva tarea';
  $('taskName').value = task?.name || '';
  $('taskDate').value = task?.date || today();
  $('taskTime').value = task?.time || '';
  $('taskCategory').value = task?.category || 'Personal';
  $('taskNotes').value = task?.notes || '';
  $('modalBackdrop').classList.add('show');
  $('taskName').focus();
}
function closeModal(){ $('modalBackdrop').classList.remove('show'); editingId=null; }
$('openModal').addEventListener('click',()=>openModal());
$('emptyAdd').addEventListener('click',()=>openModal());
$('closeModal').addEventListener('click',closeModal);
$('cancelModal').addEventListener('click',closeModal);
$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
$('taskForm').addEventListener('submit',e=>{
  e.preventDefault();
  const data={name:$('taskName').value.trim(),date:$('taskDate').value,time:$('taskTime').value,category:$('taskCategory').value,notes:$('taskNotes').value.trim()};
  if(!data.name || !data.date) return;
  if(editingId){const old=tasks.find(t=>t.id===editingId);Object.assign(old,data);}
  else tasks.push({id:crypto.randomUUID(),...data,done:false,createdAt:Date.now()});
  save();closeModal();render();
});
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{currentFilter=b.dataset.filter;render();}));
$('categoryFilter').addEventListener('change',render);
$('taskList').addEventListener('change',e=>{
  if(e.target.dataset.action==='toggle'){
    const task=tasks.find(t=>t.id===e.target.dataset.id);
    if(task){task.done=e.target.checked;save();render();}
  }
});
$('taskList').addEventListener('click',e=>{
  const btn=e.target.closest('[data-action="menu"]');
  if(!btn)return;
  const task=tasks.find(t=>t.id===btn.dataset.id);
  if(!task)return;
  const action=prompt(`Tarea: ${task.name}\nEscribe "editar" o "eliminar":`,'editar');
  if(action?.toLowerCase()==='editar')openModal(task);
  if(action?.toLowerCase()==='eliminar' && confirm('¿Seguro que quieres eliminar esta tarea?')){
    tasks=tasks.filter(t=>t.id!==task.id);save();render();
  }
});
$('dateChip').textContent = new Date().toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'});
const hour=new Date().getHours();
$('greeting').textContent=hour<12?'BUENOS DÍAS':hour<18?'BUENAS TARDES':'BUENAS NOCHES';
render();
