const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = "diu-nexus-v1";
const defaultData = {
  profile:{name:"DIU Student",dept:"CSE",batch:"Batch 70 · Section P"},
  courses:[], tasks:[], routine:[], notes:[], focusSessions:0
};
let data = loadData();
let taskFilter = "all";
let timer = {duration:1500,remaining:1500,interval:null,running:false};

function loadData(){
  try { return {...structuredClone(defaultData), ...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}; }
  catch { return structuredClone(defaultData); }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); renderAll(); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300);}
function gradePoint(g){return ({"A+":4,"A":3.75,"A-":3.5,"B+":3.25,"B":3,"B-":2.75,"C+":2.5,"C":2.25,"D":2,"F":0})[g] ?? null;}
function cgpa(){const graded=data.courses.filter(c=>c.grade && gradePoint(c.grade)!==null);const credits=graded.reduce((s,c)=>s+Number(c.credits),0);return credits?graded.reduce((s,c)=>s+gradePoint(c.grade)*Number(c.credits),0)/credits:0;}
function attendance(c){const total=Number(c.attended||0)+Number(c.missed||0);return total?100*Number(c.attended||0)/total:0;}
function setView(name){
  $$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));
  $$(".nav-link[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $("#pageName").textContent=({overview:"Overview",courses:"My Courses",attendance:"Attendance",routine:"Class Routine",assignments:"Assignments",notes:"Quick Notes",focus:"Focus Room",analytics:"Analytics",settings:"Settings"})[name]||name;
  $("#sidebar").classList.remove("open"); window.scrollTo({top:0,behavior:"smooth"});
  if(name==="settings")fillSettings();
}
function openModal(id){$("#"+id).classList.add("open");}
function closeModals(){$$(".modal-backdrop").forEach(m=>m.classList.remove("open"));}
function renderAll(){renderProfile();renderOverview();renderCourses();renderAttendance();renderRoutine();renderTasks();renderNotes();renderAnalytics();}
function renderProfile(){
  $("#welcomeName").textContent=data.profile.name||"Student";
  $("#sideName").textContent=data.profile.name||"DIU Student";
  $("#sideDept").textContent=(data.profile.dept||"CSE")+" · "+(data.profile.batch||"Student");
  $(".top-avatar").textContent=(data.profile.name||"S").trim().charAt(0).toUpperCase()||"S";
}
function renderOverview(){
  const att=data.courses.length?data.courses.reduce((s,c)=>s+Number(c.attended||0),0)/Math.max(1,data.courses.reduce((s,c)=>s+Number(c.attended||0)+Number(c.missed||0),0))*100:0;
  const credits=data.courses.reduce((s,c)=>s+Number(c.credits||0),0);
  const pending=data.tasks.filter(t=>!t.done);
  $("#statCgpa").textContent=cgpa().toFixed(2);$("#statAttendance").innerHTML=att.toFixed(0)+'<span class="unit">%</span>';
  $("#attendanceBar").style.width=att+"%";$("#attendanceHint").textContent=att?`${att>=75?"On target":"Below 75% target"}`:"No classes tracked";
  $("#statCourses").textContent=data.courses.length;$("#creditHint").textContent=credits+" credits";
  $("#statTasks").textContent=pending.length;$("#taskHint").textContent=pending.length?`${pending.length} to complete`:"No deadlines yet";
  $("#taskBadge").textContent=pending.length;$("#taskBadge").style.display=pending.length?"inline-block":"none";
  $("#snapshot").innerHTML=data.courses.length?`<div class="snapshot-item"><b>${data.courses.length}</b><span>Courses enrolled</span></div><div class="snapshot-item"><b>${credits}</b><span>Total credits</span></div><div class="snapshot-item"><b>${cgpa().toFixed(2)}</b><span>Weighted CGPA</span></div>`:'<div class="empty-state">Add your courses and grades to see your academic snapshot.</div>';
  const upcoming=pending.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);
  $("#upcomingList").innerHTML=upcoming.length?upcoming.map(t=>`<div class="compact-item"><div class="date-box">${new Date(t.due+"T00:00:00").toLocaleDateString("en",{month:"short",day:"numeric"})}</div><div><b>${esc(t.title)}</b><small>${esc(t.course||"Personal task")} · ${esc(t.priority)}</small></div></div>`).join(""):'<div class="empty-state">No deadlines. Enjoy the calm.</div>';
}
function renderCourses(){
  const q=($("#courseSearch")?.value||"").toLowerCase();
  const list=data.courses.filter(c=>(c.code+" "+c.title).toLowerCase().includes(q));
  $("#courseCount").textContent=`${data.courses.length} course${data.courses.length===1?"":"s"}`;
  $("#courseTable").innerHTML=list.length?list.map(c=>`<tr><td><span class="course-code">${esc(c.code)}</span><span class="course-title">${esc(c.title)}</span></td><td>${Number(c.credits)}</td><td>${c.grade?`<span class="grade-pill">${esc(c.grade)}</span>`:'<span class="muted">Pending</span>'}</td><td>${c.grade?gradePoint(c.grade).toFixed(2):"—"}</td><td><div class="row-actions"><button class="mini-btn" data-edit-course="${c.id}">Edit</button><button class="mini-btn" data-delete-course="${c.id}">Delete</button></div></td></tr>`).join(""):'<tr><td colspan="5"><div class="empty-state">No courses yet. Add your first course to get started.</div></td></tr>';
}
function renderAttendance(){
  $("#attendanceList").innerHTML=data.courses.length?data.courses.map(c=>{const a=attendance(c);return `<article class="attendance-card"><div><b>${esc(c.code)} · ${esc(c.title)}</b><small>${Number(c.attended||0)} attended / ${Number(c.attended||0)+Number(c.missed||0)} total classes</small></div><div><b style="color:${a>=75?"var(--green)":"var(--orange)"}">${a.toFixed(1)}%</b><div class="attendance-meter"><i style="width:${Math.min(a,100)}%;background:${a>=75?"linear-gradient(90deg,#56cba4,#52e6ed)":"linear-gradient(90deg,#ff9b6b,#ff6e91)"}"></i></div></div><div class="attendance-actions"><button class="mini-btn" data-attend="${c.id}">＋ Present</button><button class="mini-btn" data-miss="${c.id}">－ Absent</button></div></article>`}).join(""):'<div class="panel empty-state">Add courses first to track attendance.</div>';
}
function renderRoutine(){
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  $("#routineGrid").innerHTML=days.map(day=>{const items=data.routine.filter(r=>r.day===day).sort((a,b)=>a.time.localeCompare(b.time));return `<div class="day-column"><h3>${day.toUpperCase()}</h3>${items.length?items.map(r=>`<div class="class-chip"><b>${esc(r.course)}</b><small>${esc(r.time)} ${r.room?"· "+esc(r.room):""}</small><button class="mini-btn" data-delete-routine="${r.id}" style="float:right">×</button></div>`).join(""):'<div class="muted" style="font-size:10px">No classes scheduled</div>'}</div>`}).join("");
}
function renderTasks(){
  const list=data.tasks.filter(t=>taskFilter==="all"||(taskFilter==="done"?t.done:!t.done)).sort((a,b)=>a.due.localeCompare(b.due));
  $("#taskList").innerHTML=list.length?list.map(t=>`<div class="task-item ${t.done?"done":""}"><input class="task-check" type="checkbox" data-task-check="${t.id}" ${t.done?"checked":""}><div class="task-info"><div class="task-title">${esc(t.title)}</div><small>${esc(t.course||"Personal")} · Due ${t.due?new Date(t.due+"T00:00:00").toLocaleDateString():"No date"}</small></div><span class="priority ${esc(t.priority)}">${esc(t.priority)}</span><button class="mini-btn" data-delete-task="${t.id}">Delete</button></div>`).join(""):'<div class="panel empty-state">Nothing here yet. Add a task and make a plan.</div>';
  $$(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===taskFilter));
}
function renderNotes(){
  $("#notesGrid").innerHTML=data.notes.length?data.notes.slice().reverse().map(n=>`<article class="note-card"><div class="note-actions"><button class="mini-btn" data-edit-note="${n.id}">Edit</button><button class="mini-btn" data-delete-note="${n.id}">×</button></div><h3>${esc(n.title)}</h3><p>${esc(n.body||"")}</p><small>${new Date(n.updated).toLocaleString()}</small></article>`).join(""):'<div class="panel empty-state">Your notes will appear here. Capture an idea before it disappears.</div>';
}
function renderAnalytics(){
  $("#analyticsCgpa").textContent=cgpa().toFixed(2);$("#analyticsCredits").textContent=data.courses.reduce((s,c)=>s+Number(c.credits||0),0);
  const done=data.tasks.filter(t=>t.done).length;$("#analyticsDone").textContent=(data.tasks.length?Math.round(done/data.tasks.length*100):0)+"%";$("#analyticsFocus").textContent=data.focusSessions;
  $("#gradeChart").innerHTML=data.courses.length?data.courses.map(c=>{const gp=c.grade?gradePoint(c.grade):0;return `<div class="grade-row"><span>${esc(c.code)}</span><div class="grade-bar"><i style="width:${gp/4*100}%"></i></div><b>${c.grade?gp.toFixed(2):"—"}</b></div>`}).join(""):'<div class="empty-state">Add graded courses to see performance.</div>';
}
function fillSettings(){$("#settingName").value=data.profile.name||"";$("#settingDept").value=data.profile.dept||"";$("#settingBatch").value=data.profile.batch||"";}
function resetCourseForm(){ $("#courseForm").reset();$("#courseId").value="";$("#courseCredits").value=3;$("#courseModalTitle").textContent="Add course"; }
function editCourse(id){const c=data.courses.find(x=>x.id===id);if(!c)return;$("#courseId").value=c.id;$("#courseCode").value=c.code;$("#courseTitle").value=c.title;$("#courseCredits").value=c.credits;$("#courseGrade").value=c.grade||"";$("#courseModalTitle").textContent="Edit course";openModal("courseModal");}

