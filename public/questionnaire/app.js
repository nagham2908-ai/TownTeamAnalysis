/* ============================================================
   ORACLE FUSION HCM WORKFORCE COMPENSATION — REQUIREMENTS QUESTIONNAIRE
   Single-file interactive application.
   ============================================================ */

/* ---------------------------------------------------------
   0. CONSTANTS / OPTION LISTS
--------------------------------------------------------- */
const MODULE_CLASS = ["Workforce Compensation (WFC)","Payroll (Automatic Formula)","Individual Compensation (Ad-hoc)","Not Yet Confirmed"];
const PAYROLL_DATA_SOURCE = ["Live System Feed (e.g. sales/KPI system)","OTBI Extract","Manual Upload / Spreadsheet","Other"];
const INDIV_COMP_TRIGGER = ["Manager Request","HR-Initiated","Employee Nomination","Other"];
const COMP_TYPES = ["Merit Increase","Bonus","Promotion","Salary Adjustment","Allowance","Commission","Stock / Equity","Other"];
const FREQUENCIES = ["Annual","Semi-Annual","Quarterly","Monthly","Ad Hoc / As Required","Other"];
const CYCLE_TYPES = ["Merit","Bonus","Promotion","Adjustment","Other"];
const CURRENCIES = ["EGP","USD","EUR","Other"];
const SALARY_SOURCES = ["Current Salary","Annual Salary","Salary Basis","Salary Component","Other"];
const PERF_SOURCES = ["Oracle Performance Management","Manual Rating","Imported Rating","Other"];
const RATING_PERIODS = ["Annual","Semi-Annual","Quarterly","Other"];
const CALC_BASIS = ["Current Salary","Annual Salary","Salary Range","Compa-Ratio","Performance Rating","Fixed Amount","Other"];
const CALC_METHOD = ["Percentage","Fixed Amount","Formula","Guideline","Manager Input","Imported Amount"];
const GUIDELINE_TYPE = ["Percentage","Amount","Matrix","Range","Formula","No Guideline"];
const COMPA_SOURCE = ["Oracle Salary Range","Core HR","Calculated","Imported","Other"];
const BUDGET_TYPE = ["Amount","Percentage"];
const BUDGET_LEVEL = ["Company","Legal Employer","Business Unit","Department","Manager","Other"];
const BUDGET_OWNER = ["HR","Finance","Compensation","Manager","Other"];
const ALLOCATION_METHOD = ["Automatic","Manual","Imported"];
const APPROVER_ROLE = ["Line Manager","Manager's Manager","Department Manager","HR","HRBP","HR Manager","HR Director","Finance","Finance Manager","CFO","CEO","Compensation Manager","Specific Person","Other"];
const APPROVAL_BASED_ON = ["Employee","Department","Business Unit","Legal Employer","Compensation Amount","Percentage Increase","Budget","Job","Grade","Manager Hierarchy","Other"];
const CONDITION_OPS = ["Equal To","Not Equal To","Less Than","Less Than or Equal To","Greater Than","Greater Than or Equal To","Between","All"];
const WHAT_GENERATED = ["Salary Change","Recurring Element","One-Time Element","Bonus Payment","Allowance","Commission","Other"];
const PROCESSING_METHOD = ["Automatic","Manual","Imported"];
const PAYROLL_ACTION = ["Update Salary","Create Element","One-Time Payment","Other"];
const GEN_METHOD = ["Manager Enters Amount","Manager Enters Percentage","System Calculates Percentage","Guideline","Performance","Compa-Ratio","Formula","Imported Amount","Fixed Amount","Other"];
const GEN_SOURCE = ["Current Salary","Annual Salary","Performance","Compa-Ratio","Budget","External File","Other"];
const PAYMENT_TYPE = ["Salary Increase","Recurring Allowance","One-Time Payment","Bonus","Commission","Other"];
const PRORATION_BASIS = ["Hire Date","Seniority Date","Assignment Date","Promotion Date","Termination Date","Leave","Other"];
const PRORATION_METHOD = ["Days","Months","Percentage","Formula","Other"];
const WORKSHEET_DISPLAY_BY = ["Manager","Department","Business Unit","Legal Employer","Other"];
const WORKSHEET_FIELDS = ["Employee Name","Employee Number","Job","Grade","Department","Location","Manager","Current Salary","Salary Range","Compa-Ratio","Performance Rating","Proposed %","Proposed Amount","New Salary","Bonus Amount","Comments"];
const FINAL_BY = ["Compensation Team","HR","Payroll","Finance","Other"];
const REOPEN_WHO = ["Compensation Team","HR","HR Director","System Administrator","Other"];
const SECURITY_ROLES = ["HR","Compensation Team","Managers","Finance","Payroll","Employees","Senior Management","Other"];
const REPORTS_LIST = ["Compensation Summary","Manager Worksheet","Budget vs Actual","Employee Compensation Statement","Salary Increase Report","Bonus Payment Report","Payroll Input","Approval Status","Compensation by Department","Compensation by Grade","Other"];
const AUDIENCE = ["HR","Managers","Finance","Payroll","Employees","Management","Other"];
const REQUIRED_FIELDS = ["Employee","Employee Number","Salary","Increase %","Increase Amount","Bonus","Rating","Compa-Ratio","Budget","Approval","Department","Grade","Other"];
const EXPORT_FORMATS = ["Excel","CSV","PDF","Other"];
const DELIVERY_METHODS = ["Employee Self-Service","Email","PDF","Other"];
const CORE_HR_ATTRS = ["Legal Employer","Business Unit","Department","Location","Grade","Job","Position","Employment Category","Assignment Category","Hire Date","Seniority Date","Assignment Status","Manager","Salary Basis","Salary Component","Current Salary"];
const USED_FOR = ["Eligibility","Calculation","Guideline","Proration","Approval","Worksheet Display","Salary Update","Final Processing"];
const OPERATORS = ["Equal To","Not Equal To","In List","Between","Greater Than","Less Than","Contains"];
const OTHER_AREAS = ["Eligibility","Salary","Performance","Guidelines","Budget","Approval","Payroll","Proration","Security","Communication","Integration","Reporting","Other"];
const EXCEPTION_TYPES = ["Cycle Start Date Change","Cycle End Date Change","Effective Date Change","Delayed Processing","Early Processing","Reopened Cycle","Other"];

/* ---------------------------------------------------------
   1. STATE
--------------------------------------------------------- */
const TOKEN = (function(){
  if(typeof window!=="undefined" && window.__WFC_TOKEN__) return window.__WFC_TOKEN__;
  if(typeof location!=="undefined"){
    const m = location.pathname.match(/\/q\/([^\/]+)/);
    if(m) return decodeURIComponent(m[1]);
  }
  return "local";
})();
const STORAGE_KEY = "wfc_questionnaire_v1:" + TOKEN;

function freshState(){
  return {
    currentStep: 0,
    respondent:{name:"",position:"",department:"",email:"",company:"",date:""},
    plans:[],
    calendars:[],
    calendarApproach:"", // 1,2,3
    calendarOverride:{any:"", planId:"", calendar:{}},
    calendarReopen:{allowed:"",who:"",whoOther:"",circumstances:"",additionalApproval:""},
    calendarExceptions:{has:"",rows:[]},
    shared:{
      currency:{same:"",value:"",other:""},
      employeeRules:{same:"",active:"",onLeave:"",terminated:"",suspended:"",newJoiners:""},
      minService:{same:"",value:"",unit:"",dateBasis:""},
      salarySource:{same:"",source:"",other:"",component:""},
      performance:{same:"",source:"",other:"",ratingModel:"",ratingPeriod:""},
      approval:{same:"",levels:[]},
      payroll:{same:"",processDesc:""},
      managerWorksheet:{same:"",displayBy:"",displayByOther:"",canEditPct:"",canEditAmount:"",canAddComments:"",canAddEmployees:"",canBelowGuideline:"",canAboveGuideline:"",fields:[]}
    },
    finalProcessingCommon:{same:"",by:"",byOther:"",reviewBy:"",reviewByOther:"",hrReview:"",reopen:"",effectiveDateConfirm:"",salaryAutoUpdate:"",payrollAutoTransfer:""},
    finalProcessingPlans:[], // rows when not common
    security:{same:"",viewAccess:[],editAccess:[],hierarchy:"",employeeSeeOwn:"",rows:[]},
    reportingCommon:{same:"",rows:[]},
    reportingPlans:[], // per plan rows when not common
    communication:{same:"",statementRequired:"",delivery:"",timing:"",content:""},
    communicationPlans:[],
    otherRequirements:[],
    submitted:false,
    submissionRef:"",
    submissionDate:""
  };
}
let state = freshState();
let stateReady = false;
let submitting = false;

function loadLocalDraft(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return null;
}

/* Loads the draft from the server (source of truth), falling back to the
   last locally-cached copy if the network is unavailable. */
async function initState(){
  const local = loadLocalDraft();
  if(local) state = Object.assign(freshState(), local);
  try{
    const res = await fetch("/api/responses/"+encodeURIComponent(TOKEN));
    if(res.ok){
      const payload = await res.json();
      if(payload && payload.data) state = Object.assign(freshState(), payload.data);
      if(payload && payload.submitted){
        state.submitted = true;
        state.submissionRef = payload.submissionRef || state.submissionRef;
        state.submissionDate = payload.submissionDate || state.submissionDate;
        state._pdfUrl = payload.pdfUrl;
        state._docxUrl = payload.docxUrl;
      }
    }
  }catch(e){
    // Offline on first load — proceed with whatever local draft we found (if any).
  }
  stateReady = true;
  render();
}

let mobileNavOpen=false;
let saveTimer=null;

function updateSaveIndicator(status){
  const dot = document.getElementById('saveDot');
  const label = document.getElementById('saveLabel');
  if(!dot || !label) return;
  dot.className = 'dot'+(status==='saving'?' saving':status==='error'?' error':'');
  label.textContent = status==='saving' ? 'Saving…' : status==='error' ? 'Save failed — will retry' : status==='offline' ? 'Saved on this device (offline)' : 'Saved';
}

