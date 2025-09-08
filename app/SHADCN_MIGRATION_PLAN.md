# Shadcn/UI Migration Plan for Lotech App

## Overview
This document outlines the step-by-step migration plan to integrate shadcn/ui components into the Lotech application, replacing custom styled components with a consistent, modern component library.

## Phase 1: Setup and Configuration (Current)

### 1.1 Install Core Dependencies
```bash
# Core dependencies
pnpm add class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-slider
pnpm add @radix-ui/react-switch @radix-ui/react-toast @radix-ui/react-label
```

### 1.2 Configure shadcn
- Set up `components.json` configuration
- Create `lib/utils.ts` for cn() helper
- Set up component directory structure at `src/renderer/src/components/ui/`

### 1.3 Update Tailwind Configuration
- Add shadcn theme variables
- Configure dark mode support
- Add animation utilities

## Phase 2: Core Component Installation

### 2.1 Essential Components to Install First
1. **Button** - Replace all custom buttons
2. **Card** - For panels and containers
3. **Dialog** - For Settings modal
4. **Select** - For port selection
5. **Switch** - For simulation toggle
6. **Slider** - For delay settings
7. **Input** - For form inputs
8. **Label** - For form labels
9. **Toast** - For notifications

### 2.2 Installation Commands
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog select switch slider input label toast
```

## Phase 3: Component Migration Order

### 3.1 MachineControls (Priority: High)
**Current**: Custom styled buttons with inline styles
**Target**: 
- Use shadcn `Button` with variants
- Use shadcn `Switch` for simulation toggle
- Maintain floating panel with shadcn styling

**Components needed**: Button, Switch

### 3.2 ConnectionScreen (Priority: High)
**Current**: Custom styled select and button
**Target**:
- Use shadcn `Card` for container
- Use shadcn `Select` for port selection
- Use shadcn `Button` for connect action

**Components needed**: Card, Select, Button

### 3.3 Settings Dialog (Priority: Medium)
**Current**: Custom modal with inline styles
**Target**:
- Use shadcn `Dialog` for modal
- Use shadcn `Slider` for delay controls
- Use shadcn `Input` for numeric inputs
- Use shadcn `Button` for view mode toggle

**Components needed**: Dialog, Slider, Input, Button, Label

### 3.4 Header (Priority: Medium)
**Current**: Custom buttons and styling
**Target**:
- Use shadcn `Button` with icon variants
- Consistent spacing and styling

**Components needed**: Button

### 3.5 Status Panels (Priority: Low)
**Current**: Custom styled divs
**Target**:
- Use shadcn `Card` for panels
- Use shadcn `Progress` for progress bars

**Components needed**: Card, Progress

### 3.6 ConsoleOverlay (Priority: Low)
**Current**: Custom styled overlay
**Target**:
- Use shadcn `Card` with custom positioning
- Add shadcn `ScrollArea` for better scrolling

**Components needed**: Card, ScrollArea

## Phase 4: Theme and Styling

### 4.1 Create Theme Configuration
- Set up CSS variables for colors
- Configure dark/light mode toggle
- Create consistent spacing system

### 4.2 Update Global Styles
```css
/* Add to main.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other variables */
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... other variables */
  }
}
```

## Phase 5: Advanced Features

### 5.1 Add Notifications
- Implement `Toast` for command feedback
- Add success/error notifications
- Connection status notifications

### 5.2 Form Validation
- Add form validation for settings
- Use React Hook Form with shadcn Form component
- Add error states and messages

### 5.3 Keyboard Shortcuts
- Add keyboard shortcuts for common actions
- Use shadcn `Kbd` component for displaying shortcuts
- Implement command palette (optional)

## Phase 6: Testing and Refinement

### 6.1 Component Testing
- Test all migrated components
- Ensure serial communication still works
- Verify 3D view integration

### 6.2 Performance Optimization
- Remove unused CSS
- Tree-shake unused components
- Optimize bundle size

### 6.3 Accessibility
- Ensure keyboard navigation works
- Add proper ARIA labels
- Test with screen readers

## Migration Benefits

1. **Consistency**: Unified design system across all components
2. **Accessibility**: Built-in ARIA support and keyboard navigation
3. **Maintenance**: Easier to update and maintain
4. **Performance**: Optimized components with proper React patterns
5. **Customization**: Easy theming with CSS variables
6. **Type Safety**: Full TypeScript support

## Current State Analysis

### Components to Migrate:
- [x] Identified: MachineControls
- [x] Identified: ConnectionScreen  
- [x] Identified: Settings
- [x] Identified: Header
- [x] Identified: ConsoleOverlay
- [x] Identified: Dashboard3D status panel
- [x] Identified: ProcessStepper
- [x] Identified: ControlPanel

### Existing Dependencies:
- ✅ Tailwind CSS (already installed)
- ✅ TypeScript (already configured)
- ✅ React 19 (compatible)
- ⚠️ Need to add Radix UI primitives

## Implementation Timeline

**Week 1**: Setup and core components (Button, Card, Dialog)
**Week 2**: Migrate control components (MachineControls, Header)
**Week 3**: Migrate forms and settings (Settings, ConnectionScreen)
**Week 4**: Polish and additional features (Toast, themes)

## Notes

- Start with high-impact, frequently used components
- Maintain backward compatibility during migration
- Test each component thoroughly before moving to the next
- Keep the 3D view integration stable throughout migration
- Ensure serial communication remains unaffected