$$(".nav-link[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$$("[data-view]").filter(b=>!b.classList.contains("nav-link")).forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$$("[data-open]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.open==="courseModal")resetCourseForm();openModal(b.dataset.open)}));
$$("[data-close]").forEach(b=>b.addEventListener("click",closeModals));
$$(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModals()}));
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#profileShortcut").addEventListener("click",()=>setView("settings"));
$("#quickAddBtn").addEventListener("click",()=>openModal("taskModal"));
$("#courseSearch").addEventListener("input",renderCourses);

$("#courseForm").addEventListener("submit",e=>{
  e.preventDefault();const id=$("#courseId").value;
  const item={id:id||uid(),code:$("#courseCode").value.trim().toUpperCase(),title:$("#courseTitle").value.trim(),credits:Number($("#courseCredits").value),grade:$("#courseGrade").value,attended:0,missed:0};
  if(id){const old=data.courses.find(c=>c.id===id);item.attended=old.attended||0;item.missed=old.missed||0;data.courses=data.courses.map(c=>c.id===id?item:c);}
  else data.courses.push(item);
  save();closeModals();resetCourseForm();toast(id?"Course updated":"Course added");
});
$("#courseTable").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit-course]"),del=e.target.closest("[data-delete-course]");
  if(edit)editCourse(edit.dataset.editCourse);
  if(del&&confirm("Delete this course? Its attendance record will also be removed.")){data.courses=data.courses.filter(c=>c.id!==del.dataset.deleteCourse);save();toast("Course deleted");}
});
$("#attendanceList").addEventListener("click",e=>{
  const p=e.target.closest("[data-attend]"),m=e.target.closest("[data-miss]");const id=(p||m)?.dataset.attend||(p||m)?.dataset.miss;if(!id)return;
  const c=data.courses.find(x=>x.id===id);if(p)c.attended=(c.attended||0)+1;else c.missed=(c.missed||0)+1;save();
});
$("#routineForm").addEventListener("submit",e=>{e.preventDefault();data.routine.push({id:uid(),course:$("#routineCourse").value.trim(),day:$("#routineDay").value,time:$("#routineTime").value,room:$("#routineRoom").value.trim()});save();closeModals();e.target.reset();toast("Class added to routine");});
$("#routineGrid").addEventListener("click",e=>{const b=e.target.closest("[data-delete-routine]");if(b){data.routine=data.routine.filter(r=>r.id!==b.dataset.deleteRoutine);save();}});
$("#taskForm").addEventListener("submit",e=>{e.preventDefault();data.tasks.push({id:uid(),title:$("#taskTitle").value.trim(),due:$("#taskDue").value,priority:$("#taskPriority").value,course:$("#taskCourse").value.trim(),done:false});save();closeModals();e.target.reset();toast("Task added");});
$("#taskList").addEventListener("change",e=>{const id=e.target.dataset.taskCheck;if(!id)return;const t=data.tasks.find(x=>x.id===id);t.done=e.target.checked;save();});
$("#taskList").addEventListener("click",e=>{const b=e.target.closest("[data-delete-task]");if(b){data.tasks=data.tasks.filter(t=>t.id!==b.dataset.deleteTask);save();}});
$$(".filter").forEach(b=>b.addEventListener("click",()=>{taskFilter=b.dataset.filter;renderTasks()}));
$("#newNoteBtn").addEventListener("click",()=>{ $("#noteForm").reset();$("#noteId").value="";$("#noteModalTitle").textContent="New note";openModal("noteModal");});
$("#noteForm").addEventListener("submit",e=>{e.preventDefault();const id=$("#noteId").value;const n={id:id||uid(),title:$("#noteTitle").value.trim(),body:$("#noteBody").value,updated:new Date().toISOString()};if(id)data.notes=data.notes.map(x=>x.id===id?n:x);else data.notes.push(n);save();closeModals();toast("Note saved");});
$("#notesGrid").addEventListener("click",e=>{
  const ed=e.target.closest("[data-edit-note]"),del=e.target.closest("[data-delete-note]");
  if(ed){const n=data.notes.find(x=>x.id===ed.dataset.editNote);$("#noteId").value=n.id;$("#noteTitle").value=n.title;$("#noteBody").value=n.body;$("#noteModalTitle").textContent="Edit note";openModal("noteModal");}
  if(del){data.notes=data.notes.filter(n=>n.id!==del.dataset.deleteNote);save();toast("Note deleted");}
});
$("#saveProfile").addEventListener("click",()=>{data.profile={name:$("#settingName").value.trim()||"DIU Student",dept:$("#settingDept").value.trim()||"CSE",batch:$("#settingBatch").value.trim()||"Student"};save();toast("Profile saved");});
$("#exportData").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="diu-nexus-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup exported");});
$("#importData").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.courses)||!Array.isArray(parsed.tasks))throw Error();data={...structuredClone(defaultData),...parsed};save();toast("Backup imported");}catch{alert("That file is not a valid DIU NEXUS backup.");}e.target.value="";});
$("#clearData").addEventListener("click",()=>{if(confirm("This will permanently clear all DIU NEXUS data stored in this browser. Export a backup first if needed. Continue?")){data=structuredClone(defaultData);save();fillSettings();toast("All local data reset");}});
function showTimer(){const m=Math.floor(timer.remaining/60),s=timer.remaining%60;$("#bigTimer").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");$("#timerProgress").style.width=((timer.duration-timer.remaining)/timer.duration*100)+"%";}
function stopTimer(){clearInterval(timer.interval);timer.interval=null;timer.running=false;$("#timerStart").textContent="Start focus";}
function startTimer(){if(timer.running){stopTimer();$("#timerStart").textContent="Resume";return;}timer.running=true;$("#timerStart").textContent="Pause";timer.interval=setInterval(()=>{timer.remaining--;showTimer();if(timer.remaining<=0){stopTimer();$("#timerMessage").textContent="Session complete. Take a breath and celebrate your progress.";if(timer.duration===1500){data.focusSessions++;save();}toast("Timer complete!");}},1000);}
$("#timerStart").addEventListener("click",startTimer);
$("#timerReset").addEventListener("click",()=>{stopTimer();timer.remaining=timer.duration;showTimer();$("#timerMessage").textContent="Timer reset. Ready when you are.";});
$$(".mode").forEach(b=>b.addEventListener("click",()=>{stopTimer();$$(".mode").forEach(x=>x.classList.remove("active"));b.classList.add("active");timer.duration=Number(b.dataset.min)*60;timer.remaining=timer.duration;showTimer();$("#timerMessage").textContent="Ready when you are. Put your phone away and begin.";}));
$("#todayDate").textContent=new Date().toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).toUpperCase();
renderAll();showTimer();
