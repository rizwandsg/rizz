import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ print: vi.fn(), move: vi.fn(), remove: vi.fn(), share: vi.fn() }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-print', () => ({ printToFileAsync: mocks.print }));
vi.mock('expo-sharing', () => ({ shareAsync: mocks.share, isAvailableAsync: async () => true }));
vi.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file:///documents/', cacheDirectory: 'file:///cache/', moveAsync: mocks.move, deleteAsync: mocks.remove }));
import { csvCell, deleteSavedPDF, downloadProjectCostAsPDF, generateAndSavePDF, generateCategoryCSV, generateProjectCostHTML, ProjectCostSummary } from '../services/exportService';
const summary: ProjectCostSummary = { projectName: '../../<script>alert(1)</script>', clientName: 'A & B', totalBudget: 100, totalExpenses: 60, totalReceived: 80, remainingAmount: 20, profitLoss: 20, expensesByCategory: [] };
beforeEach(() => { vi.clearAllMocks(); mocks.print.mockResolvedValue({ uri: 'file:///cache/rendered.pdf' }); });
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