function saveToServer(onDone){
  fetch("/api/responses/"+encodeURIComponent(TOKEN), {
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({data: state})
  }).then(res=>{
    if(!res.ok) throw new Error("save failed");
    updateSaveIndicator('saved');
    if(onDone) onDone(true);
  }).catch(()=>{
    updateSaveIndicator('offline');
    if(onDone) onDone(false);
  });
}

function persist(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  updateSaveIndicator('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>saveToServer(), 600);
}

function flushSave(onDone){
  clearTimeout(saveTimer);
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  updateSaveIndicator('saving');
  saveToServer(onDone);
}
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),1600);
}

/* ---------------------------------------------------------
   2. GENERIC DOM HELPERS
--------------------------------------------------------- */
function h(tag, attrs={}, children=[]){
  const el = document.createElement(tag);
  for(const k in attrs){
    if(k==="class") el.className=attrs[k];
    else if(k==="html") el.innerHTML=attrs[k];
    else if(k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
    else if(k==="text") el.textContent=attrs[k];
    else el.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children)?children:[children]).forEach(c=>{
    if(c==null) return;
    if(typeof c==="string") el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  });
  return el;
}
function uid(prefix){ return prefix + "-" + Math.random().toString(36).slice(2,8); }
function nextPlanId(){
  let n = state.plans.length+1;
  let id = "PLAN-"+String(n).padStart(3,"0");
  while(state.plans.some(p=>p.id===id)){ n++; id="PLAN-"+String(n).padStart(3,"0"); }
  return id;
}
function nextCalId(){
  let n = state.calendars.length+1;
  let id = "CAL-"+String(n).padStart(3,"0");
  while(state.calendars.some(c=>c.id===id)){ n++; id="CAL-"+String(n).padStart(3,"0"); }
  return id;
}

function field(labelText, inputEl, opts={}){
  const lbl = h('label',{},[labelText, opts.required?h('span',{class:'req',text:' *'}):null]);
  const wrap = h('div',{class:'field'},[lbl, inputEl]);
  if(opts.help) wrap.appendChild(h('div',{class:'field-help',text:opts.help}));
  if(opts.errorId) wrap.appendChild(h('div',{class:'error-msg',id:opts.errorId}));
  return wrap;
}
function textInput(value, onChange, opts={}){
  const inp = h('input',{type:opts.type||'text', value:value||''});
  if(opts.placeholder) inp.placeholder=opts.placeholder;
  inp.addEventListener('input', ()=>{ onChange(inp.value); persist(); });
  return inp;
}
function numberInput(value, onChange){
  const inp = h('input',{type:'number', value:(value===undefined||value===null)?'':value});
  inp.addEventListener('input', ()=>{ onChange(inp.value); persist(); });
  return inp;
}
function dateInput(value, onChange){
  const inp = h('input',{type:'date', value:value||''});
  inp.addEventListener('change', ()=>{ onChange(inp.value); persist(); });
  return inp;
}
function textareaInput(value, onChange, rows){
  const t = h('textarea',{}, []);
  t.value = value||'';
  if(rows) t.rows=rows;
  t.addEventListener('input', ()=>{ onChange(t.value); persist(); });
  return t;
}
function selectInput(value, options, onChange, placeholder){
  const sel = h('select',{});
  if(placeholder) sel.appendChild(h('option',{value:'', text:placeholder}));
  options.forEach(o=> sel.appendChild(h('option',{value:o, text:o})));
  sel.value = value||'';
  sel.addEventListener('change', ()=>{ onChange(sel.value); persist(); render(); });
  return sel;
}
function yesNo(value, onChange, labels){
  labels = labels || ['Yes','No'];
  const wrap = h('div',{class:'yn-toggle'});
  const yBtn = h('button',{type:'button', text:labels[0]});
  const nBtn = h('button',{type:'button', text:labels[1]});
  function paint(){
    yBtn.className = value==='Yes'?'active-yes':'';
    nBtn.className = value==='No'?'active-no':'';
  }
  yBtn.addEventListener('click', ()=>{ value='Yes'; onChange('Yes'); persist(); render(); });
  nBtn.addEventListener('click', ()=>{ value='No'; onChange('No'); persist(); render(); });
  paint();
  wrap.appendChild(yBtn); wrap.appendChild(nBtn);
  return wrap;
}
function chipMultiSelect(values, options, onChange){
  values = values||[];
  const wrap = h('div',{class:'chip-select'});
  options.forEach(opt=>{
    const chip = h('div',{class:'chip'+(values.includes(opt)?' selected':''), text:opt});
    chip.addEventListener('click', ()=>{
      const idx = values.indexOf(opt);
      if(idx>-1) values.splice(idx,1); else values.push(opt);
      onChange(values); persist(); render();
    });
    wrap.appendChild(chip);
  });
  const addChip = h('div',{class:'chip', style:'border-style:dashed;font-weight:700;', text:'+ Add field'});
  addChip.addEventListener('click', ()=>{
    const val = prompt('Name of the new field to add:');
    if(val && val.trim()){
      const trimmed = val.trim();
      if(!options.includes(trimmed)) options.push(trimmed);
      if(!values.includes(trimmed)) values.push(trimmed);
      onChange(values); persist(); render();
    }
  });
  wrap.appendChild(addChip);
  return wrap;
}
function otherTextIfNeeded(container, value, onChange, triggerVal, currentVal){
  if(currentVal===triggerVal){
    container.appendChild(field('Please specify', textInput(value, onChange), {}));
  }
}
function useCommonBox(labelText, obj, onToggle){
  const box = h('div',{class:'use-common-box'});
  box.appendChild(h('div',{class:'lbl', text:labelText}));
  box.appendChild(yesNo(obj.useCommon, v=>{ obj.useCommon=v; if(onToggle) onToggle(v); }, ['Use Common','Plan-Specific']));
  return box;
}

/* Free-text catch-all comment box, appended at the end of every section so nothing
   raised in the room gets lost just because it doesn't fit a structured field. */
function ensureSectionComments(){ state.sectionComments = state.sectionComments || {}; return state.sectionComments; }
function addSectionCommentBox(container, sectionId, label){
  const sc = ensureSectionComments();
  const card = h('div',{class:'card'});
  card.appendChild(h('h3',{text:'Additional Comments'}));
  card.appendChild(h('div',{class:'helper-text', text:'Anything about this section that the fields above don\u2019t capture.'}));
  card.appendChild(field(label || 'Notes for this section', textareaInput(sc[sectionId], v=>{ sc[sectionId]=v; }, 3)));
  container.appendChild(card);
}

/* Simple file-import control: reads the file client-side and stores name + data URL
   on the given object under `key`, so it travels with the JSON/CSV export. */
function fileImportField(obj, key, accept){
  const wrap = h('div',{});
  const inp = h('input',{type:'file'});
  if(accept) inp.setAttribute('accept', accept);
  const status = h('div',{class:'field-help', text: obj[key] && obj[key].name ? ('Uploaded: '+obj[key].name) : 'No file uploaded yet.'});
  inp.addEventListener('change', ()=>{
    const f = inp.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      obj[key] = {name:f.name, dataUrl:reader.result};
      status.textContent = 'Uploaded: '+f.name;
      persist();
    };
    reader.readAsDataURL(f);
  });
  wrap.appendChild(inp);
  wrap.appendChild(status);
  return wrap;
}

