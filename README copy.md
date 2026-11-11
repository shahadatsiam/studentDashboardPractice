# DIU NEXUS — Student Command Center

A responsive, dark + neon student productivity dashboard built with vanilla HTML, CSS and JavaScript.

## Features
- Overview cards for CGPA, attendance, courses and pending tasks
- Course CRUD with weighted CGPA calculation (4.00 scale)
- Per-course attendance tracker
- Weekly class routine
- Assignment/task manager with due dates, priorities and completion filters
- Quick notes with create/edit/delete
- Pomodoro focus timer (25-minute focus, 5-minute and 15-minute breaks)
- Academic analytics
- Editable student profile
- JSON backup export/import
- Local browser storage; responsive sidebar and mobile layout

## Folder structure
```text
diu-nexus/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Run locally
1. Download and extract `diu-nexus.zip`.
2. Open the `diu-nexus` folder in VS Code.
3. Open `index.html` in a browser, or use the VS Code **Live Server** extension and choose **Open with Live Server**.
4. Go to Settings to edit your display name, department and batch/section.
5. Add your own courses, grades, class counts, routine and tasks.

No build command, package installation or API key is required. Google Fonts are loaded from the internet; the app itself works without them using system font fallbacks.

## Deploy on GitHub Pages
1. Create a GitHub repository, e.g. `diu-nexus`.
2. Upload `index.html`, `styles.css`, `app.js` and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then Save.
6. Wait for the Pages URL to appear.

## Deploy on Netlify
1. Extract the ZIP.
2. Open Netlify and choose **Add new site → Deploy manually**.
3. Drag the extracted `diu-nexus` folder into the deploy area.
4. Netlify publishes the site and provides a public URL.

## Important data note
This is a front-end, local-first demo. Your information is saved in `localStorage` in the current browser on the current device. It is not automatically synced between devices or users. Use Settings → Export backup to download a JSON backup. Import it on another device/browser to restore the data.

This is an independent student productivity tool, not an official DIU portal and not connected to DIU servers. Do not enter passwords, payment details, or sensitive personal information.

## CGPA note
The app uses this editable grade-point mapping:
A+ 4.00, A 3.75, A- 3.50, B+ 3.25, B 3.00, B- 2.75, C+ 2.50, C 2.25, D 2.00, F 0.00.
Confirm the applicable grading scale with your department before relying on a calculated result.
