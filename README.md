Assignment Deadline Planner

A responsive student assignment planner built with HTML, CSS and basic JavaScript, using a Pastel Pink & Lavender visual theme.

## Files
- `index.html` – page structure and forms
- `style.css` – responsive layout and visual design
- `script.js` – assignment management, filtering, validation and local storage

## Run the project
1. Download and extract the ZIP.
2. Open the `duemate_assignment_planner` folder in Visual Studio Code.
3. Open `index.html` in a browser, or use the VS Code Live Server extension.
4. Add a few assignments to test the dashboard.

## Features
- Create, read, update and delete assignment records.
- Search title, subject, category and notes.
- Filter by status and priority; sort by due date, priority or recently added.
- Dashboard summary and completion percentage.
- Automatic overdue label for unfinished tasks whose due date has passed.
- Form validation and confirmation/success messages.
- Responsive layout for desktop, tablet and mobile.
- Browser Local Storage persistence.

## Important notes
- Data is stored in the browser on the device where the app is used. It is not a shared online database.
- Clearing browser site data may remove saved assignments. For a college demonstration, use the same browser and device.
- The current version does not include login, cloud sync, email reminders or multi-user access. Those would require a backend/database or external service.
- The app uses a Google Fonts import; if offline, it falls back to system sans-serif fonts.

## Suggested viva explanation
1. HTML creates the dashboard, navigation, assignment form and list containers.
2. CSS controls layout, colours, responsive breakpoints and modal styling.
3. JavaScript stores assignment objects in an array and saves that array to `localStorage`.
4. When a user submits the form, JavaScript validates inputs, then adds or updates the matching record.
5. Rendering functions update the dashboard and assignment list from the saved array.
6. Search and filters use JavaScript array filtering; sorting uses array sorting.
