# Testing the Pill Tracking System

## How the System Works:

### 1. **Starting a Cycle:**
- Click the **Start** button
- A dialog will appear asking for the **Lot Number** (REQUIRED)
- Enter the lot number and click "Start Cycle"
- Only AFTER confirming the lot number, the START command is sent to the machine
- The tracking begins immediately

### 2. **During Operation:**
- Pill weights are automatically recorded during the PESAJE (weighing) state
- Data is saved to localStorage in real-time
- View tracking info in the right panel
- If the app crashes, data is automatically recovered on restart

### 3. **Stopping a Cycle:**
- Click the **Stop** button
- If there's tracked data, a save dialog will appear
- Choose where to save the CSV file
- The cycle ends only after saving (or canceling)

## Debugging:

Check the browser console for these messages:
- "Start button clicked - showing lot dialog" - when Start is clicked
- "Lot dialog state changed: true/false" - when dialog opens/closes
- "Lot dialog submit - lot number: XXX" - when lot is submitted

## Important Notes:

1. **NO cycle starts without a lot number** - it's mandatory
2. **Data persists** in localStorage automatically
3. **Recovery** happens on app restart if there was an incomplete cycle
4. **Stop button** shows save dialog for the CSV file

## Troubleshooting:

If the dialog doesn't appear:
1. Check browser console for errors
2. Make sure the Dialog component from shadcn/ui is properly installed
3. Check that all imports are correct
4. Verify the LotNumberDialog component renders correctly

The system enforces:
- Lot number before ANY cycle start
- Data persistence to prevent loss
- Manual save location selection on cycle end