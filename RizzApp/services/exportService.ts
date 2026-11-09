import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {File} from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { CategorySummary } from '../api/expensesApi';

export function csvCell(value: string): string {
    const safe = /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? "'" + value : value;
    return '"' + safe.replace(/"/g, '""') + '"';
}
function escapeHTML(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function safeFilename(value: string) { return value.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/^\.+/, '_').slice(0, 120); }
function documentPath(filename: string) {
    if (filename !== safeFilename(filename) || !filename.endsWith('.pdf')) throw new Error('Invalid PDF filename');
    if (!FileSystem.documentDirectory) throw new Error('Documents directory unavailable');
    return FileSystem.documentDirectory + filename;
}
async function shareData(content: string, filename: string, mimeType: string) {
    if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
        const link = document.createElement('a'); link.href = url; link.download = safeFilename(filename); link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
    }
    if (!FileSystem.cacheDirectory || !await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device');
    const uri = FileSystem.cacheDirectory + safeFilename(filename);
    await FileSystem.writeAsStringAsync(uri, content);
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
}


/**
 * Generate CSV content for top expense categories
 */
export const generateCategoryCSV = (categories: CategorySummary[]): string => {
    const headers = ['Category', 'Total Amount (₹)', 'Expense Count', 'Percentage'];
    const csvContent = [
        headers.join(','),
        ...categories.map(cat =>
            `${csvCell(cat.category)},${cat.totalAmount.toFixed(2)},${cat.expenseCount},${cat.percentage.toFixed(2)}%`
        )
    ].join('\n');
    return csvContent;
};

/**
 * Generate JSON content for top expense categories
 */
export const generateCategoryJSON = (categories: CategorySummary[]): string => {
    return JSON.stringify({
        exportDate: new Date().toISOString(),
        totalCategories: categories.length,
        categories: categories.map(cat => ({
            category: cat.category,
            totalAmount: cat.totalAmount,
            expenseCount: cat.expenseCount,
            percentage: cat.percentage.toFixed(2) + '%'
        }))
    }, null, 2);
};

/**
 * Download top expense categories as CSV
 */
export const downloadCategoriesAsCSV = async (categories: CategorySummary[]): Promise<void> => {
    try {
        const csvContent = generateCategoryCSV(categories);
        const timestamp = new Date().toISOString().split('T')[0];

        await shareData(csvContent, `top_expense_categories_${timestamp}.csv`, 'text/csv');
    } catch (error) {
        console.error('Error downloading CSV:', error);
        throw error;
    }
};

/**
 * Download top expense categories as JSON
 */
export const downloadCategoriesAsJSON = async (categories: CategorySummary[]): Promise<void> => {
    try {
        const jsonContent = generateCategoryJSON(categories);
        const timestamp = new Date().toISOString().split('T')[0];

        await shareData(jsonContent, `top_expense_categories_${timestamp}.json`, 'application/json');
    } catch (error) {
        console.error('Error downloading JSON:', error);
        throw error;
    }
};

/**
 * Download top expense categories with user choice of format
 */
export const downloadCategoriesData = async (
    categories: CategorySummary[],
    format: 'csv' | 'json' = 'csv'
): Promise<void> => {
    if (format === 'csv') {
        return downloadCategoriesAsCSV(categories);
    } else {
        return downloadCategoriesAsJSON(categories);
    }
};

/**
 * Project cost summary interface
 */
export interface ProjectCostSummary {
    projectName: string;
    clientName: string;
    totalBudget: number;
    totalExpenses: number;
    totalReceived: number;
    remainingAmount: number;
    profitLoss: number;
    expensesByCategory: {
        category: string;
        amount: number;
        percentage: number;
    }[];
}

/**
 * Generate CSV for project cost summary
 */
export const generateProjectCostCSV = (summary: ProjectCostSummary): string => {
    const headers = ['Project Cost Summary Report'];
    const lines = [
        headers.join(','),
        '',
        'Project Information',
        `Project Name,${csvCell(summary.projectName)}`,
        `Client Name,${csvCell(summary.clientName)}`,
        '',
        'Financial Summary',
        `Total Budget,₹${summary.totalBudget.toFixed(2)}`,
        `Total Expenses,₹${summary.totalExpenses.toFixed(2)}`,
        `Total Received,₹${summary.totalReceived.toFixed(2)}`,
        `Remaining Amount,₹${summary.remainingAmount.toFixed(2)}`,
        `Profit/Loss,₹${summary.profitLoss.toFixed(2)}`,
        '',
        'Expense Breakdown by Category',
        'Category,Amount,Percentage',
        ...summary.expensesByCategory.map(cat =>
            `${csvCell(cat.category)},₹${cat.amount.toFixed(2)},${cat.percentage.toFixed(2)}%`
        )
    ];
    return lines.join('\n');
};

/**
 * Generate JSON for project cost summary
 */
export const generateProjectCostJSON = (summary: ProjectCostSummary): string => {
    return JSON.stringify({
        exportDate: new Date().toISOString(),
        projectInformation: {
            projectName: summary.projectName,
            clientName: summary.clientName
        },
        financialSummary: {
            totalBudget: summary.totalBudget,
            totalExpenses: summary.totalExpenses,
            totalReceived: summary.totalReceived,
            remainingAmount: summary.remainingAmount,
            profitLoss: summary.profitLoss
        },
        expenseBreakdown: summary.expensesByCategory
    }, null, 2);
};

/**
 * Download project cost summary as CSV
 */
export const downloadProjectCostAsCSV = async (summary: ProjectCostSummary): Promise<void> => {
    try {
        const csvContent = generateProjectCostCSV(summary);
        const timestamp = new Date().toISOString().split('T')[0];

        await shareData(csvContent, `${summary.projectName}_cost_summary_${timestamp}.csv`, 'text/csv');
    } catch (error) {
        console.error('Error downloading project cost CSV:', error);
        throw error;
    }
};

/**
 * Download project cost summary as JSON
 */
export const downloadProjectCostAsJSON = async (summary: ProjectCostSummary): Promise<void> => {
    try {
        const jsonContent = generateProjectCostJSON(summary);
        const timestamp = new Date().toISOString().split('T')[0];

        await shareData(jsonContent, `${summary.projectName}_cost_summary_${timestamp}.json`, 'application/json');
    } catch (error) {
        console.error('Error downloading project cost JSON:', error);
        throw error;
    }
};

/**
 * Generate PDF content for project cost summary (as formatted text that can be shared)
 */
export const generateProjectCostPDF = (summary: ProjectCostSummary): string => {
    const date = new Date().toLocaleDateString('en-IN');
    const divider = '='.repeat(60);

    const lines = [
        '',
        divider,
        'PROJECT COST SUMMARY REPORT',
        divider,
        '',
        `Generated: ${date}`,
        '',
        '─'.repeat(60),
        'PROJECT INFORMATION',
        '─'.repeat(60),
        `Project Name: ${summary.projectName}`,
        `Client Name: ${summary.clientName}`,
        '',
        '─'.repeat(60),
        'FINANCIAL SUMMARY',
        '─'.repeat(60),
        `Total Budget:           ₹${summary.totalBudget.toLocaleString('en-IN')}`,
        `Total Expenses:         ₹${summary.totalExpenses.toLocaleString('en-IN')}`,
        `Total Received:         ₹${summary.totalReceived.toLocaleString('en-IN')}`,
        `Remaining Amount:       ₹${summary.remainingAmount.toLocaleString('en-IN')}`,
        `Profit/Loss:            ₹${summary.profitLoss.toLocaleString('en-IN')} ${summary.profitLoss >= 0 ? '(PROFIT)' : '(LOSS)'}`,
        '',
        '─'.repeat(60),
        'EXPENSE BREAKDOWN BY CATEGORY',
        '─'.repeat(60),
        'Category'.padEnd(35) + 'Amount'.padEnd(15) + 'Percentage',
        '─'.repeat(60),
        ...summary.expensesByCategory.map(cat =>
            cat.category.padEnd(35) +
            `₹${cat.amount.toString().padEnd(13)}` +
            `${cat.percentage.toFixed(2)}%`
        ),
        '─'.repeat(60),
        '',
        divider,
        'END OF REPORT',
        divider,
        ''
    ];

    return lines.join('\n');
};

/**
 * Download project cost summary as PDF (shared as text)
 */
export const downloadProjectCostAsPDF = async (summary: ProjectCostSummary): Promise<void> => {
    if (Platform.OS === 'web') { await Print.printAsync({ html: generateProjectCostHTML(summary) }); return; }
    const uri = await generateAndSavePDF(summary);
    if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device');
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
};

/**
 * Download project cost summary with user choice of format
 */
export const downloadProjectCostData = async (
    summary: ProjectCostSummary,
    format: 'csv' | 'json' | 'pdf' = 'csv'
): Promise<void> => {
    if (format === 'csv') {
        return downloadProjectCostAsCSV(summary);
    } else if (format === 'json') {
        return downloadProjectCostAsJSON(summary);
    } else {
        return downloadProjectCostAsPDF(summary);
    }
};

/**
 * Save PDF file to device documents directory
 * React Native equivalent of Flutter's File handling
 */
export function generateProjectCostHTML(summary: ProjectCostSummary): string {
    const money = (value: number) => '₹' + value.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2});
    const rows = [['Total budget',summary.totalBudget],['Total expenses',summary.totalExpenses],['Total received',summary.totalReceived],['Remaining to receive',summary.remainingAmount],['Profit / loss',summary.profitLoss]] as const;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#20283c;margin:0;line-height:1.5}
      h1{font-size:25px;color:#4655ad;margin:0 0 6px}h2{font-size:15px;margin:24px 0 8px}p{margin:6px 0;overflow-wrap:anywhere}
      .date{color:#667085}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{padding:10px 8px;border-bottom:1px solid #dce1eb;text-align:left;overflow-wrap:anywhere}
      th{background:#eef0fc}thead{display:table-header-group}tr{break-inside:avoid}th:first-child{width:52%}.number{text-align:right;font-variant-numeric:tabular-nums}
      footer{margin-top:24px;color:#667085;font-size:10px}
      </style></head><body><h1>Project Cost Summary</h1><p class="date">Generated ${escapeHTML(new Date().toLocaleDateString('en-IN'))}</p>
      <h2>Project information</h2><p><b>Project:</b> ${escapeHTML(summary.projectName)}</p><p><b>Client:</b> ${escapeHTML(summary.clientName || '—')}</p>
      <h2>Financial summary</h2><table><tbody>${rows.map(([label,value])=>`<tr><td>${label}</td><td class="number">${money(value)}</td></tr>`).join('')}</tbody></table>
      <h2>Expense breakdown</h2><table><thead><tr><th>Category</th><th class="number">Amount</th><th class="number">% of expenses</th></tr></thead><tbody>
      ${summary.expensesByCategory.length ? summary.expensesByCategory.map(cat=>`<tr><td>${escapeHTML(cat.category)}</td><td class="number">${money(cat.amount)}</td><td class="number">${cat.percentage.toFixed(2)}%</td></tr>`).join('') : '<tr><td colspan="3">No expenses recorded.</td></tr>'}
      </tbody></table><footer>Rizz · Project analytics</footer></body></html>`;
}
// Android WebView print adapters must not render two files at the same time.
let renderQueue: Promise<unknown> = Promise.resolve();
function serializePrint<T>(render: () => Promise<T>): Promise<T> {
    const result = renderQueue.then(render);
    renderQueue = result.catch(() => {});
    return result;
}
async function renderPDF(html: string): Promise<string> {
    return serializePrint(async () => {
        const result = await Print.printToFileAsync({html});
        const info = await FileSystem.getInfoAsync(result.uri);
        if (!info.exists || info.isDirectory || info.size === 0) {
            await FileSystem.deleteAsync(result.uri, {idempotent:true});
            throw new Error('The PDF could not be generated. Try Save as PDF from the print dialog.');
        }
        return result.uri;
    });
}
export const printProjectCost = (summary: ProjectCostSummary) => serializePrint(() => Print.printAsync({html:generateProjectCostHTML(summary)}));
export async function saveProjectCostPDFToDevice(summary: ProjectCostSummary): Promise<'saved'|'cancelled'|'print-dialog'|'shared'> {
    if (Platform.OS === 'web') { await printProjectCost(summary); return 'print-dialog'; }
    const uri = await renderPDF(generateProjectCostHTML(summary));
    try {
        if (Platform.OS !== 'android') {
            if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device');
            await Sharing.shareAsync(uri, {mimeType:'application/pdf',UTI:'.pdf'});
            return 'shared';
        }
        const result = await IntentLauncher.startActivityAsync('android.intent.action.CREATE_DOCUMENT', {
            category:'android.intent.category.OPENABLE',type:'application/pdf',
            extra:{'android.intent.extra.TITLE':safeFilename('project_analytics_'+summary.projectName+'.pdf')},
        });
        if (result.resultCode !== -1) return 'cancelled';
        if (!result.data?.startsWith('content://')) throw new Error('Choose a document location and try again.');
        // The modern file API supports Downloads and cloud document providers.
        await new File(result.data).write(await new File(uri).bytes());
        return 'saved';
    } finally { await FileSystem.deleteAsync(uri,{idempotent:true}).catch(()=>{}); }
}
export const savePDFToDevice = async (filename: string, content: string): Promise<string> => {
    const target = documentPath(filename);
    const uri = await renderPDF('<!doctype html><html><head><meta charset="utf-8"></head><body><pre style="white-space:pre-wrap">' + escapeHTML(content) + '</pre></body></html>');
    await FileSystem.moveAsync({ from: uri, to: target });
    return target;
};
export const generateAndSavePDF = async (summary: ProjectCostSummary): Promise<string> => {
    const filename = safeFilename('project_analytics_' + summary.projectName + '_' + Date.now() + '.pdf');
    const target = documentPath(filename);
    const uri = await renderPDF(generateProjectCostHTML(summary));
    await FileSystem.moveAsync({ from: uri, to: target });
    return target;
};
export const getSavedPDFFiles = async (): Promise<string[]> => {
    if (!FileSystem.documentDirectory) throw new Error('Documents directory unavailable');
    return (await FileSystem.readDirectoryAsync(FileSystem.documentDirectory)).filter(file => file.endsWith('.pdf'));
};
export const deleteSavedPDF = async (filename: string): Promise<void> => { await FileSystem.deleteAsync(documentPath(filename)); };
export const sharePDFContent = async (content: string, filename: string): Promise<void> => {
    const uri = await savePDFToDevice(safeFilename(filename), content);
    if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device');
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
};
export const generateAndSharePDF = downloadProjectCostAsPDF;
