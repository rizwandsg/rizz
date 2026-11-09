import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ print: vi.fn(), move: vi.fn(), remove: vi.fn(), share: vi.fn(), pick:vi.fn(),read:vi.fn(),write:vi.fn(),info:vi.fn() }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-print', () => ({ printToFileAsync: mocks.print }));
vi.mock('expo-intent-launcher',()=>({startActivityAsync:mocks.pick}));
vi.mock('expo-file-system',()=>({File:class{constructor(private uri:string){}bytes(){return mocks.read(this.uri);}write(data:Uint8Array){mocks.write(this.uri,data);}}}));
vi.mock('expo-sharing', () => ({ shareAsync: mocks.share, isAvailableAsync: async () => true }));
vi.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file:///documents/', cacheDirectory: 'file:///cache/', moveAsync: mocks.move, deleteAsync: mocks.remove,readAsStringAsync:mocks.read,writeAsStringAsync:mocks.write,getInfoAsync:mocks.info,EncodingType:{Base64:'base64'} }));
import { csvCell, deleteSavedPDF, downloadProjectCostAsPDF, generateAndSavePDF, generateCategoryCSV, generateProjectCostHTML, ProjectCostSummary, saveProjectCostPDFToDevice,generateProjectCostCSV } from '../services/exportService';
const summary: ProjectCostSummary = { projectName: '../../<script>alert(1)</script>', clientName: 'A & B', totalBudget: 100, totalExpenses: 60, totalReceived: 80, remainingAmount: 20, profitLoss: 20, expensesByCategory: [] };
beforeEach(() => { vi.clearAllMocks(); mocks.print.mockReset().mockResolvedValue({ uri: 'file:///cache/rendered.pdf' });mocks.info.mockResolvedValue({exists:true,isDirectory:false,size:100});mocks.remove.mockResolvedValue(undefined);mocks.pick.mockResolvedValue({resultCode:-1,data:'content://documents/report'});mocks.read.mockResolvedValue('JVBERi0x'); });
it('escapes quotes, line breaks, and spreadsheet formulas in exported CSV', () => {
  expect(csvCell('A,"B"\nC')).toBe('"A,""B""\nC"');
  expect(csvCell('=HYPERLINK("https://bad")')).toBe('"\'=HYPERLINK(""https://bad"")"');
  expect(generateCategoryCSV([{ category: '+cmd', totalAmount: 20, expenseCount: 1, percentage: 100 }])).toContain('"\'+cmd"');
});
it('renders a real PDF through the native renderer and safely shares its URI', async () => {
  const uri = await generateAndSavePDF(summary);
  expect(uri.startsWith('file:///documents/project_analytics_')).toBe(true);
  expect(uri).not.toContain('../');
  expect(mocks.print).toHaveBeenCalledWith({ html: expect.stringContaining('&lt;script&gt;') });
  expect(mocks.move).toHaveBeenCalledWith({ from: 'file:///cache/rendered.pdf', to: uri });
  await downloadProjectCostAsPDF(summary);
  expect(mocks.share).toHaveBeenCalledWith(expect.stringMatching(/\.pdf$/), { mimeType: 'application/pdf', UTI: '.pdf' });
  expect(generateProjectCostHTML(summary)).not.toContain('<script>');
});
it('rejects traversal when deleting files', async () => { await expect(deleteSavedPDF('../private.pdf')).rejects.toThrow(); expect(mocks.remove).not.toHaveBeenCalled(); });
it('saves PDF bytes to the Android document chosen by the user',async()=>{
  expect(await saveProjectCostPDFToDevice(summary)).toBe('saved');
  expect(mocks.pick).toHaveBeenCalledWith('android.intent.action.CREATE_DOCUMENT',expect.objectContaining({type:'application/pdf'}));
  expect(mocks.write).toHaveBeenCalledWith('content://documents/report','JVBERi0x');
  expect(mocks.remove).toHaveBeenCalledWith('file:///cache/rendered.pdf',{idempotent:true});
});
it('treats a cancelled picker as cancellation and removes the temporary PDF',async()=>{
  mocks.pick.mockResolvedValue({resultCode:0});expect(await saveProjectCostPDFToDevice(summary)).toBe('cancelled');
  expect(mocks.write).not.toHaveBeenCalled();expect(mocks.remove).toHaveBeenCalled();
});
it('rejects an empty render before showing a save picker',async()=>{
  mocks.info.mockResolvedValue({exists:true,isDirectory:false,size:0});
  await expect(saveProjectCostPDFToDevice(summary)).rejects.toThrow('could not be generated');expect(mocks.pick).not.toHaveBeenCalled();
});
it('serializes native rendering and recovers the queue after a rejected render',async()=>{
  let release!:(value:any)=>void;mocks.print.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
  const first=generateAndSavePDF(summary),second=generateAndSavePDF(summary);
  await Promise.resolve();expect(mocks.print).toHaveBeenCalledTimes(1);
  release({uri:'file:///cache/rendered.pdf'});await Promise.all([first,second]);expect(mocks.print).toHaveBeenCalledTimes(2);
  mocks.print.mockRejectedValueOnce(new Error('renderer failed'));await expect(generateAndSavePDF(summary)).rejects.toThrow('renderer failed');
  await expect(generateAndSavePDF(summary)).resolves.toMatch(/pdf$/);
});
it('escapes category formulas in project CSV and prints an empty report',()=>{
 expect(generateProjectCostCSV({...summary,expensesByCategory:[{category:'=SUM(A1)',amount:1,percentage:100}]})).toContain('"\'=SUM(A1)"');
 expect(generateProjectCostHTML(summary)).toContain('No expenses recorded.');
});
