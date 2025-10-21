// Expense Categories mapped to Scope of Work
// Each scope has relevant categories for better expense tracking

import { ScopeOfWork } from './projectsApi';

export interface ExpenseCategory {
    name: string;
    icon: string;
    color: string;
}

export const EXPENSE_CATEGORIES_BY_SCOPE: Record<ScopeOfWork | 'Other' | 'General', ExpenseCategory[]> = {
    // Carpentry & Woodwork
    'Carpentry Work': [
        { name: 'Wood Materials', icon: 'pine-tree', color: '#8B4513' },
        { name: 'Hardware & Fittings', icon: 'hammer', color: '#666' },
        { name: 'Tools & Equipment', icon: 'toolbox', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Transportation', icon: 'truck', color: '#4CAF50' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Furniture Work': [
        { name: 'Wood & Plywood', icon: 'pine-tree', color: '#8B4513' },
        { name: 'Upholstery', icon: 'sofa', color: '#E91E63' },
        { name: 'Hardware', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Cushions & Foam', icon: 'pillow', color: '#9C27B0' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Wardrobe Work': [
        { name: 'Wood & Boards', icon: 'pine-tree', color: '#8B4513' },
        { name: 'Laminates & Finish', icon: 'texture', color: '#795548' },
        { name: 'Sliding Mechanisms', icon: 'door-sliding', color: '#666' },
        { name: 'Mirrors & Glass', icon: 'mirror', color: '#00BCD4' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Wood Flooring': [
        { name: 'Wooden Planks', icon: 'floor-plan', color: '#8B4513' },
        { name: 'Adhesives', icon: 'bottle-tonic-plus', color: '#FFC107' },
        { name: 'Underlayment', icon: 'layers', color: '#9E9E9E' },
        { name: 'Finishing & Polish', icon: 'spray-bottle', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Door & Window Work': [
        { name: 'Doors', icon: 'door', color: '#795548' },
        { name: 'Window Frames', icon: 'window-closed', color: '#607D8B' },
        { name: 'Glass & Glazing', icon: 'window-open-variant', color: '#00BCD4' },
        { name: 'Hardware & Locks', icon: 'lock', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Staircase Work': [
        { name: 'Structural Materials', icon: 'stairs', color: '#666' },
        { name: 'Wood/Metal/Stone', icon: 'square', color: '#795548' },
        { name: 'Railing', icon: 'fence', color: '#546E7A' },
        { name: 'Hardware', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Painting & Finishes
    'Painting Work': [
        { name: 'Paint & Primer', icon: 'format-paint', color: '#FF6B6B' },
        { name: 'Putty & Filler', icon: 'texture-box', color: '#9E9E9E' },
        { name: 'Brushes & Rollers', icon: 'brush', color: '#FF9800' },
        { name: 'Masking Materials', icon: 'tape-measure', color: '#FFC107' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Wallpaper Work': [
        { name: 'Wallpaper Rolls', icon: 'wallpaper', color: '#E91E63' },
        { name: 'Adhesive', icon: 'bottle-tonic', color: '#FFC107' },
        { name: 'Tools', icon: 'toolbox', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Wall Cladding': [
        { name: 'Cladding Panels', icon: 'wall', color: '#78909C' },
        { name: 'Mounting System', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Adhesives & Sealants', icon: 'bottle-tonic-plus', color: '#FFC107' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Plastering Work': [
        { name: 'Cement & Sand', icon: 'sack', color: '#9E9E9E' },
        { name: 'Plaster Mix', icon: 'texture', color: '#BDC3C7' },
        { name: 'Tools', icon: 'toolbox', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Plaster of Paris Work': [
        { name: 'POP Material', icon: 'spray', color: '#E0E0E0' },
        { name: 'Framework', icon: 'grid', color: '#666' },
        { name: 'Tools', icon: 'toolbox', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Metalwork
    'Aluminium Work': [
        { name: 'Aluminium Profiles', icon: 'square-outline', color: '#95A5A6' },
        { name: 'Glass', icon: 'window-open-variant', color: '#00BCD4' },
        { name: 'Hardware', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Steel Fabrication': [
        { name: 'Steel Materials', icon: 'square', color: '#546E7A' },
        { name: 'Welding', icon: 'fire', color: '#FF5722' },
        { name: 'Grinding & Finish', icon: 'spray', color: '#FF9800' },
        { name: 'Paint & Coating', icon: 'format-paint', color: '#FF6B6B' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Railing Work': [
        { name: 'Railing Materials', icon: 'fence', color: '#455A64' },
        { name: 'Glass Panels', icon: 'window-open-variant', color: '#00BCD4' },
        { name: 'Fixing Hardware', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Civil & Structural
    'Structural Work': [
        { name: 'Cement', icon: 'sack', color: '#9E9E9E' },
        { name: 'Steel Bars', icon: 'square-outline', color: '#546E7A' },
        { name: 'Aggregate', icon: 'circle-multiple', color: '#795548' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Equipment Rental', icon: 'excavator', color: '#FF9800' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Civil Work': [
        { name: 'Construction Materials', icon: 'wall', color: '#7F8C8D' },
        { name: 'Equipment', icon: 'hard-hat', color: '#F39C12' },
        { name: 'Safety Gear', icon: 'shield-check', color: '#4CAF50' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Masonry Work': [
        { name: 'Bricks/Blocks', icon: 'wall', color: '#D32F2F' },
        { name: 'Cement & Sand', icon: 'sack', color: '#9E9E9E' },
        { name: 'Tools', icon: 'toolbox', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Demolition Work': [
        { name: 'Equipment Rental', icon: 'excavator', color: '#F39C12' },
        { name: 'Safety Equipment', icon: 'shield-check', color: '#4CAF50' },
        { name: 'Waste Disposal', icon: 'trash-can', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Site Preparation': [
        { name: 'Excavation', icon: 'excavator', color: '#F57C00' },
        { name: 'Leveling', icon: 'layers', color: '#9E9E9E' },
        { name: 'Equipment Rental', icon: 'truck', color: '#4CAF50' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Flooring & Tiling
    'Flooring Work': [
        { name: 'Flooring Material', icon: 'floor-plan', color: '#D4A574' },
        { name: 'Adhesive & Grout', icon: 'bottle-tonic-plus', color: '#FFC107' },
        { name: 'Underlayment', icon: 'layers', color: '#9E9E9E' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Tiling Work': [
        { name: 'Tiles', icon: 'grid', color: '#16A085' },
        { name: 'Adhesive', icon: 'bottle-tonic', color: '#FFC107' },
        { name: 'Grout & Sealant', icon: 'spray-bottle', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Marble & Granite Work': [
        { name: 'Stone Slabs', icon: 'square', color: '#424242' },
        { name: 'Cutting & Polishing', icon: 'spray', color: '#FF9800' },
        { name: 'Adhesive', icon: 'bottle-tonic-plus', color: '#FFC107' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Electrical & Lighting
    'Electrical Work': [
        { name: 'Wiring & Cables', icon: 'cable-data', color: '#F39C12' },
        { name: 'Switches & Sockets', icon: 'light-switch', color: '#666' },
        { name: 'Circuit Breakers', icon: 'fuse', color: '#FF5722' },
        { name: 'Tools & Equipment', icon: 'toolbox', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Lighting Work': [
        { name: 'Light Fixtures', icon: 'lightbulb-on', color: '#FFC107' },
        { name: 'Bulbs & LED', icon: 'lightbulb', color: '#FFD54F' },
        { name: 'Wiring', icon: 'cable-data', color: '#FF9800' },
        { name: 'Installation', icon: 'hammer-screwdriver', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Plumbing & Sanitary
    'Plumbing Work': [
        { name: 'Pipes & Fittings', icon: 'pipe', color: '#3498DB' },
        { name: 'Valves & Taps', icon: 'water-pump', color: '#00BCD4' },
        { name: 'Sealants', icon: 'bottle-tonic', color: '#FFC107' },
        { name: 'Tools', icon: 'wrench', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Bathroom Fitting': [
        { name: 'Sanitary Ware', icon: 'shower', color: '#26C6DA' },
        { name: 'Fittings & Fixtures', icon: 'water-pump', color: '#00BCD4' },
        { name: 'Tiles & Stone', icon: 'grid', color: '#16A085' },
        { name: 'Pipes & Plumbing', icon: 'pipe', color: '#3498DB' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Waterproofing Work': [
        { name: 'Waterproof Membrane', icon: 'water-off', color: '#2980B9' },
        { name: 'Sealants', icon: 'spray-bottle', color: '#FFC107' },
        { name: 'Chemical Treatment', icon: 'bottle-tonic-plus', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Ceiling & Partition
    'False Ceiling Work': [
        { name: 'Gypsum Boards', icon: 'square-outline', color: '#ECF0F1' },
        { name: 'Framework', icon: 'grid', color: '#666' },
        { name: 'Lights & Fixtures', icon: 'ceiling-light', color: '#FFC107' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Partition Work': [
        { name: 'Partition Panels', icon: 'view-split-vertical', color: '#607D8B' },
        { name: 'Framework', icon: 'grid', color: '#666' },
        { name: 'Hardware', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Glazing Work': [
        { name: 'Glass Sheets', icon: 'window-open-variant', color: '#5DADE2' },
        { name: 'Framework', icon: 'square-outline', color: '#666' },
        { name: 'Sealants', icon: 'bottle-tonic', color: '#FFC107' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Interior & Decor
    'Interior Decoration': [
        { name: 'Decorative Items', icon: 'sofa', color: '#E91E63' },
        { name: 'Fabrics & Textiles', icon: 'pillow', color: '#9C27B0' },
        { name: 'Wall Decor', icon: 'picture-frame', color: '#FF6B6B' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Kitchen & Modular Work': [
        { name: 'Cabinets', icon: 'cupboard', color: '#E74C3C' },
        { name: 'Countertop', icon: 'countertop', color: '#424242' },
        { name: 'Appliances', icon: 'fridge', color: '#666' },
        { name: 'Hardware & Fittings', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Curtain & Blinds': [
        { name: 'Fabric & Material', icon: 'blinds', color: '#AB47BC' },
        { name: 'Rods & Rails', icon: 'minus', color: '#666' },
        { name: 'Hardware', icon: 'screw-machine-round-top', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Exterior & Outdoor
    'Exterior Decoration': [
        { name: 'Facade Materials', icon: 'home-city', color: '#9C27B0' },
        { name: 'Lighting', icon: 'lightbulb-on', color: '#FFC107' },
        { name: 'Paint & Coating', icon: 'format-paint', color: '#FF6B6B' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Landscaping Work': [
        { name: 'Plants & Trees', icon: 'tree', color: '#27AE60' },
        { name: 'Soil & Fertilizer', icon: 'sack', color: '#795548' },
        { name: 'Irrigation', icon: 'water', color: '#3498DB' },
        { name: 'Hardscape', icon: 'square', color: '#666' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Roofing Work': [
        { name: 'Roofing Material', icon: 'home-roof', color: '#D32F2F' },
        { name: 'Framework', icon: 'grid', color: '#666' },
        { name: 'Waterproofing', icon: 'water-off', color: '#2980B9' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Mechanical & HVAC
    'HVAC Work': [
        { name: 'AC Units', icon: 'air-conditioner', color: '#00BCD4' },
        { name: 'Ducting', icon: 'pipe', color: '#666' },
        { name: 'Installation', icon: 'tools', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Insulation Work': [
        { name: 'Insulation Material', icon: 'thermometer', color: '#0288D1' },
        { name: 'Installation', icon: 'hammer-screwdriver', color: '#FF9800' },
        { name: 'Labor Cost', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Complete Projects
    'Complete Interior Fit-out': [
        { name: 'Materials', icon: 'package-variant', color: '#667eea' },
        { name: 'Labor', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Equipment', icon: 'toolbox', color: '#FF9800' },
        { name: 'Professional Fees', icon: 'cash', color: '#4CAF50' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Complete Renovation': [
        { name: 'Materials', icon: 'package-variant', color: '#764ba2' },
        { name: 'Labor', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Equipment', icon: 'toolbox', color: '#FF9800' },
        { name: 'Professional Fees', icon: 'cash', color: '#4CAF50' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],
    'Turnkey Project': [
        { name: 'Materials', icon: 'package-variant', color: '#4CAF50' },
        { name: 'Labor', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Equipment', icon: 'toolbox', color: '#FF9800' },
        { name: 'Professional Fees', icon: 'cash', color: '#4CAF50' },
        { name: 'Permits & Approvals', icon: 'file-document-check', color: '#FF5722' },
        { name: 'Other', icon: 'dots-horizontal', color: '#999' },
    ],

    // Other & General
    'Other': [
        { name: 'Materials', icon: 'package-variant', color: '#666' },
        { name: 'Labor', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Equipment', icon: 'toolbox', color: '#FF9800' },
        { name: 'Transportation', icon: 'truck', color: '#4CAF50' },
        { name: 'Miscellaneous', icon: 'dots-horizontal', color: '#999' },
    ],
    'General': [
        { name: 'Materials', icon: 'package-variant', color: '#666' },
        { name: 'Labor', icon: 'account-hard-hat', color: '#2196F3' },
        { name: 'Equipment', icon: 'toolbox', color: '#FF9800' },
        { name: 'Professional Fees', icon: 'cash', color: '#4CAF50' },
        { name: 'Transportation', icon: 'truck', color: '#4CAF50' },
        { name: 'Miscellaneous', icon: 'dots-horizontal', color: '#999' },
    ],
};

// Helper function to get categories for a scope
export const getCategoriesForScope = (scope: ScopeOfWork | 'Other' | 'General'): ExpenseCategory[] => {
    return EXPENSE_CATEGORIES_BY_SCOPE[scope] || EXPENSE_CATEGORIES_BY_SCOPE['General'];
};

// Helper function to get all unique categories
export const getAllExpenseCategories = (): ExpenseCategory[] => {
    const allCategories = new Map<string, ExpenseCategory>();
    
    Object.values(EXPENSE_CATEGORIES_BY_SCOPE).forEach(categories => {
        categories.forEach(cat => {
            if (!allCategories.has(cat.name)) {
                allCategories.set(cat.name, cat);
            }
        });
    });
    
    return Array.from(allCategories.values());
};
