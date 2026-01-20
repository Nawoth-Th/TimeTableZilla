# TimeTableZilla 🦖

**Unleash the true potential of your schedule.**

Exclusively designed for the **SLIIT community**, **TimeTableZilla** transforms your raw HTML timetables into clear, customizable calendars with Google Tasks sync and print-perfect layouts.

![TimeTableZilla Screen](public/icon.png)

## 🌟 Features

- **HTML Parsing**: Upload your raw university HTML timetable and let Zilla do the rest.
- **Smart Filtering**: Auto-detects Semesters, Groups, and Subgroups.
- **Dynamic Calendar View**: View your schedule in a clean, responsive weekly grid.
- **Manual Editing**: Add, edit, or delete classes manually to fix parser errors or add external events.
- **Google Tasks Sync**: One-click sync to your Google Tasks to keep track of every class.
- **Print / PDF Export**: Generate a beautifully formatted PDF tailored for printing (A4 Landscape).
- **Module Coloring**: Visual distinction between different modules.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **pnpm** (recommended) or npm
- **Google Cloud Console Account** (for Sync features)

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/timetablezilla.git
    cd timetablezilla
    ```

2.  **Install dependencies**:

    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env.local` file in the root directory and add your Google Client ID:

    ```env
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
    ```

    > 📝 **Note**: You can leave this blank to run the app, but the Google Tasks Sync feature will not work.

4.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📅 Usage Guide

1.  **Upload**: Drag & drop your SLIIT HTML timetable file.
2.  **Select**: Choose your `Year/Semester` -> `Group` -> `Subgroup` from the dropdowns.
3.  **Customize**:
    - Use the **Edit (Pencil)** icon on any class to change room numbers or times.
    - Use **Add Class** to insert missing sessions.
4.  **Sync**: Click **"Sync to Google Tasks"** to add your schedule to your Google account.
5.  **Print**: Click **"Print / Save PDF"** to get a hard copy or digital PDF backup.

## 🛠️ Built With

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Auth**: [React OAuth Google](https://github.com/MomenSherif/react-oauth)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

_Built with ❤️ for the SLIIT Community._
