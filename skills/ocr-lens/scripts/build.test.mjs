import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, realpath, symlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build, flatten, validateDocument } from './build.mjs';

const basic = () => ({id:'one',title:'Receipt',annotationMethod:'visual',imageWidth:100,imageHeight:100,ocr:{Total:260,Tax:null,Raw:'text'},regions:[{box:[.1,.2,.3,.1],fields:[{path:'Total',kind:'direct',evidence:'260.00'}]}]});
const runNode = promisify(execFile);
const cliPath = fileURLToPath(new URL('./build.mjs', import.meta.url));

test('rejects false evidence: nonexistent paths, null boxes and off-image/crop boxes',()=>{
  const missing=basic();delete missing.ocr;assert.throws(()=>validateDocument(missing),/Missing OCR JSON/);
  const unknown=basic();unknown.regions[0].fields[0].path='Missing';assert.throws(()=>validateDocument(unknown),/Unknown JSON path/);
  const empty=basic();empty.regions[0].fields[0].path='Tax';assert.throws(()=>validateDocument(empty),/null\/Raw/);
  const outside=basic();outside.regions[0].box=[.9,.2,.3,.1];assert.throws(()=>validateDocument(outside),/Invalid box/);
  const crop=basic();crop.crop=[50,50,50,50];assert.throws(()=>validateDocument(crop),/outside crop/);
  const raw=basic();raw.regions[0].fields[0].path='Raw';assert.throws(()=>validateDocument(raw),/null\/Raw/);
});

test('keeps ambiguous money evidence separate from inferred unit price',()=>{
  const doc=basic();doc.ocr={Items:[{Quantity:2,Amount:100,UnitPrice:50}]};
  doc.regions[0].fields=[{path:'Items[0].Amount',kind:'direct',evidence:'100.00'},{path:'Items[0].UnitPrice',kind:'inferred',note:'100 ÷ 2',evidence:'100.00'}];
  assert.equal(validateDocument(doc).regions[0].fields.length,2);
  delete doc.regions[0].fields[1].note;assert.throws(()=>validateDocument(doc),/Explain inference/);
});

test('flattening preserves unusual keys, nulls, empty containers, arrays and value types',()=>{
  const value={'a.b':{'x[y]':'00000'},Items:[{Amount:50}],nothing:null,empty:[]};
  assert.deepEqual(flatten(value).map(x=>x.path),['["a.b"]["x[y]"]','Items[0].Amount','nothing','empty']);
  assert.equal(flatten(value)[0].value,'00000');assert.equal(flatten(value)[2].value,null);
});

test('batch build embeds images, preserves supplied JSON and neutralizes document HTML',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'ocr-presentation-'));
  const image=join(dir,'receipt.png');await writeFile(image,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=','base64'));
  const source=basic();source.image='receipt.png';source.ocr.Raw='</script><img src=x onerror=alert(1)> $&';
  const second={...source,id:'two',title:'Second pair'};
  await writeFile(join(dir,'manifest.json'),JSON.stringify({documents:[source,second]}));
  const result=await build(join(dir,'manifest.json'),join(dir,'out.html'));assert.equal(result.documents,2);
  const html=await readFile(join(dir,'out.html'),'utf8');
  assert.ok(html.includes('data:image/png;base64,'));assert.ok(!html.includes('</script><img src=x'));
  const payload=JSON.parse(html.match(/const data = (.*);\r?\nconst byId/)[1]);
  assert.deepEqual(payload.documents[0].ocr,source.ocr);assert.equal(payload.documents[1].id,'two');
  assert.equal(payload.documents[0].ocr.Tax,null);
  await writeFile(join(dir,'manifest.json'),JSON.stringify({documents:[source,source]}));
  await assert.rejects(build(join(dir,'manifest.json'),join(dir,'bad.html')),/Duplicate document id/);
});

test('CLI builds actual output through canonical, linked and URL-sensitive paths',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'ocr-cli-(test)-'));
  const linkedSkill=join(dir,'linked skill');
  await symlink(await realpath(dirname(dirname(cliPath))),linkedSkill,process.platform==='win32'?'junction':'dir');
  const portableSkill=join(dir,'portable skill ~ (test)');
  await cp(dirname(dirname(cliPath)),portableSkill,{recursive:true});
  await writeFile(join(dir,'receipt.png'),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=','base64'));
  const source={...basic(),image:'receipt.png'};
  await writeFile(join(dir,'manifest (test).json'),JSON.stringify({documents:[source]}));
  for(const [name,script] of [['canonical',cliPath],['linked',join(linkedSkill,'scripts','build.mjs')],['portable',join(portableSkill,'scripts','build.mjs')]]){
    const output=`${name}.html`;
    const result=await runNode(process.execPath,[script,'manifest (test).json',output],{cwd:dir});
    const html=await readFile(join(dir,output),'utf8');
    assert.ok(html.includes('data:image/png;base64,'),`${name}: embeds the image`);
    const payload=JSON.parse(html.match(/const data = (.*);\r?\nconst byId/)[1]);
    assert.deepEqual(payload.documents[0].ocr,source.ocr);
    assert.equal(JSON.parse(result.stdout).bytes,Buffer.byteLength(html));
    assert.equal(result.stderr,'');
  }
});

test('CLI reports missing arguments through canonical and linked paths',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'ocr-cli-usage-'));
  const linkedSkill=join(dir,'linked skill');
  await symlink(await realpath(dirname(dirname(cliPath))),linkedSkill,process.platform==='win32'?'junction':'dir');
  for(const script of [cliPath,join(linkedSkill,'scripts','build.mjs')]){
    await assert.rejects(runNode(process.execPath,[script]),error=>{
      assert.equal(error.code,1);
      assert.match(error.stderr,/Usage: node build\.mjs/);
      assert.equal(error.stdout,'');
      return true;
    });
  }
});

test('importing the module does not execute the CLI',async()=>{
  const moduleUrl=pathToFileURL(cliPath).href;
  const code=`const mod=await import(${JSON.stringify(moduleUrl)}); console.log(typeof mod.build);`;
  const result=await runNode(process.execPath,['--input-type=module','-e',code]);
  assert.equal(result.stdout.trim(),'function');
  assert.equal(result.stderr,'');
  const stdinRun=runNode(process.execPath,['--input-type=module','-']);
  stdinRun.child.stdin.end(code);
  const stdinResult=await stdinRun;
  assert.equal(stdinResult.stdout.trim(),'function');
  assert.equal(stdinResult.stderr,'');
});