/* Generic matrix (dynamic table) renderer
   columns: [{key,label,type:'text'|'select'|'date'|'number'|'textarea', options:[...] }]
*/
function renderMatrix(rows, columns, opts={}){
  const wrap = h('div',{class:'table-wrap'});
  const table = h('table',{class:'matrix'});
  const thead = h('thead',{});
  const trh = h('tr',{});
  columns.forEach(c=> trh.appendChild(h('th',{text:c.label})));
  trh.appendChild(h('th',{text:'Actions'}));
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = h('tbody',{});
  rows.forEach((row,idx)=>{
    const tr = h('tr',{});
    columns.forEach(c=>{
      const td = h('td',{'data-label':c.label});
      let inp;
      if(c.type==='select'){
        inp = selectInputRaw(row[c.key], c.options, v=>{ row[c.key]=v; persist(); });
      } else if(c.type==='date'){
        inp = h('input',{type:'date', value:row[c.key]||''});
        inp.addEventListener('change', ()=>{ row[c.key]=inp.value; persist(); });
      } else if(c.type==='number'){
        inp = h('input',{type:'number', value:row[c.key]||''});
        inp.addEventListener('input', ()=>{ row[c.key]=inp.value; persist(); });
      } else if(c.type==='textarea'){
        inp = h('input',{type:'text', value:row[c.key]||''});
        inp.addEventListener('input', ()=>{ row[c.key]=inp.value; persist(); });
      } else {
        inp = h('input',{type:'text', value:row[c.key]||''});
        inp.addEventListener('input', ()=>{ row[c.key]=inp.value; persist(); });
      }
      td.appendChild(inp);
      tr.appendChild(td);
    });
    const actTd = h('td',{'data-label':'Actions'});
    const actions = h('div',{class:'row-actions'});
    const dup = h('button',{class:'btn-secondary icon-btn', type:'button', title:'Duplicate', text:'⧉'});
    dup.addEventListener('click', ()=>{ rows.splice(idx+1,0, JSON.parse(JSON.stringify(row))); persist(); render(); });
    const del = h('button',{class:'btn-danger icon-btn', type:'button', title:'Delete', text:'✕'});
    del.addEventListener('click', ()=>{ rows.splice(idx,1); persist(); render(); });
    actions.appendChild(dup); actions.appendChild(del);
    actTd.appendChild(actions);
    tr.appendChild(actTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  const toolbar = h('div',{class:'matrix-toolbar'});
  const addBtn = h('button',{class:'btn-secondary btn-sm', type:'button', text:'+ Add Row'});
  addBtn.addEventListener('click', ()=>{
    const newRow={};
    columns.forEach(c=> newRow[c.key]='');
    if(opts.onAdd) opts.onAdd(newRow);
    rows.push(newRow); persist(); render();
  });
  toolbar.appendChild(addBtn);
  wrap.appendChild(toolbar);
  if(rows.length===0){
    const empty = h('div',{class:'empty-state'},[h('div',{text:'No rows yet. Click "Add Row" to begin.'})]);
    wrap.insertBefore(empty, toolbar);
  }
  return wrap;
}
function selectInputRaw(value, options, onChange){
  const sel = h('select',{});
  sel.appendChild(h('option',{value:'', text:'Select...'}));
  options.forEach(o=> sel.appendChild(h('option',{value:o, text:o})));
  sel.value = value||'';
  sel.addEventListener('change', ()=>{ onChange(sel.value); });
  return sel;
}

/* Generic field-schema form renderer for repeated per-plan config objects */
function renderSchemaForm(container, obj, schema){
  schema.forEach(f=>{
    if(f.showIf && !f.showIf(obj)) return;
    let inputEl;
    if(f.type==='select'){
      inputEl = selectInput(obj[f.key], f.options, v=>{ obj[f.key]=v; }, 'Select...');
    } else if(f.type==='yesno'){
      inputEl = yesNo(obj[f.key], v=>{ obj[f.key]=v; });
    } else if(f.type==='date'){
      inputEl = dateInput(obj[f.key], v=>{ obj[f.key]=v; });
    } else if(f.type==='textarea'){
      inputEl = textareaInput(obj[f.key], v=>{ obj[f.key]=v; });
    } else if(f.type==='multiselect'){
      inputEl = chipMultiSelect(obj[f.key]||(obj[f.key]=[]), f.options, v=>{ obj[f.key]=v; });
    } else {
      inputEl = textInput(obj[f.key], v=>{ obj[f.key]=v; });
    }
    container.appendChild(field(f.label, inputEl, {help:f.help}));
    if(f.otherTrigger && obj[f.key]===f.otherTrigger){
      const otherKey = f.key+'Other';
      container.appendChild(field('Please specify', textInput(obj[otherKey], v=>{obj[otherKey]=v;}), {}));
    }
  });
}

/* ---------------------------------------------------------
   3. FIELD SCHEMAS (reused across shared + plan-specific)
--------------------------------------------------------- */
const SCHEMA_CALCULATION = [
  {key:'basis', label:'Calculation Basis', type:'select', options:CALC_BASIS, otherTrigger:'Other'},
  {key:'method', label:'Calculation Method', type:'select', options:CALC_METHOD},
  {key:'managerOverride', label:'Manager Override Allowed?', type:'yesno'}
];
const SCHEMA_PERFORMANCE = [
  {key:'source', label:'Performance Source', type:'select', options:PERF_SOURCES, otherTrigger:'Other'},
  {key:'ratingModel', label:'Rating Model', type:'text', showIf:o=>o.source==='Oracle Performance Management', help:'As defined by the client — any rating scale is supported.'},
  {key:'ratingPeriod', label:'Rating Period', type:'select', options:RATING_PERIODS},
  {key:'ratingRequired', label:'Rating Required Before Processing?', type:'yesno'},
  {key:'guidelineType', label:'Guideline Type', type:'select', options:GUIDELINE_TYPE}
];
const SCHEMA_COMPARATIO = [
  {key:'source', label:'Compa-Ratio Source', type:'select', options:COMPA_SOURCE, otherTrigger:'Other'},
  {key:'salaryRangeRequired', label:'Salary Range Required?', type:'yesno'},
  {key:'guidelineType', label:'Guideline Type', type:'select', options:GUIDELINE_TYPE}
];
const SCHEMA_BUDGET = [
  {key:'type', label:'Budget Type', type:'select', options:BUDGET_TYPE},
  {key:'amountPct', label:'Budget Amount / %', type:'text'},
  {key:'currency', label:'Currency', type:'select', options:CURRENCIES, otherTrigger:'Other'},
  {key:'level', label:'Budget Level', type:'select', options:BUDGET_LEVEL, otherTrigger:'Other'},
  {key:'owner', label:'Budget Owner', type:'select', options:BUDGET_OWNER, otherTrigger:'Other'},
  {key:'allocation', label:'Allocation Method', type:'select', options:ALLOCATION_METHOD},
  {key:'canExceed', label:'Can Manager Exceed Budget?', type:'yesno'},
  {key:'carryForward', label:'Carry Forward Unused Budget?', type:'yesno'},
  {key:'transferManagers', label:'Transfer Budget Between Managers?', type:'yesno'},
  {key:'transferDepartments', label:'Transfer Budget Between Departments?', type:'yesno'}
];
const SCHEMA_PAYROLL = [
  {key:'salaryUpdatedCoreHR', label:'Is Salary Updated in Core HR?', type:'yesno'},
  {key:'whatGenerated', label:'What Is Generated?', type:'select', options:WHAT_GENERATED, otherTrigger:'Other'},
  {key:'payrollElement', label:'Payroll Element / Component', type:'text'},
  {key:'salaryComponent', label:'Salary Component', type:'text'},
  {key:'effectiveDate', label:'Effective Date (Core HR)', type:'date'},
  {key:'payrollEffectiveDate', label:'Payroll Effective Date', type:'date'},
  {key:'processingMethod', label:'Processing Method', type:'select', options:PROCESSING_METHOD},
  {key:'payrollAction', label:'Payroll Action', type:'select', options:PAYROLL_ACTION, otherTrigger:'Other'},
  {key:'taxable', label:'Taxable?', type:'yesno'},
  {key:'socialInsurance', label:'Subject to Social Insurance?', type:'yesno'},
  {key:'includedInRegular', label:'Included in Regular Salary?', type:'yesno'},
  {key:'retroactive', label:'Retroactive Calculation?', type:'yesno'},
  {key:'manualAction', label:'Manual Payroll Action Required?', type:'yesno'},
  {key:'manualActionDesc', label:'Describe the manual Payroll process', type:'textarea', showIf:o=>o.manualAction==='Yes'},
  {key:'payrollCutoff', label:'Payroll Cutoff Applies?', type:'yesno'},
  {key:'coreHrSalaryComponent', label:'Salary Component (Core HR)', type:'text', showIf:o=>o.salaryUpdatedCoreHR==='Yes'},
  {key:'coreHrSalaryBasis', label:'Salary Basis (Core HR)', type:'text', showIf:o=>o.salaryUpdatedCoreHR==='Yes'},
  {key:'coreHrEffectiveDate', label:'Effective Date (Core HR Update)', type:'date', showIf:o=>o.salaryUpdatedCoreHR==='Yes'},
  {key:'coreHrRetroactiveAdj', label:'Retroactive Salary Adjustment?', type:'yesno', showIf:o=>o.salaryUpdatedCoreHR==='Yes'},
  {key:'coreHrAutoUpdate', label:'Automatic Salary Update?', type:'yesno', showIf:o=>o.salaryUpdatedCoreHR==='Yes'},
  {key:'rollbackAllowed', label:'If approved by mistake, is there a way to undo it before it reaches payroll?', type:'yesno'},
  {key:'rollbackWho', label:'Who is authorized to roll it back?', type:'select', options:APPROVER_ROLE, showIf:o=>o.rollbackAllowed==='Yes'}
];
const SCHEMA_GENERATION = [
  {key:'method', label:'Amount Generation Method', type:'select', options:GEN_METHOD, otherTrigger:'Other'},
  {key:'source', label:'Source', type:'select', options:GEN_SOURCE, otherTrigger:'Other'},
  {key:'paymentType', label:'Payment Type', type:'select', options:PAYMENT_TYPE, otherTrigger:'Other'},
  {key:'paymentDate', label:'Payment Date', type:'date'},
  {key:'currency', label:'Currency', type:'select', options:CURRENCIES, otherTrigger:'Other'},
  {key:'retroactive', label:'Retroactive?', type:'yesno'}
];
const SCHEMA_PRORATION = [
  {key:'basedOn', label:'Proration Based On', type:'select', options:PRORATION_BASIS, otherTrigger:'Other'},
  {key:'eligibilityDate', label:'Eligibility Date', type:'date'},
  {key:'terminationConsidered', label:'Termination Considered?', type:'yesno'},
  {key:'leaveConsidered', label:'Leave Considered?', type:'yesno'},
  {key:'method', label:'Proration Method', type:'select', options:PRORATION_METHOD, otherTrigger:'Other'}
];
const SCHEMA_WORKSHEET = [
  {key:'displayBy', label:'Employees Displayed By', type:'select', options:WORKSHEET_DISPLAY_BY, otherTrigger:'Other'},
  {key:'canEditPct', label:'Can Edit Percentage?', type:'yesno'},
  {key:'canEditAmount', label:'Can Edit Amount?', type:'yesno'},
  {key:'canAddComments', label:'Can Add Comments?', type:'yesno'},
  {key:'canAddEmployees', label:'Can Add Employees?', type:'yesno'},
  {key:'canBelowGuideline', label:'Can Allocate Below Guideline?', type:'yesno'},
  {key:'canAboveGuideline', label:'Can Allocate Above Guideline?', type:'yesno'},
  {key:'fields', label:'Worksheet Fields', type:'multiselect', options:WORKSHEET_FIELDS}
];

/* Ensure a plan object has all nested sub-objects initialized */
function ensurePlanShape(p){
  p.eligibility = p.eligibility || {useCommon:'', rows:[]};
  p.calculation = p.calculation || {useCommon:''};
  p.calculation.guidelines = p.calculation.guidelines || [];
  p.performance = p.performance || {useCommon:''};
  p.performance.matrix = p.performance.matrix || [];
  p.compaRatio = p.compaRatio || {useCommon:''};
  p.compaRatio.matrix = p.compaRatio.matrix || [];
  p.budget = p.budget || {useCommon:''};
  p.approvals = p.approvals || {useCommon:'', levels:[]};
  p.payroll = p.payroll || {useCommon:''};
  p.generationPayment = p.generationPayment || {};
  p.proration = p.proration || {useCommon:''};
  p.managerWorksheetCfg = p.managerWorksheetCfg || {useCommon:''};
  p.payrollAuto = p.payrollAuto || {};
  p.individualComp = p.individualComp || {};
  p.employeeComm = p.employeeComm || {};
  return p;
}

/* ---- Classification helpers (WFC vs Payroll vs Individual Compensation) ---- */
function isWFC(p){ return p.moduleClass==='Workforce Compensation (WFC)'; }
function isPayrollClass(p){ return p.moduleClass==='Payroll (Automatic Formula)'; }
function isIndivComp(p){ return p.moduleClass==='Individual Compensation (Ad-hoc)'; }
function isUnclassified(p){ return !p.moduleClass || p.moduleClass==='Not Yet Confirmed'; }

/* ---------------------------------------------------------
   4. SECTION DEFINITIONS
--------------------------------------------------------- */
const SECTIONS = [
  {id:'respondent', title:'Respondent Information', group:'Setup', always:true, render:renderRespondent, validate:validateRespondent},
  {id:'planRegister', title:'Compensation Plan Register', group:'Setup', always:true, render:renderPlanRegister, validate:validatePlanRegister},
  {id:'shared', title:'Shared Requirements', group:'Setup', always:true, render:renderShared, validate:()=>[]},
  {id:'payrollAutoDetails', title:'Payroll-Classified Plan Details', group:'Plan Detail', visible:s=>s.plans.some(isPayrollClass), render:renderPayrollAutoDetails, validate:validatePayrollAutoDetails},
  {id:'individualCompDetails', title:'Individual Compensation Details', group:'Plan Detail', visible:s=>s.plans.some(isIndivComp), render:renderIndividualCompDetails, validate:()=>[]},
  {id:'eligibility', title:'Eligibility & Core HR', group:'Plan Detail', visible:s=>s.plans.some(isWFC), render:renderEligibility, validate:()=>[]},
  {id:'calculation', title:'Calculation & Guidelines', group:'Plan Detail', visible:s=>s.plans.some(isWFC), render:renderCalculation, validate:()=>[]},
  {id:'performance', title:'Performance', group:'Plan Detail', visible:s=>s.plans.some(p=>isWFC(p) && p.performanceLinked==='Yes'), render:renderPerformance, validate:()=>[]},
  {id:'compaRatio', title:'Compa-Ratio', group:'Plan Detail', visible:s=>s.plans.some(p=>isWFC(p) && p.compaRatioLinked==='Yes'), render:renderCompaRatio, validate:()=>[]},
  {id:'budget', title:'Budget', group:'Plan Detail', visible:s=>s.plans.some(p=>isWFC(p) && p.budgetRequired==='Yes'), render:renderBudget, validate:()=>[]},
  {id:'payroll', title:'Payroll & Salary Integration', group:'Plan Detail', visible:s=>s.plans.some(p=>isWFC(p) && (p.payrollImpact==='Yes'||p.salaryUpdate==='Yes')), render:renderPayroll, validate:()=>[]},
  {id:'proration', title:'Proration', group:'Plan Detail', visible:s=>s.plans.some(p=>isWFC(p) && p.prorationRequired==='Yes'), render:renderProration, validate:()=>[]},
  {id:'managerWorksheet', title:'Manager Worksheet', group:'Plan Detail', visible:s=>s.plans.some(p=>isWFC(p) && p.managerWorksheetReq==='Yes'), render:renderManagerWorksheet, validate:()=>[]},
  {id:'communicationTemplates', title:'Communication Templates', group:'Plan Detail', visible:s=>s.plans.some(isWFC), render:renderCommunicationTemplates, validate:()=>[]},
  {id:'review', title:'Review & Submit', group:'Wrap-up', always:true, render:renderReview, validate:()=>[]}
];

function visibleSections(){
  return SECTIONS.filter(s=> s.always || (s.visible && s.visible(state)));
}
function completedCount(){
  const vs = visibleSections();
  const curIdx = vs.findIndex(s=>s.id===currentSectionId());
  return curIdx;
}
function currentSectionId(){
  const vs = visibleSections();
  if(state.currentStep>=vs.length) state.currentStep=vs.length-1;
  if(state.currentStep<0) state.currentStep=0;
  return vs[state.currentStep] ? vs[state.currentStep].id : vs[0].id;
}
function goToSectionId(id){
  const vs = visibleSections();
  const idx = vs.findIndex(s=>s.id===id);
  if(idx>-1){ state.currentStep=idx; mobileNavOpen=false; render(); window.scrollTo({top:0,behavior:'instant'}); }
}

/* ---------------------------------------------------------
   5. SECTION RENDERERS
--------------------------------------------------------- */

/* ---- 5.1 Respondent ---- */
function renderRespondent(container){
  container.appendChild(sectionHeader('Respondent Information','Tell us a bit about who is completing this questionnaire.'));
  const card = h('div',{class:'card'});
  const r = state.respondent;
  const row1 = h('div',{class:'row'});
  row1.appendChild(field('Respondent Name', textInput(r.name, v=>r.name=v), {required:true}));
  row1.appendChild(field('Position / Job Title', textInput(r.position, v=>r.position=v), {required:true}));
  card.appendChild(row1);
  const row2 = h('div',{class:'row'});
  row2.appendChild(field('Department', textInput(r.department, v=>r.department=v)));
  row2.appendChild(field('Company', textInput(r.company, v=>r.company=v), {required:true}));
  card.appendChild(row2);
  const row3 = h('div',{class:'row'});
  const emailInp = textInput(r.email, v=>r.email=v, {type:'email'});
  row3.appendChild(field('Email', emailInp, {required:true, errorId:'err-email'}));
  row3.appendChild(field('Date', dateInput(r.date, v=>r.date=v), {}));
  card.appendChild(row3);
  container.appendChild(card);
  addSectionCommentBox(container, 'respondent');
}
function validateRespondent(){
  const errs=[]; const r=state.respondent;
  if(!r.name) errs.push('Respondent Name is required.');
  if(!r.position) errs.push('Position / Job Title is required.');
  if(!r.company) errs.push('Company is required.');
  if(!r.email) errs.push('Email is required.');
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) errs.push('Please enter a valid email address.');
  return errs;
}

/* ---- 5.2 Plan Register ---- */
function renderPlanRegister(container){
  container.appendChild(sectionHeader('Compensation Plan Register','Register every compensation plan that will be implemented. Detailed rules are captured later, filtered automatically by what you select here.'));
  const card = h('div',{class:'card'});
  card.appendChild(h('h3',{text:'Compensation Plans'}));
  card.appendChild(h('div',{class:'helper-text', text:'Add one row per compensation plan (e.g. Annual Merit, Annual Bonus, Promotion Increase).'}));

  const classifyHelp = h('div',{class:'subcard'});
  classifyHelp.appendChild(h('h3',{text:'Classify before you configure'}));
  classifyHelp.appendChild(h('div',{class:'helper-text', text:'Every plan must be classified before its detail sections appear. Ask these to decide:'}));
  const classifyList = h('ul',{style:'margin:0 0 4px 18px;padding:0;font-size:12.5px;color:var(--text-mut);'});
  [
    'Does a manager actively review/adjust the amount, or is it purely system-calculated from existing data?',
    'Does it run on a fixed periodic cycle for everyone together, or ad hoc for one person at a time?',
    'Is there a formal multi-level approval, a single sign-off, or none?'
  ].forEach(t=> classifyList.appendChild(h('li',{text:t})));
  classifyHelp.appendChild(classifyList);
  classifyHelp.appendChild(h('div',{class:'helper-text', style:'margin-top:6px;', text:'Batch + human judgement + formal hierarchy → Workforce Compensation (WFC). Fully automatic, any frequency → Payroll. One person, any time → Individual Compensation.'}));
  card.appendChild(classifyHelp);

  const columns = [
    {key:'name', label:'Plan Name', type:'text'},
    {key:'moduleClass', label:'Classification', type:'select', options:MODULE_CLASS},
    {key:'compensationType', label:'Compensation Type', type:'select', options:COMP_TYPES},
    {key:'frequency', label:'Frequency / Cycle', type:'select', options:FREQUENCIES},
    {key:'performanceLinked', label:'Performance Linked?', type:'select', options:['Yes','No']},
    {key:'compaRatioLinked', label:'Compa-Ratio Linked?', type:'select', options:['Yes','No']},
    {key:'budgetRequired', label:'Budget Required?', type:'select', options:['Yes','No']},
    {key:'approvalRequired', label:'Approval Required?', type:'select', options:['Yes','No']},
    {key:'salaryUpdate', label:'Salary Update?', type:'select', options:['Yes','No']},
    {key:'payrollImpact', label:'Payroll Impact?', type:'select', options:['Yes','No']},
    {key:'prorationRequired', label:'Proration Required?', type:'select', options:['Yes','No']},
    {key:'managerWorksheetReq', label:'Manager Worksheet?', type:'select', options:['Yes','No']}
  ];
  state.plans.forEach(ensurePlanShape);
  const tableEl = renderMatrix(state.plans, columns, {onAdd:(row)=>{
    row.id = nextPlanId();
    ensurePlanShape(row);
  }});
  card.appendChild(tableEl);

  // Other-type specify rows (compensation type / frequency "Other")
  const otherWrap = h('div',{});
  state.plans.forEach(p=>{
    if(p.compensationType==='Other' || p.frequency==='Other'){
      const sub = h('div',{class:'subcard'});
      sub.appendChild(h('div',{class:'helper-text', text:'Additional details for '+(p.name||p.id)}));
      if(p.compensationType==='Other') sub.appendChild(field('Specify Compensation Type', textInput(p.compensationTypeOther, v=>p.compensationTypeOther=v)));
      if(p.frequency==='Other') sub.appendChild(field('Specify Frequency', textInput(p.frequencyOther, v=>p.frequencyOther=v)));
      otherWrap.appendChild(sub);
    }
  });
  if(otherWrap.children.length) card.appendChild(otherWrap);

  container.appendChild(card);

  if(state.plans.length===0){
    container.appendChild(h('div',{class:'banner-info', text:'Please add at least one compensation plan before continuing.'}));
  } else {
    const wfcList = state.plans.filter(isWFC).map(p=>p.name||p.id);
    const payrollList = state.plans.filter(isPayrollClass).map(p=>p.name||p.id);
    const indivList = state.plans.filter(isIndivComp).map(p=>p.name||p.id);
    const unclassified = state.plans.filter(isUnclassified).map(p=>p.name||p.id);
    let summary = state.plans.length+' compensation plan(s) registered. ';
    summary += 'WFC: '+(wfcList.length?wfcList.join(', '):'none')+'. ';
    summary += 'Payroll: '+(payrollList.length?payrollList.join(', '):'none')+'. ';
    summary += 'Individual Comp: '+(indivList.length?indivList.join(', '):'none')+'.';
    container.appendChild(h('div',{class:'banner-info', text:summary}));
    if(unclassified.length){
      container.appendChild(h('div',{class:'banner-err', text:'Not yet classified: '+unclassified.join(', ')+'. Detail sections stay hidden for these until classified.'}));
    }
  }
  addSectionCommentBox(container, 'planRegister');
}
function validatePlanRegister(){
  const errs=[];
  if(state.plans.length===0) errs.push('Please add at least one compensation plan before continuing.');
  state.plans.forEach(p=>{
    if(!p.name) errs.push('Every plan must have a Plan Name (see '+p.id+').');
    if(!p.moduleClass) errs.push('Every plan must be classified (WFC / Payroll / Individual Comp) — see '+(p.name||p.id)+'.');
  });
  return errs;
}


/* ---- 5.4 Shared Requirements ---- */
function renderShared(container){
  container.appendChild(sectionHeader('Shared Workforce Compensation Requirements','Tell us which requirements are common across all plans. Anything you mark "different by plan" will be collected later at the plan level.'));
  const S = state.shared;

  // Currency
  const c1 = h('div',{class:'card'});
  c1.appendChild(h('h3',{text:'Currency'}));
  c1.appendChild(field('Do all compensation plans use the same currency?', yesNo(S.currency.same, v=>S.currency.same=v)));
  if(S.currency.same==='Yes'){
    c1.appendChild(field('Currency', selectInput(S.currency.value, CURRENCIES, v=>S.currency.value=v, 'Select...')));
    if(S.currency.value==='Other') c1.appendChild(field('Specify', textInput(S.currency.other, v=>S.currency.other=v)));
  } else if(S.currency.same==='No'){
    c1.appendChild(h('div',{class:'helper-text', text:'Currency will be captured per plan.'}));
  }
  container.appendChild(c1);

  // Employee status
  const c2 = h('div',{class:'card'});
  c2.appendChild(h('h3',{text:'Employee Status Rules'}));
  c2.appendChild(field('Do the same employee status rules apply to all compensation plans?', yesNo(S.employeeRules.same, v=>S.employeeRules.same=v)));
  if(S.employeeRules.same==='Yes'){
    const row = h('div',{class:'row'});
    row.appendChild(field('Active employees included?', yesNo(S.employeeRules.active, v=>S.employeeRules.active=v)));
    row.appendChild(field('Employees on leave included?', yesNo(S.employeeRules.onLeave, v=>S.employeeRules.onLeave=v)));
    c2.appendChild(row);
    const row2 = h('div',{class:'row'});
    row2.appendChild(field('Terminated employees included?', yesNo(S.employeeRules.terminated, v=>S.employeeRules.terminated=v)));
    row2.appendChild(field('Suspended employees included?', yesNo(S.employeeRules.suspended, v=>S.employeeRules.suspended=v)));
    c2.appendChild(row2);
    c2.appendChild(field('New joiners included?', yesNo(S.employeeRules.newJoiners, v=>S.employeeRules.newJoiners=v)));
  } else if(S.employeeRules.same==='No'){
    c2.appendChild(h('div',{class:'helper-text', text:'Will be collected per plan (Eligibility & Core HR section).'}));
  }
  container.appendChild(c2);

  // Min service
  const c3 = h('div',{class:'card'});
  c3.appendChild(h('h3',{text:'Minimum Service'}));
  c3.appendChild(field('Is there a common minimum service requirement?', selectInput(S.minService.same, ['Yes','No','Not Applicable'], v=>S.minService.same=v, 'Select...')));
  if(S.minService.same==='Yes'){
    const row = h('div',{class:'row'});
    row.appendChild(field('Minimum Service', numberInput(S.minService.value, v=>S.minService.value=v)));
    row.appendChild(field('Unit', selectInput(S.minService.unit, ['Days','Months','Years'], v=>S.minService.unit=v, 'Select...')));
    c3.appendChild(row);
    c3.appendChild(field('Date Basis', selectInput(S.minService.dateBasis, ['Hire Date','Seniority Date'], v=>S.minService.dateBasis=v, 'Select...')));
  } else if(S.minService.same==='No'){
    c3.appendChild(h('div',{class:'helper-text', text:'Will be collected per plan.'}));
  }
  container.appendChild(c3);

  // Salary source
  const c4 = h('div',{class:'card'});
  c4.appendChild(h('h3',{text:'Salary Source'}));
  c4.appendChild(field('Do all plans use the same salary source?', yesNo(S.salarySource.same, v=>S.salarySource.same=v)));
  if(S.salarySource.same==='Yes'){
    c4.appendChild(field('Salary Source', selectInput(S.salarySource.source, SALARY_SOURCES, v=>S.salarySource.source=v, 'Select...')));
    if(S.salarySource.source==='Other') c4.appendChild(field('Specify', textInput(S.salarySource.other, v=>S.salarySource.other=v)));
    if(S.salarySource.source==='Salary Component') c4.appendChild(field('Specify Salary Component', textInput(S.salarySource.component, v=>S.salarySource.component=v)));
  } else if(S.salarySource.same==='No'){
    c4.appendChild(h('div',{class:'helper-text', text:'Will be collected per plan.'}));
  }
  container.appendChild(c4);

  // Performance source
  const c5 = h('div',{class:'card'});
  c5.appendChild(h('h3',{text:'Performance Source'}));
  c5.appendChild(field('Do all performance-linked plans use the same performance source?', selectInput(S.performance.same, ['Yes','No','Not Applicable'], v=>S.performance.same=v, 'Select...')));
  if(S.performance.same==='Yes'){
    c5.appendChild(field('Performance Source', selectInput(S.performance.source, PERF_SOURCES, v=>S.performance.source=v, 'Select...')));
    if(S.performance.source==='Other') c5.appendChild(field('Specify', textInput(S.performance.other, v=>S.performance.other=v)));
    if(S.performance.source==='Oracle Performance Management'){
      const row = h('div',{class:'row'});
      row.appendChild(field('Rating Model', textInput(S.performance.ratingModel, v=>S.performance.ratingModel=v)));
      row.appendChild(field('Rating Period', selectInput(S.performance.ratingPeriod, RATING_PERIODS, v=>S.performance.ratingPeriod=v, 'Select...')));
      c5.appendChild(row);
    }
  } else if(S.performance.same==='No'){
    c5.appendChild(h('div',{class:'helper-text', text:'Will be collected per applicable plan.'}));
  }
  container.appendChild(c5);

  // Payroll
  const c7 = h('div',{class:'card'});
  c7.appendChild(h('h3',{text:'Payroll'}));
  c7.appendChild(field('Do all payroll-impacting plans use the same Payroll process?', selectInput(S.payroll.same, ['Yes','No','Not Applicable'], v=>S.payroll.same=v, 'Select...')));
  if(S.payroll.same==='Yes'){
    c7.appendChild(field('Describe the common Payroll process', textareaInput(S.payroll.processDesc, v=>S.payroll.processDesc=v)));
  } else if(S.payroll.same==='No'){
    c7.appendChild(h('div',{class:'helper-text', text:'Will be collected per plan (Payroll section).'}));
  }
  container.appendChild(c7);

  // Manager Worksheet
  const c8 = h('div',{class:'card'});
  c8.appendChild(h('h3',{text:'Manager Worksheet'}));
  c8.appendChild(field('Do all Manager Worksheet plans use the same worksheet configuration?', selectInput(S.managerWorksheet.same, ['Yes','No','Not Applicable'], v=>S.managerWorksheet.same=v, 'Select...')));
  if(S.managerWorksheet.same==='Yes'){
    renderSchemaForm(c8, S.managerWorksheet, SCHEMA_WORKSHEET);
  } else if(S.managerWorksheet.same==='No'){
    c8.appendChild(h('div',{class:'helper-text', text:'Will be collected per plan (Manager Worksheet section).'}));
  }
  container.appendChild(c8);
  addSectionCommentBox(container, 'shared');
}
/* ---- helper: iterate applicable plans with common/override pattern ---- */
function planFilter(pred){ return state.plans.filter(pred); }

function planSectionWrapper(container, title, helper, plans, sectionKey, schema, opts={}){
  container.appendChild(sectionHeader(title, helper));
  if(plans.length===0){
    container.appendChild(h('div',{class:'empty-state'},[h('div',{class:'big',text:'—'}),h('div',{text:'No plans require this section.'})]));
    return;
  }
  plans.forEach(p=>{
    const cfg = p[sectionKey];
    const card = h('div',{class:'card'});
    card.appendChild(h('h3',{},[h('span',{class:'plan-chip'},[p.name||p.id, h('span',{class:'id',text:' '+p.id})]), h('span',{class:'tag', text:title})]));
    if(opts.commonAvailable !== false){
      card.appendChild(useCommonBox('Does this plan use the common '+opts.commonLabel+'?', cfg));
    }
    if(cfg.useCommon!=='Yes'){
      const formWrap = h('div',{});
      if(schema) renderSchemaForm(formWrap, cfg, schema);
      if(opts.extraRender) opts.extraRender(formWrap, p, cfg);
      card.appendChild(formWrap);
    } else {
      card.appendChild(h('div',{class:'helper-text', text:'Inheriting common configuration from Shared Requirements.'}));
    }
    container.appendChild(card);
  });
  addSectionCommentBox(container, sectionKey);
}
function renderEligibility(container){
  container.appendChild(sectionHeader('Plan-Specific Eligibility & Core HR','Core HR attributes that matter for Workforce Compensation only — not a full Core HR questionnaire. WFC-classified plans only.'));
  planFilter(isWFC).forEach(p=>{
    const cfg = p.eligibility;
    const card = h('div',{class:'card'});
    card.appendChild(h('h3',{},[h('span',{class:'plan-chip'},[p.name||p.id, h('span',{class:'id',text:' '+p.id})])]));
    card.appendChild(useCommonBox('Does this plan use the common employee eligibility rules?', cfg));
    if(cfg.useCommon!=='Yes'){
      card.appendChild(renderMatrix(cfg.rows, [
        {key:'attribute', label:'Core HR Attribute', type:'select', options:CORE_HR_ATTRS},
        {key:'operator', label:'Operator', type:'select', options:OPERATORS},
        {key:'value', label:'Value', type:'text'},
        {key:'usedFor', label:'Used For', type:'select', options:USED_FOR}
      ]));
    } else {
      card.appendChild(h('div',{class:'helper-text', text:'Inheriting common eligibility rules.'}));
    }
    container.appendChild(card);
  });
  addSectionCommentBox(container, 'eligibility');
}

/* ---- 5.6 Calculation & Guidelines ---- */
function renderCalculation(container){
  planSectionWrapper(container, 'Plan-Specific Calculation & Guidelines', 'Define how each plan calculates its award. WFC-classified plans only.', planFilter(isWFC), 'calculation', SCHEMA_CALCULATION, {
    commonLabel:'calculation / salary basis',
    extraRender:(wrap, p, cfg)=>{
      if(cfg.method==='Guideline'){
        wrap.appendChild(field('Do you already have this guideline table, or does it need to be built with us?', selectInput(cfg.guidelineDataStatus, ['Already have it — will provide','Needs to be built together','Not sure yet'], v=>cfg.guidelineDataStatus=v, 'Select...')));
        wrap.appendChild(field('Guideline Table',
          renderMatrix(cfg.guidelines, [
            {key:'minimum', label:'Minimum', type:'text'},
            {key:'target', label:'Target', type:'text'},
            {key:'maximum', label:'Maximum', type:'text'},
            {key:'guidelinePct', label:'Guideline %', type:'text'},
            {key:'guidelineAmount', label:'Guideline Amount', type:'text'},
            {key:'comments', label:'Comments', type:'text'}
          ])
        ));
      }
    }
  });
}

/* ---- 5.7 Performance ---- */
function renderPerformance(container){
  const plans = planFilter(p=>isWFC(p) && p.performanceLinked==='Yes');
  planSectionWrapper(container, 'Plan-Specific Performance', 'Only plans with Performance Linked = Yes appear here.', plans, 'performance', SCHEMA_PERFORMANCE, {
    commonLabel:'Performance configuration',
    extraRender:(wrap, p, cfg)=>{
      wrap.appendChild(field('Performance Rating Matrix',
        renderMatrix(cfg.matrix, [
          {key:'rating', label:'Rating', type:'text'},
          {key:'minimum', label:'Minimum', type:'text'},
          {key:'target', label:'Target', type:'text'},
          {key:'maximum', label:'Maximum', type:'text'},
          {key:'increasePct', label:'Increase %', type:'text'},
          {key:'increaseAmount', label:'Increase Amount', type:'text'},
          {key:'bonusPct', label:'Bonus %', type:'text'},
          {key:'comments', label:'Comments', type:'text'}
        ])
      ));
    }
  });
}

/* ---- 5.8 Compa-Ratio ---- */
function renderCompaRatio(container){
  const plans = planFilter(p=>isWFC(p) && p.compaRatioLinked==='Yes');
  planSectionWrapper(container, 'Plan-Specific Compa-Ratio', 'Only plans with Compa-Ratio Linked = Yes appear here.', plans, 'compaRatio', SCHEMA_COMPARATIO, {
    commonLabel:'Compa-Ratio configuration',
    extraRender:(wrap, p, cfg)=>{
      wrap.appendChild(field('Compa-Ratio Guideline Table',
        renderMatrix(cfg.matrix, [
          {key:'from', label:'Compa-Ratio From', type:'text'},
          {key:'to', label:'Compa-Ratio To', type:'text'},
          {key:'minPct', label:'Minimum %', type:'text'},
          {key:'guidelinePct', label:'Guideline %', type:'text'},
          {key:'maxPct', label:'Maximum %', type:'text'},
          {key:'comments', label:'Comments', type:'text'}
        ])
      ));
    }
  });
}

/* ---- 5.9 Budget ---- */
function renderBudget(container){
  const plans = planFilter(p=>isWFC(p) && p.budgetRequired==='Yes');
  planSectionWrapper(container, 'Plan-Specific Budget', 'Only plans with Budget Required = Yes appear here.', plans, 'budget', SCHEMA_BUDGET, {commonLabel:'budget configuration'});
}

/* ---- 5.11 Payroll ---- */
function renderPayroll(container){
  const plans = planFilter(p=>isWFC(p) && (p.payrollImpact==='Yes'||p.salaryUpdate==='Yes'));
  planSectionWrapper(container, 'Plan-Specific Payroll & Salary Integration', 'Only WFC-classified plans with Payroll Impact or Salary Update = Yes appear here.', plans, 'payroll', SCHEMA_PAYROLL, {commonLabel:'Payroll / Salary Integration process'});
}

/* ---- 5.13 Proration ---- */
function renderProration(container){
  const plans = planFilter(p=>isWFC(p) && p.prorationRequired==='Yes');
  planSectionWrapper(container, 'Plan-Specific Proration', 'Only plans with Proration Required = Yes appear here.', plans, 'proration', SCHEMA_PRORATION, {commonLabel:'proration rule'});
}

/* ---- 5.14 Manager Worksheet ---- */
function renderManagerWorksheet(container){
  const plans = planFilter(p=>isWFC(p) && p.managerWorksheetReq==='Yes');
  planSectionWrapper(container, 'Plan-Specific Manager Worksheet', 'Only plans with Manager Worksheet = Yes appear here.', plans, 'managerWorksheetCfg', SCHEMA_WORKSHEET, {commonLabel:'Manager Worksheet configuration'});
}

/* ---- 5.14a Communication Templates ---- */
function renderCommunicationTemplates(container){
  container.appendChild(sectionHeader('Communication Templates','How each plan tells employees what they got, and the actual letter/email template to use — separate from the high-level summary in Reporting & Communication.'));
  const plans = planFilter(isWFC);
  if(plans.length===0){
    container.appendChild(h('div',{class:'empty-state'},[h('div',{text:'No WFC-classified plans yet.'})]));
    return;
  }
  plans.forEach(p=>{
    const cfg = p.employeeComm;
    const card = h('div',{class:'card'});
    card.appendChild(h('h3',{},[h('span',{class:'plan-chip'},[p.name||p.id, h('span',{class:'id',text:' '+p.id})])]));
    card.appendChild(field('Describe how compensation results will be communicated to employees for this plan', textareaInput(cfg.description, v=>cfg.description=v, 3), {help:'E.g. formal letter released via Employee Self-Service, a manager conversation followed by email, etc.'}));
    card.appendChild(field('Delivery channel', selectInput(cfg.channel, DELIVERY_METHODS, v=>cfg.channel=v, 'Select...')));
    card.appendChild(field('Language(s) required', textInput(cfg.languages, v=>cfg.languages=v), {help:'E.g. English, Arabic'}));
    card.appendChild(field('Import a template file (letter, email copy, etc.)', fileImportField(cfg, 'templateFile', '.doc,.docx,.pdf,.txt,.html'), {help:'Stored with this questionnaire\u2019s export so the template travels with the requirements.'}));
    card.appendChild(field('Notes on the template (placeholders, branding, approval needed before use, etc.)', textareaInput(cfg.templateNotes, v=>cfg.templateNotes=v, 3)));
    container.appendChild(card);
  });
  addSectionCommentBox(container, 'communicationTemplates');
}

/* ---- 5.14b Payroll-Classified Plan Details ---- */
function renderPayrollAutoDetails(container){
  const plans = planFilter(isPayrollClass);
  container.appendChild(sectionHeader('Payroll-Classified Plan Details','These plans were classified as fully automatic — no manager review, no batch approval cycle. Confirm the details needed to build the Fast Formula / payroll element.'));
  if(plans.length===0){
    container.appendChild(h('div',{class:'empty-state'},[h('div',{text:'No plans classified as Payroll.'})]));
    return;
  }
  plans.forEach(p=>{
    const cfg = p.payrollAuto;
    const card = h('div',{class:'card'});
    card.appendChild(h('h3',{},[h('span',{class:'plan-chip'},[p.name||p.id, h('span',{class:'id',text:' '+p.id})]), h('span',{class:'tag', text:'Payroll'})]));
    card.appendChild(field('Is there truly zero manager adjustment step at any point in a normal cycle?', yesNo(cfg.zeroManualStep, v=>cfg.zeroManualStep=v)));
    card.appendChild(field('Where does the underlying figure (sales achievement, KPI score, etc.) come from?', selectInput(cfg.dataSource, PAYROLL_DATA_SOURCE, v=>cfg.dataSource=v, 'Select...')));
    if(cfg.dataSource==='Other') card.appendChild(field('Please specify', textInput(cfg.dataSourceOther, v=>cfg.dataSourceOther=v)));
    card.appendChild(field('How often is it calculated and paid?', selectInput(cfg.frequency, FREQUENCIES, v=>cfg.frequency=v, 'Select...')));
    card.appendChild(field('Describe the exact formula / tiers (attach or paraphrase)', textareaInput(cfg.formulaDescription, v=>cfg.formulaDescription=v, 4)));
    card.appendChild(field('Which payroll element should receive the amount?', textInput(cfg.payrollElement, v=>cfg.payrollElement=v)));
    card.appendChild(field('If the underlying data turns out wrong after payroll runs, how is a correction handled?', textareaInput(cfg.correctionProcess, v=>cfg.correctionProcess=v)));
    container.appendChild(card);
  });
  addSectionCommentBox(container, 'payrollAutoDetails');
}
function validatePayrollAutoDetails(){
  const errs=[];
  planFilter(isPayrollClass).forEach(p=>{
    if(p.payrollAuto.zeroManualStep==='No') errs.push('"'+(p.name||p.id)+'" has a manual review step — re-check whether it should be classified as WFC instead of Payroll.');
  });
  return errs;
}

/* ---- 5.14c Individual Compensation Details ---- */
function renderIndividualCompDetails(container){
  const plans = planFilter(isIndivComp);
  container.appendChild(sectionHeader('Individual Compensation Details','These plans were classified as ad-hoc, per-employee actions rather than a batch cycle.'));
  if(plans.length===0){
    container.appendChild(h('div',{class:'empty-state'},[h('div',{text:'No plans classified as Individual Compensation.'})]));
    return;
  }
  plans.forEach(p=>{
    const cfg = p.individualComp;
    const card = h('div',{class:'card'});
    card.appendChild(h('h3',{},[h('span',{class:'plan-chip'},[p.name||p.id, h('span',{class:'id',text:' '+p.id})]), h('span',{class:'tag', text:'Individual Comp'})]));
    card.appendChild(field('How is it triggered?', selectInput(cfg.trigger, INDIV_COMP_TRIGGER, v=>cfg.trigger=v, 'Select...')));
    if(cfg.trigger==='Other') card.appendChild(field('Please specify', textInput(cfg.triggerOther, v=>cfg.triggerOther=v)));
    card.appendChild(field('Who approves each individual case?', selectInput(cfg.approverRole, APPROVER_ROLE, v=>cfg.approverRole=v, 'Select...')));
    card.appendChild(field('Is there a budget pool or per-case cap to enforce?', yesNo(cfg.budgetCap, v=>cfg.budgetCap=v)));
    if(cfg.budgetCap==='Yes') card.appendChild(field('Describe the cap / pool', textInput(cfg.budgetCapDesc, v=>cfg.budgetCapDesc=v)));
    card.appendChild(field('Does it update base salary, or pay as a one-off amount?', selectInput(cfg.effectType, ['Updates base salary','One-off payment','Other'], v=>cfg.effectType=v, 'Select...')));
    container.appendChild(card);
  });
  addSectionCommentBox(container, 'individualCompDetails');
}

/* ---- 5.18 Review & Submit ---- */
function reviewItem(k,v){ return h('div',{class:'review-item'},[h('div',{class:'k',text:k}), h('div',{class:'v',text:(v===''||v===undefined||v===null)?'—':(Array.isArray(v)?v.join(', '):v)})]); }
function editBtn(sectionId){
  const b = h('button',{class:'btn-secondary btn-sm', type:'button', text:'Edit'});
  b.addEventListener('click', ()=>goToSectionId(sectionId));
  return b;
}
function renderReview(container){
  container.appendChild(sectionHeader('Review & Submit','Please review your answers before submitting. Click Edit on any section to make changes.'));

  const errs = allValidationErrors();
  if(errs.length){
    container.appendChild(h('div',{class:'banner-info'},[h('div',{text:'Still incomplete (optional — you can submit anyway):'}), h('ul',{style:'margin:6px 0 0 18px;'}, errs.map(e=>h('li',{text:e})))]));
  }

  // Common requirements
  const common = h('div',{class:'review-block'});
  const ch = h('h3',{},['Common Requirements', editBtn('respondent')]);
  ch.style.display='flex'; ch.style.justifyContent='space-between'; ch.style.alignItems='center';
  common.appendChild(ch);
  const grid = h('div',{class:'review-grid'});
  const r = state.respondent;
  grid.appendChild(reviewItem('Respondent', r.name));
  grid.appendChild(reviewItem('Position', r.position));
  grid.appendChild(reviewItem('Company', r.company));
  grid.appendChild(reviewItem('Email', r.email));
  grid.appendChild(reviewItem('Currency (common)', state.shared.currency.same==='Yes'? state.shared.currency.value : 'Per plan'));
  grid.appendChild(reviewItem('Salary Source (common)', state.shared.salarySource.same==='Yes'? state.shared.salarySource.source : 'Per plan'));
  grid.appendChild(reviewItem('Performance Source (common)', state.shared.performance.same==='Yes'? state.shared.performance.source : (state.shared.performance.same==='No'?'Per plan':'N/A')));
  common.appendChild(grid);
  container.appendChild(common);

  // Plan-specific
  const psHeader = h('h3',{text:'Plan-Specific Requirements'});
  container.appendChild(psHeader);
  state.plans.forEach(p=>{
    const cardWrap = h('div',{class:'plan-review-card'});
    const head = h('div',{class:'plan-review-head'},[
      h('div',{},[h('strong',{text:p.name||p.id}), h('span',{style:'opacity:.75;font-size:11px;margin-left:8px;', text:p.id})]),
      editBtn('planRegister')
    ]);
    cardWrap.appendChild(head);
    const body = h('div',{class:'plan-review-body'});

    function sub(title, sectionId, gridPairs){
      const s = h('div',{class:'sub-review'});
      s.appendChild(h('h4',{},[title, editBtn(sectionId)]));
      const g = h('div',{class:'review-grid'});
      gridPairs.forEach(([k,v])=>g.appendChild(reviewItem(k,v)));
      s.appendChild(g);
      body.appendChild(s);
    }

    sub('Basic Plan Info','planRegister',[
      ['Classification', p.moduleClass||'Not yet confirmed'],
      ['Compensation Type', p.compensationType==='Other'?p.compensationTypeOther:p.compensationType],
      ['Frequency', p.frequency==='Other'?p.frequencyOther:p.frequency],
      ['Performance Linked', p.performanceLinked],['Compa-Ratio Linked', p.compaRatioLinked],
      ['Budget Required', p.budgetRequired],['Approval Required', p.approvalRequired],
      ['Salary Update', p.salaryUpdate],['Payroll Impact', p.payrollImpact],
      ['Proration Required', p.prorationRequired],['Manager Worksheet', p.managerWorksheetReq]
    ]);
    if(isWFC(p)){
      sub('Eligibility & Core HR','eligibility',[['Uses Common', p.eligibility.useCommon],['Rows Defined', (p.eligibility.rows||[]).length]]);
      sub('Calculation & Guidelines','calculation',[['Uses Common', p.calculation.useCommon],['Basis', p.calculation.basis],['Method', p.calculation.method]]);
      if(p.performanceLinked==='Yes') sub('Performance','performance',[['Uses Common', p.performance.useCommon],['Source', p.performance.source]]);
      if(p.compaRatioLinked==='Yes') sub('Compa-Ratio','compaRatio',[['Uses Common', p.compaRatio.useCommon],['Source', p.compaRatio.source]]);
      if(p.budgetRequired==='Yes') sub('Budget','budget',[['Uses Common', p.budget.useCommon],['Type', p.budget.type],['Level', p.budget.level]]);
      if(p.payrollImpact==='Yes'||p.salaryUpdate==='Yes') sub('Payroll & Salary Integration','payroll',[['Uses Common', p.payroll.useCommon],['Payroll Action', p.payroll.payrollAction],['Rollback Allowed', p.payroll.rollbackAllowed]]);
      if(p.prorationRequired==='Yes') sub('Proration','proration',[['Uses Common', p.proration.useCommon],['Method', p.proration.method]]);
      if(p.managerWorksheetReq==='Yes') sub('Manager Worksheet','managerWorksheet',[['Uses Common', p.managerWorksheetCfg.useCommon]]);
    }
    if(isPayrollClass(p)){
      sub('Payroll-Classified Details','payrollAutoDetails',[
        ['Zero Manual Step?', p.payrollAuto.zeroManualStep],
        ['Data Source', p.payrollAuto.dataSource],
        ['Frequency', p.payrollAuto.frequency],
        ['Payroll Element', p.payrollAuto.payrollElement]
      ]);
    }
    if(isIndivComp(p)){
      sub('Individual Compensation Details','individualCompDetails',[
        ['Trigger', p.individualComp.trigger],
        ['Approver', p.individualComp.approverRole],
        ['Budget Cap?', p.individualComp.budgetCap],
        ['Effect', p.individualComp.effectType]
      ]);
    }

    cardWrap.appendChild(body);
    container.appendChild(cardWrap);
  });

  // Submit
  const actionsCard = h('div',{class:'card'});
  actionsCard.appendChild(h('h3',{text:'Submit'}));

  const submitBtn = h('button',{class:'btn-primary btn-block', type:'button', text: submitting?'Submitting…':'Submit Questionnaire'});
  submitBtn.disabled = submitting;
  submitBtn.addEventListener('click', submitQuestionnaire);
  actionsCard.appendChild(submitBtn);
  container.appendChild(actionsCard);
}

/* ---------------------------------------------------------
   6. VALIDATION AGGREGATION
--------------------------------------------------------- */
function allValidationErrors(){
  let errs=[];
  SECTIONS.forEach(s=>{
    if(s.id==='review') return;
    if(s.always || (s.visible && s.visible(state))){
      errs = errs.concat(s.validate(state));
    }
  });
  return [...new Set(errs)];
}

/* ---------------------------------------------------------
   8. SUBMIT
--------------------------------------------------------- */
async function submitQuestionnaire(){
  if(submitting) return;
  submitting = true;
  render();
  try{
    const res = await fetch('/api/responses/'+encodeURIComponent(TOKEN)+'/submit', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({data: state})
    });
    if(!res.ok) throw new Error('Submit failed with status '+res.status);
    const result = await res.json();
    state.submitted = true;
    state.submissionRef = result.submissionRef;
    state.submissionDate = result.submissionDate;
    state._pdfUrl = result.pdfUrl;
    state._docxUrl = result.docxUrl;
    state._emailSent = result.emailSent;
    state._emailError = result.emailError;
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }catch(e){
    showToast('Submit failed — check your connection and try again.');
  }finally{
    submitting = false;
    render();
  }
}

/* ---------------------------------------------------------
   9. LAYOUT / CHROME
--------------------------------------------------------- */
function sectionHeader(title, helper){
  return h('div',{class:'section-header'},[h('h2',{text:title}), helper?h('p',{class:'helper', text:helper}):null]);
}
function logoSVG(){
  const wrap = h('div',{class:'brand-logo'});
  const img = h('img',{src:'data:image/png;base64,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', alt:'Raya International Services'});
  img.style.height = '30px';
  img.style.width = 'auto';
  img.style.display = 'block';
  wrap.appendChild(img);
  return wrap;
}

function render(){
  const app = document.getElementById('app');
  app.innerHTML='';

  if(!stateReady){
    app.appendChild(h('div',{style:'min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--text-mut);font-size:13px;'},['Loading your questionnaire…']));
    return;
  }

  if(state.submitted){
    app.appendChild(renderSuccessScreen());
    return;
  }

  const vs = visibleSections();
  const curId = currentSectionId();
  const curIdx = vs.findIndex(s=>s.id===curId);
  const section = vs[curIdx];

  // Header
  const header = h('header',{class:'app-header'});
  const brand = h('div',{class:'brand'});
  const hamb = h('button',{class:'hamburger', type:'button', text:'☰'});
  hamb.addEventListener('click', ()=>{
    mobileNavOpen = !mobileNavOpen;
    render();
  });
  brand.appendChild(hamb);
  brand.appendChild(logoSVG());
  brand.appendChild(h('div',{class:'brand-text'},[h('h1',{text:'Workforce Compensation — Requirements Questionnaire'}),h('p',{text:'Oracle Fusion HCM Cloud Implementation'})]));
  header.appendChild(brand);
  const hActions = h('div',{class:'header-actions'});
  const saveBtn = h('button',{class:'btn-ghost btn-sm', type:'button', text:'Save Draft'});
  saveBtn.addEventListener('click', ()=>{
    flushSave((ok)=> showToast(ok ? 'Draft saved' : 'Saved on this device — will sync when back online'));
  });
  const resetBtn = h('button',{class:'btn-ghost btn-sm', type:'button', text:'Start Over'});
  resetBtn.addEventListener('click', ()=>{
    if(confirm('This clears all responses for this questionnaire. Continue?')){
      state = freshState();
      persist();
      render();
    }
  });
  hActions.appendChild(saveBtn); hActions.appendChild(resetBtn);
  header.appendChild(hActions);
  app.appendChild(header);

  // Progress
  const pct = vs.length ? Math.round(((curIdx)/(vs.length-1||1))*100) : 0;
  const progWrap = h('div',{class:'progress-wrap'});
  progWrap.appendChild(h('div',{class:'progress-bar-track'},[h('div',{class:'progress-bar-fill', style:'width:'+pct+'%'})]));
  progWrap.appendChild(h('div',{class:'progress-label'},[h('span',{text:'Step '+(curIdx+1)+' of '+vs.length+': '+section.title}), h('span',{text:pct+'% complete'})]));
  app.appendChild(progWrap);

  // Layout
  const layout = h('div',{class:'layout'});
  const nav = h('nav',{class:'side-nav'+(mobileNavOpen?' mobile-open':''), id:'sideNav'});
  let lastGroup=null;
  vs.forEach((s, idx)=>{
    if(s.group!==lastGroup){
      nav.appendChild(h('div',{style:'padding:10px 18px 4px;font-size:10.5px;font-weight:700;color:#9aa1bd;text-transform:uppercase;letter-spacing:.5px;', text:s.group}));
      lastGroup=s.group;
    }
    const item = h('div',{class:'nav-item'+(idx===curIdx?' active':'')+(idx<curIdx?' done':'')});
    item.appendChild(h('div',{class:'nav-dot'}));
    item.appendChild(h('div',{text:s.title}));
    item.addEventListener('click', ()=>{ state.currentStep=idx; mobileNavOpen=false; render(); });
    nav.appendChild(item);
  });
  layout.appendChild(nav);

  const main = h('main',{class:'content'});
  const inner = h('div',{class:'content-inner'});
  section.render(inner);
  main.appendChild(inner);
  layout.appendChild(main);
  app.appendChild(layout);

  // Footer
  const footer = h('footer',{class:'wizard-footer'});
  const backBtn = h('button',{class:'btn-secondary', type:'button', text:'← Back'});
  backBtn.disabled = curIdx===0;
  backBtn.addEventListener('click', ()=>{ state.currentStep=Math.max(0,curIdx-1); render(); });
  footer.appendChild(backBtn);

  footer.appendChild(h('div',{class:'save-indicator'},[h('div',{class:'dot', id:'saveDot'}), h('span',{id:'saveLabel', text:'Saved'})]));

  const rightWrap = h('div',{class:'footer-right'});
  if(section.id!=='review'){
    const nextBtn = h('button',{class:'btn-primary', type:'button', text: idx_isLast(curIdx,vs)?'Go to Review →':'Next →'});
    nextBtn.addEventListener('click', ()=>{
      persist();
      if(idx_isLast(curIdx,vs)){
        goToSectionId('review');
      } else {
        state.currentStep = curIdx+1; render();
      }
    });
    rightWrap.appendChild(nextBtn);
  }
  footer.appendChild(rightWrap);
  app.appendChild(footer);
}
function idx_isLast(curIdx, vs){ return curIdx>=vs.length-2 && vs[vs.length-1].id==='review'; }

function renderSuccessScreen(){
  const wrap = h('div',{});
  const header = h('header',{class:'app-header'});
  const brand = h('div',{class:'brand'});
  brand.appendChild(logoSVG());
  brand.appendChild(h('div',{class:'brand-text'},[h('h1',{text:'Workforce Compensation — Requirements Questionnaire'}),h('p',{text:'Oracle Fusion HCM Cloud Implementation'})]));
  header.appendChild(brand);
  wrap.appendChild(header);

  const main = h('main',{class:'content'});
  const success = h('div',{class:'success-wrap'});
  success.appendChild(h('div',{class:'check', text:'✓'}));
  success.appendChild(h('h2',{style:'color:var(--navy);margin:0 0 8px;', text:'Thank you.'}));
  success.appendChild(h('p',{style:'color:var(--text-mut);', text:'Your Workforce Compensation implementation questionnaire has been submitted successfully.'}));
  const refBox = h('div',{class:'ref-box'});
  refBox.appendChild(h('div',{style:'font-size:11px;color:var(--text-mut);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;', text:'Submission Reference'}));
  refBox.appendChild(h('div',{class:'ref-code', text:state.submissionRef}));
  const grid = h('div',{class:'review-grid', style:'margin-top:14px;'});
  grid.appendChild(reviewItem('Respondent', state.respondent.name));
  grid.appendChild(reviewItem('Position', state.respondent.position));
  grid.appendChild(reviewItem('Company', state.respondent.company));
  grid.appendChild(reviewItem('Submission Date', state.submissionDate));
  refBox.appendChild(grid);
  success.appendChild(refBox);

  if(state._pdfUrl || state._docxUrl){
    const docRow = h('div',{style:'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;'});
    if(state._pdfUrl){
      const pdfLink = h('a',{class:'btn-primary', href:state._pdfUrl, target:'_blank', rel:'noopener', text:'⬇ Download PDF'});
      docRow.appendChild(pdfLink);
    }
    if(state._docxUrl){
      const docxLink = h('a',{class:'btn-primary', href:state._docxUrl, target:'_blank', rel:'noopener', text:'⬇ Download Word (.docx)'});
      docRow.appendChild(docxLink);
    }
    success.appendChild(docRow);
  } else {
    success.appendChild(h('div',{class:'banner-err', text:'The PDF/Word files could not be generated. Please try submitting again, or use the JSON/CSV export below.'}));
  }

  if(state._emailSent){
    success.appendChild(h('div',{class:'banner-info', text:'A copy of your responses (PDF + Word) has also been emailed to the consultant.'}));
  } else if(state._emailError){
    success.appendChild(h('div',{class:'banner-err', text:'Note: the email copy could not be sent automatically. Please use the download buttons above and share the files directly.'}));
  }

  const btnRow = h('div',{style:'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;'});
  const editBtn2 = h('button',{class:'btn-secondary', type:'button', text:'Edit Responses'});
  editBtn2.addEventListener('click', ()=>{ state.submitted=false; goToSectionId('review'); });
  btnRow.appendChild(editBtn2);
  success.appendChild(btnRow);

  main.appendChild(success);
  wrap.appendChild(main);
  return wrap;
}

/* ---------------------------------------------------------
   10. INIT
--------------------------------------------------------- */
render();
initState();
