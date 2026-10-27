const sampleCsv = `date,category,region,amount,quantity
2026-01-04,Electronics,North,1250,1
2026-01-06,Home,West,340,2
2026-01-08,Books,South,85,3
2026-01-10,Electronics,East,980,1
2026-01-13,Home,North,420,2
2026-01-15,Clothing,West,160,2
2026-01-18,Books,East,120,4
2026-01-20,Electronics,South,1450,1
2026-01-23,Clothing,North,210,3
2026-01-26,Home,East,560,1
2026-02-02,Electronics,West,1120,1
2026-02-04,Books,North,95,3
2026-02-08,Home,South,390,2
2026-02-11,Clothing,East,275,2
2026-02-14,Electronics,North,1680,1
2026-02-17,Books,West,145,5
2026-02-20,Home,East,610,1
2026-02-23,Clothing,South,185,2
2026-02-26,Electronics,East,890,1
2026-02-28,Books,South,110,4`;
const byId=id=>document.getElementById(id);
let currentFile=new File([sampleCsv],'sample_sales.csv',{type:'text/csv'});
const API_URL='/api/analyze';
function money(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value)}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function announce(message,error=false){const el=byId('notice');el.textContent=message;el.classList.toggle('error',error)}
function drawBars(items){const list=items.slice(0,6),max=Math.max(...list.map(x=>x.value));byId('bars').innerHTML=list.map(x=>`<div class="bar-item" title="${escapeHtml(x.name)}: ${money(x.value)}"><span class="bar-value">${money(x.value)}</span><div class="bar" style="height:${Math.max(5,x.value/max*100)}%"></div><span class="bar-label">${escapeHtml(x.name)}</span></div>`).join('')||'<div class="chart-empty">No category field found.</div>'}
function drawRegions(items,total){byId('regions').innerHTML=items.map(x=>`<div class="region-row"><span>${escapeHtml(x.name)}</span><div class="region-track"><div class="region-fill" style="width:${total?x.value/total*100:0}%"></div></div><span class="region-value">${money(x.value)}</span></div>`).join('')||'<div class="chart-empty">No region field found.</div>'}
function drawTable(headers,rows,count){byId('tableHead').innerHTML=`<tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr>`;byId('tableBody').innerHTML=rows.map(row=>`<tr>${headers.map(h=>`<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`).join('');byId('previewCount').textContent=`SHOWING ${rows.length} OF ${count}`}
async function processData(){
 if(!currentFile){announce('Load the sample data or choose a CSV file first.',true);return}
 const button=byId('processBtn');button.disabled=true;button.innerHTML='Spark is processing…';byId('processedLabel').textContent='RUNNING SPARK JOB';announce('Sending the CSV to the local PySpark service…');
 try{
  const form=new FormData();form.append('file',currentFile,currentFile.name);
  const response=await fetch(API_URL,{method:'POST',body:form});const result=await response.json();if(!response.ok)throw new Error(result.error||'Spark could not process this dataset.');
  byId('recordCount').textContent=result.recordCount.toLocaleString();byId('totalSales').textContent=money(result.totalSales);byId('averageSale').textContent=money(result.averageSale);byId('topCategory').textContent=result.topCategory;byId('topCategoryInfo').textContent=`${money(result.topCategorySales)} in sales`;
  byId('processedLabel').textContent=`${result.engine.toUpperCase()} · ${result.recordCount.toLocaleString()} ROWS`;drawBars(result.categories);drawRegions(result.regions,result.totalSales);drawTable(result.headers,result.rows,result.recordCount);
  announce(`Apache Spark ${result.sparkVersion} finished: ${result.recordCount} valid rows processed locally.${result.invalidRows?` ${result.invalidRows} rows with missing or non-numeric amounts were skipped.`:''}`);
 }catch(error){byId('processedLabel').textContent='SPARK SERVICE NOT READY';announce(error.message.includes('fetch')?'Could not reach Spark. Start the Python Spark service in VS Code, then run analysis again.':error.message,true)}
 finally{button.disabled=false;button.innerHTML='Run analysis <span>→</span>'}
}
function loadSample(){currentFile=new File([sampleCsv],'sample_sales.csv',{type:'text/csv'});byId('datasetName').textContent=currentFile.name;byId('datasetInfo').textContent='20 sample records · ready';byId('processedLabel').textContent='READY FOR SPARK';announce('Sample data loaded. Click “Run analysis” to process it with Spark.')}
byId('sampleBtn').addEventListener('click',loadSample);byId('processBtn').addEventListener('click',processData);
byId('fileInput').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;currentFile=file;byId('datasetName').textContent=file.name;byId('datasetInfo').textContent='CSV selected · ready for Spark';byId('processedLabel').textContent='READY FOR SPARK';announce(`Loaded ${file.name}. Click “Run analysis” to process it with Spark.`);event.target.value=''});
loadSample();

