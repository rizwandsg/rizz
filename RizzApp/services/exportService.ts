import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
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
            `"${cat.category}",₹${cat.amount.toFixed(2)},${cat.percentage.toFixed(2)}%`
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
    return '<!doctype html><html><head><meta charset="utf-8"><style>body{font-family: sans-serif;padding:24px}pre{white-space:pre-wrap;font-size:12px}</style></head><body><pre>' + escapeHTML(generateProjectCostPDF(summary)) + '</pre></body></html>';
}
export const savePDFToDevice = async (filename: string, content: string): Promise<string> => {
    const target = documentPath(filename);
    const result = await Print.printToFileAsync({ html: '<html><body><pre>' + escapeHTML(content) + '</pre></body></html>' });
    await FileSystem.moveAsync({ from: result.uri, to: target });
    return target;
};
export const generateAndSavePDF = async (summary: ProjectCostSummary): Promise<string> => {
    const filename = safeFilename('project_analytics_' + summary.projectName + '_' + Date.now() + '.pdf');
    const target = documentPath(filename);
    const result = await Print.printToFileAsync({ html: generateProjectCostHTML(summary) });
    await FileSystem.moveAsync({ from: result.uri, to: target });
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
